import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'node:crypto';

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(name: string, ownerId: string) {
    const owner = await this.prisma.user.findUnique({
      where: { id: ownerId },
      select: { id: true, email: true, displayName: true },
    });

    if (!owner) {
      throw new NotFoundException('Owner user not found');
    }

    return this.prisma.board.create({
      data: {
        name: name.trim(),
        ownerId,
        members: {
          create: {
            userId: owner.id,
            displayName: owner.displayName,
          },
        },
      },
      include: {
        members: {
          include: { user: true },
        },
      },
    });
  }

  async findMine(userId: string) {
    return this.prisma.board.findFirst({
      where: {
        members: {
          some: { userId },
        },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        members: {
          include: { user: true },
        },
      },
    });
  }

  async createInvite(
    boardId: string,
    invitedBy: string,
    invitedEmail: string,
  ) {
    const board = await this.prisma.board.findFirst({
      where: {
        id: boardId,
        members: { some: { userId: invitedBy } },
      },
      select: { id: true },
    });
    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return this.prisma.boardInvite.create({
      data: {
        boardId,
        invitedBy,
        invitedEmail: invitedEmail.trim().toLowerCase(),
        token: randomUUID(),
      },
      select: {
        token: true,
        invitedEmail: true,
        boardId: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async getInvite(token: string) {
    const invite = await this.prisma.boardInvite.findUnique({
      where: { token },
      include: {
        board: {
          select: {
            id: true,
            name: true,
            _count: { select: { members: true } },
          },
        },
        sender: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    return {
      token: invite.token,
      invitedEmail: invite.invitedEmail,
      status: invite.status,
      board: {
        id: invite.board.id,
        name: invite.board.name,
        memberCount: invite.board._count.members,
      },
      sender: {
        id: invite.sender.id,
        email: invite.sender.email,
        displayName: invite.sender.displayName,
      },
    };
  }

  async acceptInvite(token: string, userId: string) {
    const invite = await this.prisma.boardInvite.findUnique({
      where: { token },
      include: {
        board: true,
        sender: true,
      },
    });
    if (!invite) {
      throw new NotFoundException('Invite not found');
    }
    if (invite.status === 'ACCEPTED') {
      return invite;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, displayName: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.email.toLowerCase() !== invite.invitedEmail.toLowerCase()) {
      throw new NotFoundException(
        'This invite was sent to a different email address. Please register with the email that received the invite.',
      );
    }

    await this.prisma.member.upsert({
      where: {
        boardId_userId: {
          boardId: invite.boardId,
          userId: user.id,
        },
      },
      create: {
        boardId: invite.boardId,
        userId: user.id,
        displayName: user.displayName,
      },
      update: {},
    });

    return this.prisma.boardInvite.update({
      where: { id: invite.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
      include: {
        board: { select: { id: true, name: true } },
      },
    });
  }
}
