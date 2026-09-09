import { Injectable } from '@nestjs/common';
import { GetOrCreateUserIdDto } from './dto/create-user.dto.js';
import { randomUUID } from 'crypto';

@Injectable()
export class UserService {
	private readonly dummyUsers = [
		{
			id1: 'ABC123',
			id2: 'DEF456',
			userId: 'random-stuff',
		},
		{
			id1: 'GHI789',
			id2: 'JKL012',
			userId: 'random-stuff-2',
		},
	];

	getOrCreateUserId(dto: GetOrCreateUserIdDto): string {
		const existingUser = this.dummyUsers.find((user) => 
			user.id1 === dto.id1 && user.id2 === dto.id2
		);

		if (existingUser) {
			return existingUser.userId;
		}

		const userId = randomUUID();

		this.dummyUsers.push({
			...dto,
			userId,
		});

		return userId;
	}
}
