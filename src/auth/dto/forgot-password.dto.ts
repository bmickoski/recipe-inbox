import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'bojan@example.com' })
  @IsString()
  @IsEmail()
  email!: string;
}
