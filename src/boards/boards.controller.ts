import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtUser } from '../auth/types/jwt-user.type';
import { RecipesService } from '../recipes/recipes.service';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { CreateBoardInviteDto } from './dto/create-board-invite.dto';

@ApiTags('boards')
@ApiBearerAuth()
@Controller('boards')
export class BoardsController {
  constructor(
    private readonly recipesService: RecipesService,
    private readonly boardsService: BoardsService,
  ) {}

  @ApiOperation({ summary: 'Create board' })
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: CreateBoardDto, @CurrentUser() user: JwtUser) {
    const board = await this.boardsService.create(body.name, user.sub);
    return mapBoard(board);
  }

  @ApiOperation({ summary: 'Get current user board' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMine(@CurrentUser() user: JwtUser) {
    const board = await this.boardsService.findMine(user.sub);
    return board ? mapBoard(board) : null;
  }

  @ApiOperation({ summary: 'Create board invite by email' })
  @UseGuards(JwtAuthGuard)
  @Post(':boardId/invites')
  async createInvite(
    @Param('boardId') boardId: string,
    @Body() body: CreateBoardInviteDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.boardsService.createInvite(boardId, user.sub, body.email);
  }

  @ApiOperation({ summary: 'Get board invite by token' })
  @Get('invites/:token')
  async getInvite(@Param('token') token: string) {
    return this.boardsService.getInvite(token);
  }

  @ApiOperation({ summary: 'Accept board invite by token' })
  @UseGuards(JwtAuthGuard)
  @Post('invites/:token/accept')
  async acceptInvite(@Param('token') token: string, @CurrentUser() user: JwtUser) {
    return this.boardsService.acceptInvite(token, user.sub);
  }

  @ApiOperation({ summary: 'List recipes by board' })
  @ApiParam({ name: 'boardId', example: '77ec39cc-67bb-47f3-9dc4-d3de2ed4b6e5' })
  @UseGuards(JwtAuthGuard)
  @Get(':boardId/recipes')
  async getRecipes(
    @Param('boardId') boardId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.recipesService.findByBoard(boardId, user.sub);
  }
}

function mapBoard(board: any) {
  return {
    id: board.id,
    name: board.name,
    members: (board.members ?? []).map((member: any) => ({
      userId: member.userId,
      email: member.user?.email ?? '',
      displayName: member.displayName,
    })),
  };
}
