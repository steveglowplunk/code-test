import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GetOrCreateUserIdDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly id1: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly id2: string;
}