import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import ogs from 'open-graph-scraper';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateRecipeDto, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hasAccess = await this.hasBoardAccess(data.boardId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this board');
    }

    const normalizedUrl = this.normalizeUrl(data.url);
    const metadata = await this.extractMetadata(normalizedUrl);

    return this.prisma.recipe.create({
      data: {
        url: normalizedUrl,
        boardId: data.boardId,
        createdBy: userId,
        title: metadata.title,
        image: metadata.image,
        description: metadata.description,
        status: 'WANT_TO_TRY',
        cookedAt: null,
        notes: null,
        tags: [],
      },
    });
  }

  async findByBoard(boardId: string, userId: string) {
    const hasAccess = await this.hasBoardAccess(boardId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this board');
    }

    return this.prisma.recipe.findMany({
      where: { boardId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string, userId: string) {
    const recipe = await this.prisma.recipe.findFirst({
      where: {
        id,
        board: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
      select: { id: true },
    });
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    return this.prisma.recipe.delete({ where: { id } });
  }

  async update(id: string, userId: string, data: UpdateRecipeDto) {
    const recipe = await this.prisma.recipe.findFirst({
      where: {
        id,
        board: {
          members: {
            some: { userId },
          },
        },
      },
      select: { id: true },
    });
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    const nextData: {
      status?: 'WANT_TO_TRY' | 'COOKED';
      cookedAt?: Date | null;
      tags?: string[];
      notes?: string | null;
    } = {};

    if (data.status) {
      nextData.status = data.status;
      nextData.cookedAt = data.status === 'COOKED' ? new Date() : null;
    }
    if (data.tags) {
      nextData.tags = data.tags;
    }
    if (data.notes !== undefined) {
      nextData.notes = data.notes?.trim() ? data.notes.trim() : null;
    }

    return this.prisma.recipe.update({ where: { id }, data: nextData });
  }

  private async extractMetadata(url: string) {
    try {
      const { result } = await ogs({ url });
      return {
        title: result.ogTitle ?? null,
        image: result.ogImage?.[0]?.url ?? null,
        description: result.ogDescription ?? null,
      };
    } catch {
      return {
        title: null,
        image: null,
        description: null,
      };
    }
  }

  private normalizeUrl(rawUrl: string): string {
    try {
      return new URL(rawUrl.trim()).toString();
    } catch {
      throw new BadRequestException('Invalid URL format');
    }
  }

  private async hasBoardAccess(boardId: string, userId: string) {
    const board = await this.prisma.board.findFirst({
      where: {
        id: boardId,
        members: {
          some: { userId },
        },
      },
      select: { id: true },
    });
    return !!board;
  }
}
