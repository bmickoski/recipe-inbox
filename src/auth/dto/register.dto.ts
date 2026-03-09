import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Bojan' })
  @IsString()
  @MinLength(2)
  displayName!: string;

  @ApiProperty({ example: 'bojan@example.com' })
  @IsString()
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @MinLength(8)
  password!: string;
}
