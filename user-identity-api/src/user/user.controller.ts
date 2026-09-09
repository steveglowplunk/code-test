import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { UserService } from './user.service.js';
import { GetOrCreateUserIdDto } from './dto/create-user.dto.js';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

	@Post()
	getOrCreateUserId (@Body() dto: GetOrCreateUserIdDto) {
		return { userId: this.userService.getOrCreateUserId(dto) };
	}
}
