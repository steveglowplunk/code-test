import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { GetOrCreateUserIdDto } from './dto/create-user.dto.js';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UserService {
	private readonly logger = new Logger(UserService.name);

	constructor(private readonly prisma: PrismaService) { }

	async getOrCreateUserId(dto: GetOrCreateUserIdDto): Promise<string> {
		try {
			const existingUser = await this.prisma.user_identities.findUnique({
				where: {
					id1_id2: {
						id1: dto.id1,
						id2: dto.id2
					},
				},
				select: {
					user_id: true
				}
			});

			if (existingUser) {
				return existingUser.user_id;
			}

			const userId = randomUUID();

			const createdUser = await this.prisma.user_identities.create({
				data: {
					id1: dto.id1,
					id2: dto.id2,
					user_id: userId
				},
				select: {
					user_id: true
				}
			});

			return createdUser.user_id;
		} catch (error: unknown) {
			this.logger.error(
				'Failed to get or create a user identity',
				error instanceof Error ? error.stack : undefined,
			);
			throw new InternalServerErrorException(
				'Unable to process the user identity request',
			);
		}
	}
}
