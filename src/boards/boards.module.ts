import { Module } from '@nestjs/common';
import { BoardsController } from './boards.controller';
import { RecipesModule } from '../recipes/recipes.module';
import { BoardsService } from './boards.service';

@Module({
  imports: [RecipesModule],
  controllers: [BoardsController],
  providers: [BoardsService],
})
export class BoardsModule {}
