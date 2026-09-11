import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service.js';
import { GetOrCreateUserIdDto } from './dto/create-user.dto.js';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

	@Post()
	async getOrCreateUserId (@Body() dto: GetOrCreateUserIdDto): Promise<{ userId: string }> {
		const userId = await this.userService.getOrCreateUserId(dto);
		return { userId };
	}
}
