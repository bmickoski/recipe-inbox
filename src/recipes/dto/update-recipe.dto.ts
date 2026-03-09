import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export enum RecipeStatusDto {
  WANT_TO_TRY = 'WANT_TO_TRY',
  COOKED = 'COOKED',
}

export class UpdateRecipeDto {
  @ApiPropertyOptional({
    enum: RecipeStatusDto,
    example: RecipeStatusDto.COOKED,
  })
  @IsOptional()
  @IsEnum(RecipeStatusDto)
  status?: RecipeStatusDto;

  @ApiPropertyOptional({ type: [String], example: ['Dinner', 'Weekend'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    example: 'Kids loved this. Add extra garlic next time.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}
