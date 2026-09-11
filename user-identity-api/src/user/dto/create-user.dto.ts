import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class GetOrCreateUserIdDto {
  @ApiProperty({
    description: 'First identifier in the user identity combination',
    example: 'ABC123',
    minLength: 1,
    maxLength: 255,
    pattern: '^\\S+$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\S+$/, {
    message: 'id1 must not contain whitespace',
  })
  @MaxLength(255)
  readonly id1: string;

  @ApiProperty({
    description: 'Second identifier in the user identity combination',
    example: 'XYZ456',
    minLength: 1,
    maxLength: 255,
    pattern: '^\\S+$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\S+$/, {
    message: 'id2 must not contain whitespace',
  })
  @MaxLength(255)
  readonly id2: string;
}