import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { GetOrCreateUserIdDto } from './dto/create-user.dto.js';

@Injectable()
export class UserService {
	private readonly logger = new Logger(UserService.name);

	constructor(private readonly prisma: PrismaService) { }

	async getOrCreateUserId(dto: GetOrCreateUserIdDto): Promise<string> {
		try {
			const existingUserID = await this.findUserID(dto.id1, dto.id2);

			if (existingUserID) {
				return existingUserID;
			}

			try {
				const createdUserID = await this.createUserID(dto.id1, dto.id2);
				
				return createdUserID;
			} catch (error: unknown) {
				if (!this.isUniqueConstraintError(error)) {
					throw error;
				}

				const concurrentlyCreatedUserID = await this.findUserID(dto.id1, dto.id2);

				if (concurrentlyCreatedUserID) {
					return concurrentlyCreatedUserID;
				}

				throw error;
			}
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

	private async findUserID(id1: string, id2: string): Promise<string | null> {
		const user = await this.prisma.user_identities.findUnique({
			where: {
				id1_id2: {
					id1,
					id2,
				},
			},
			select: {
				user_id: true,
			},
		});

		return user?.user_id ?? null;
	}

	private async createUserID(id1: string, id2: string): Promise<string> {
		const createdUser = await this.prisma.user_identities.create({
			data: {
				id1,
				id2,
				user_id: randomUUID(),
			},
			select: {
				user_id: true,
			},
		});

		return createdUser.user_id;
	}

	private isUniqueConstraintError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
		return (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === 'P2002'
		);
	}
}