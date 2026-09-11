import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';

describe('UserController', () => {
  const userService = {
    getOrCreateUserId: vi.fn(),
  };

  let controller: UserController;

  beforeEach(async () => {
    vi.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: userService,
        },
      ],
    }).compile();

    controller = module.get(UserController);
  });

  it('returns the userID from the service', async () => {
    userService.getOrCreateUserId.mockResolvedValue(
      '550e8400-e29b-41d4-a716-446655440000',
    );

    const dto = {
      id1: 'ABC123',
      id2: 'XYZ456',
    };

    const result = await controller.getOrCreateUserId(dto);

    expect(userService.getOrCreateUserId).toHaveBeenCalledWith(dto);
    expect(result).toEqual({
      userID: '550e8400-e29b-41d4-a716-446655440000',
    });
  });
});