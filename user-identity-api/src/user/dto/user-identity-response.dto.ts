import { ApiProperty } from '@nestjs/swagger';

export class UserIdentityResponseDto {
	@ApiProperty({
		description: 'Persistent UUID v4 associated with the identity combination',
		example: '550e8400-e29b-41d4-a716-446655440000',
		format: 'uuid',
	})
	readonly userID: string;
}