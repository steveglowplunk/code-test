import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { UserService } from './user.service.js';
import { Prisma } from '../generated/prisma/client.js';

describe('UserService', () => {
  const dto = {
    id1: 'ABC123',
    id2: 'XYZ456',
  };

  const prisma = {
    user_identities: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  };

  const cache = {
    get: vi.fn(),
    set: vi.fn(),
  };

  let service: UserService;

  beforeEach(async () => {
    vi.resetAllMocks();
    vi.stubEnv('REDIS_CACHE_TTL_SECONDS', '3600');

    cache.get.mockResolvedValue(undefined);
    cache.set.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: CACHE_MANAGER,
          useValue: cache,
        },
      ],
    }).compile();

    service = module.get(UserService);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns the cached user ID without querying MySQL', async () => {
    cache.get.mockResolvedValue('cached-user-id');

    const result = await service.getOrCreateUserId(dto);

    expect(result).toBe('cached-user-id');
    expect(cache.get).toHaveBeenCalledWith(
      expect.stringMatching(/^user-identity:[a-f0-9]{64}$/),
    );
    expect(prisma.user_identities.findUnique).not.toHaveBeenCalled();
    expect(prisma.user_identities.create).not.toHaveBeenCalled();
  });

  it('returns and caches an existing MySQL user ID', async () => {
    prisma.user_identities.findUnique.mockResolvedValue({
      user_id: 'existing-user-id',
    });

    const result = await service.getOrCreateUserId(dto);

    expect(result).toBe('existing-user-id');

    expect(prisma.user_identities.findUnique).toHaveBeenCalledWith({
      where: {
        id1_id2: {
          id1: 'ABC123',
          id2: 'XYZ456',
        },
      },
      select: {
        user_id: true,
      },
    });

    expect(cache.set).toHaveBeenCalledWith(
      expect.stringMatching(/^user-identity:[a-f0-9]{64}$/),
      'existing-user-id',
      3_600_000,
    );

    expect(prisma.user_identities.create).not.toHaveBeenCalled();
  });

  it('generates, stores, caches, and returns a new UUID', async () => {
    prisma.user_identities.findUnique.mockResolvedValue(null);

    prisma.user_identities.create.mockImplementation(
      async ({
        data,
      }: {
        data: { id1: string; id2: string; user_id: string };
      }) => ({
        user_id: data.user_id,
      }),
    );

    const result = await service.getOrCreateUserId(dto);

    expect(result).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );

    expect(prisma.user_identities.create).toHaveBeenCalledWith({
      data: {
        id1: 'ABC123',
        id2: 'XYZ456',
        user_id: result,
      },
      select: {
        user_id: true,
      },
    });

    expect(cache.set).toHaveBeenCalledWith(
      expect.stringMatching(/^user-identity:[a-f0-9]{64}$/),
      result,
      3_600_000,
    );
  });

  it('returns the concurrently created user ID after a unique constraint conflict', async () => {
    const concurrentUserID = '550e8400-e29b-41d4-a716-446655440000';

    prisma.user_identities.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        user_id: concurrentUserID,
      });

    prisma.user_identities.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on id1 and id2',
        {
          code: 'P2002',
          clientVersion: '7.10.0',
          meta: {
            modelName: 'user_identities',
            target: ['id1', 'id2'],
          },
        },
      ),
    );

    const result = await service.getOrCreateUserId(dto);

    expect(result).toBe(concurrentUserID);
    expect(prisma.user_identities.findUnique).toHaveBeenCalledTimes(2);

    expect(cache.set).toHaveBeenCalledWith(
      expect.stringMatching(/^user-identity:[a-f0-9]{64}$/),
      concurrentUserID,
      3_600_000,
    );
  });

  it('uses MySQL when the Redis read fails', async () => {
    cache.get.mockRejectedValue(new Error('Redis unavailable'));

    prisma.user_identities.findUnique.mockResolvedValue({
      user_id: 'database-user-id',
    });

    const result = await service.getOrCreateUserId(dto);

    expect(result).toBe('database-user-id');
    expect(prisma.user_identities.findUnique).toHaveBeenCalledOnce();
  });

  it('still succeeds when the Redis write fails', async () => {
    prisma.user_identities.findUnique.mockResolvedValue({
      user_id: 'database-user-id',
    });

    cache.set.mockRejectedValue(new Error('Redis unavailable'));

    await expect(service.getOrCreateUserId(dto)).resolves.toBe(
      'database-user-id',
    );
  });

  it('returns a safe internal server error when MySQL fails', async () => {
    prisma.user_identities.findUnique.mockRejectedValue(
      new Error('Database connection failed'),
    );

    await expect(service.getOrCreateUserId(dto)).rejects.toEqual(
      new InternalServerErrorException(
        'Unable to process the user identity request',
      ),
    );
  });

});