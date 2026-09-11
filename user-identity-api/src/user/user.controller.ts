import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { GetOrCreateUserIdDto } from './dto/create-user.dto.js';
import { UserIdentityResponseDto } from './dto/user-identity-response.dto.js';
import { UserService } from './user.service.js';

@ApiTags('User identities')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({
    summary: 'Get or create a user identity',
    description:
      'Returns the existing userID for an id1 and id2 combination, or creates a new UUID v4 userID.',
  })
  @ApiCreatedResponse({
    description: 'The existing or newly created user identity',
    type: UserIdentityResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The request is missing required fields or contains invalid values',
  })
  @ApiInternalServerErrorResponse({
    description: 'The user identity request could not be processed',
  })
  async getOrCreateUserId(
    @Body() dto: GetOrCreateUserIdDto,
  ): Promise<UserIdentityResponseDto> {
    const userID = await this.userService.getOrCreateUserId(dto);

    return { userID };
  }
}