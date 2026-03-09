import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBoardDto {
  @ApiProperty({ example: 'Family Recipes' })
  @IsString()
  @Length(1, 100)
  name!: string;
}
