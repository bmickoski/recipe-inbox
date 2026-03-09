import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtUser } from '../auth/types/jwt-user.type';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

@ApiTags('recipes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @ApiOperation({ summary: 'Create recipe from URL and metadata extraction' })
  @Post()
  async create(@Body() body: CreateRecipeDto, @CurrentUser() user: JwtUser) {
    return this.recipesService.create(body, user.sub);
  }

  @ApiOperation({ summary: 'Delete recipe by id' })
  @ApiParam({ name: 'id', example: '5d6011d5-b1c4-4d99-b09b-e3f07096b306' })
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.recipesService.remove(id, user.sub);
  }

  @ApiOperation({ summary: 'Update recipe status or tags' })
  @ApiParam({ name: 'id', example: '5d6011d5-b1c4-4d99-b09b-e3f07096b306' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateRecipeDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.recipesService.update(id, user.sub, body);
  }
}
