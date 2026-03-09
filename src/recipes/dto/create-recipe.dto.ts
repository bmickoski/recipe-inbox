import { IsString, IsUrl, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRecipeDto {
  @ApiProperty({ example: 'https://www.bbcgoodfood.com/recipes/chicken-pasta' })
  @IsString()
  @IsUrl({ require_protocol: true })
  url!: string;

  @ApiProperty({ example: '77ec39cc-67bb-47f3-9dc4-d3de2ed4b6e5' })
  @IsString()
  @IsUUID()
  boardId!: string;
}
