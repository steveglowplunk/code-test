import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GetOrCreateUserIdDto {
  @ApiProperty({
    description: 'First identifier in the user identity combination',
    example: 'ABC123',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly id1: string;

  @ApiProperty({
    description: 'Second identifier in the user identity combination',
    example: 'XYZ456',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly id2: string;
}