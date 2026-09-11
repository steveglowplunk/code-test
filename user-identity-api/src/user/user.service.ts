import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {Inject,	Injectable,	InternalServerErrorException,	Logger} from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { createHash, randomUUID } from 'node:crypto';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { GetOrCreateUserIdDto } from './dto/create-user.dto.js';

@Injectable()
export class UserService {
	private readonly logger = new Logger(UserService.name);
	private readonly cacheTTL = this.getCacheTTL();

	constructor(
		private readonly prisma: PrismaService,
		@Inject(CACHE_MANAGER) private readonly cache: Cache,
	) { }

	async getOrCreateUserId(dto: GetOrCreateUserIdDto): Promise<string> {
		const cacheKey = this.createCacheKey(dto.id1, dto.id2);

		try {
			const cachedUserID = await this.getCachedUserID(cacheKey);

			if (cachedUserID) {
				return cachedUserID;
			}

			const existingUserID = await this.findUserID(dto.id1, dto.id2);

			if (existingUserID) {
				await this.cacheUserID(cacheKey, existingUserID);
				return existingUserID;
			}

			try {
				const createdUserID = await this.createUserID(dto.id1, dto.id2);

				await this.cacheUserID(cacheKey, createdUserID);

				return createdUserID;
			} catch (error: unknown) {
				if (!this.isUniqueConstraintError(error)) {
					throw error;
				}

				const concurrentlyCreatedUserID = await this.findUserID(
					dto.id1,
					dto.id2,
				);

				if (concurrentlyCreatedUserID) {
					await this.cacheUserID(cacheKey, concurrentlyCreatedUserID);
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

	private async getCachedUserID(cacheKey: string): Promise<string | null> {
		try {
			return (await this.cache.get<string>(cacheKey)) ?? null;
		} catch (error: unknown) {
			this.logger.warn(
				`Unable to read from Redis: ${this.getErrorMessage(error)}`,
			);

			return null;
		}
	}

	private async cacheUserID(
		cacheKey: string,
		userID: string,
	): Promise<void> {
		try {
			await this.cache.set(cacheKey, userID, this.cacheTTL);
		} catch (error: unknown) {
			this.logger.warn(
				`Unable to write to Redis: ${this.getErrorMessage(error)}`,
			);
		}
	}

	private createCacheKey(id1: string, id2: string): string {
		const identityHash = createHash('sha256')
			.update(JSON.stringify([id1, id2]))
			.digest('hex');

		return `user-identity:${identityHash}`;
	}

	private getCacheTTL(): number {
		const ttlSeconds = Number(process.env.REDIS_CACHE_TTL_SECONDS ?? 3600);

		if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0) {
			throw new Error('REDIS_CACHE_TTL_SECONDS must be a positive integer');
		}

		return ttlSeconds * 1000;
	}

	private getErrorMessage(error: unknown): string {
		return error instanceof Error ? error.message : 'Unknown Redis error';
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

	private isUniqueConstraintError(
		error: unknown,
	): error is Prisma.PrismaClientKnownRequestError {
		return (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === 'P2002'
		);
	}
}