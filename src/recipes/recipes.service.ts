import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import ogs from 'open-graph-scraper';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { RecipeStatusDto, UpdateRecipeDto } from './dto/update-recipe.dto';

const MAX_METADATA_TITLE = 120;
const MAX_METADATA_DESCRIPTION = 320;

@Injectable()
export class RecipesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pushService: PushService,
  ) {}

  async create(data: CreateRecipeDto, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, displayName: true },
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

    const recipe = await this.prisma.recipe.create({
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

    void this.pushService.notifyBoardMembers(data.boardId, userId, {
      title: `${user.displayName} saved a recipe`,
      body: recipe.title ?? 'A new recipe was saved to your board',
      recipeId: recipe.id,
    });

    return recipe;
  }

  async findByBoard(boardId: string, userId: string) {
    const board = await this.prisma.board.findFirst({
      where: {
        id: boardId,
        members: {
          some: { userId },
        },
      },
      select: {
        recipes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!board) {
      throw new ForbiddenException('You do not have access to this board');
    }

    return board.recipes;
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
      select: { id: true, title: true, boardId: true },
    });
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    const deleted = await this.prisma.recipe.delete({ where: { id } });

    const sender = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { displayName: true },
    });

    void this.pushService.notifyBoardMembers(recipe.boardId, userId, {
      title: `${sender?.displayName ?? 'Someone'} removed a recipe`,
      body: recipe.title ?? 'A recipe was removed from your board',
    });

    return deleted;
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
      status?: RecipeStatusDto;
      cookedAt?: Date | null;
      tags?: string[];
      notes?: string | null;
    } = {};

    if (data.status) {
      nextData.status = data.status;
      nextData.cookedAt =
        data.status === RecipeStatusDto.COOKED ? new Date() : null;
    }
    if (data.tags) {
      nextData.tags = data.tags;
    }
    if (data.notes !== undefined) {
      nextData.notes = data.notes?.trim() ? data.notes.trim() : null;
    }

    const updatedRecipe = await this.prisma.recipe.update({
      where: { id },
      data: nextData,
    });

    if (nextData.status === RecipeStatusDto.COOKED) {
      const sender = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { displayName: true },
      });
      void this.pushService.notifyBoardMembers(updatedRecipe.boardId, userId, {
        title: `${sender?.displayName ?? 'Someone'} cooked a recipe!`,
        body: updatedRecipe.title ?? 'They marked a recipe as cooked',
        recipeId: updatedRecipe.id,
      });
    }

    return updatedRecipe;
  }

  private async extractMetadata(url: string) {
    try {
      const { result } = await ogs({ url });
      return {
        title: sanitizeMetadataText(result.ogTitle, MAX_METADATA_TITLE),
        image: result.ogImage?.[0]?.url ?? null,
        description: sanitizeMetadataText(
          result.ogDescription,
          MAX_METADATA_DESCRIPTION,
        ),
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

function sanitizeMetadataText(
  value: string | null | undefined,
  maxLength: number,
): string | null {
  if (!value) return null;

  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) return null;

  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3)}...`;
}
