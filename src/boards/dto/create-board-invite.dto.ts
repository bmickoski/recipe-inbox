import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateBoardInviteDto {
  @ApiProperty({ example: 'ana@example.com' })
  @IsString()
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Ana', required: false })
  @IsString()
  @IsOptional()
  @MinLength(2)
  displayName?: string;
}
