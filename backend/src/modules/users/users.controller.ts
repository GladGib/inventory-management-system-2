import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateProfileDto,
  ChangePasswordDto,
  UserResponseDto,
  RoleResponseDto,
} from './dto';
import { CurrentUser } from '@/common/decorators';
import { Roles } from '@/common/decorators/roles.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @Roles('Administrator', 'Manager')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: CreateUserDto,
  ) {
    const user = await this.usersService.create(orgId, dto);
    return { data: user };
  }

  @Get()
  @ApiOperation({ summary: 'List all users' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'roleId', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Users list' })
  async findAll(
    @CurrentUser('organizationId') orgId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('roleId') roleId?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    const result = await this.usersService.findAll(orgId, {
      page,
      limit,
      search,
      roleId,
      isActive,
    });
    return result;
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user', type: UserResponseDto })
  async getMe(@CurrentUser('organizationId') orgId: string, @CurrentUser('id') userId: string) {
    const user = await this.usersService.findOne(orgId, userId);
    return { data: user };
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated', type: UserResponseDto })
  async updateMe(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    const user = await this.usersService.updateProfile(userId, dto);
    return { data: user };
  }

  @Post('me/change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change current user password' })
  @ApiResponse({ status: 200, description: 'Password changed' })
  @ApiResponse({ status: 400, description: 'Current password incorrect' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(userId, dto);
    return { data: { message: 'Password changed successfully' } };
  }

  @Get('roles')
  @ApiOperation({ summary: 'Get available roles' })
  @ApiResponse({ status: 200, description: 'Roles list', type: [RoleResponseDto] })
  async getRoles(@CurrentUser('organizationId') orgId: string) {
    const roles = await this.usersService.getRoles(orgId);
    return { data: roles };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    const user = await this.usersService.findOne(orgId, id);
    return { data: user };
  }

  @Put(':id')
  @Roles('Administrator', 'Manager')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    const user = await this.usersService.update(orgId, id, dto);
    return { data: user };
  }

  @Delete(':id')
  @Roles('Administrator')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async remove(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    await this.usersService.remove(orgId, id);
    return { data: { message: 'User deleted successfully' } };
  }
}
