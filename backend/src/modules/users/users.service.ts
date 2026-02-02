import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '@/common/prisma';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateProfileDto,
  ChangePasswordDto,
  UserResponseDto,
  RoleResponseDto,
} from './dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(
    organizationId: string,
    dto: CreateUserDto,
  ): Promise<UserResponseDto> {
    // Check if email already exists in organization
    const existingUser = await this.prisma.user.findUnique({
      where: {
        organizationId_email: {
          organizationId,
          email: dto.email,
        },
      },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // Verify role exists
    const role = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
    });

    if (!role) {
      throw new BadRequestException('Invalid role');
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        organizationId,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        roleId: dto.roleId,
        isActive: dto.isActive ?? true,
      },
      include: {
        role: true,
      },
    });

    // TODO: Send welcome email with temporary password
    console.log(`New user created: ${dto.email}, temp password: ${tempPassword}`);

    return this.toResponseDto(user);
  }

  async findAll(
    organizationId: string,
    options?: {
      page?: number;
      limit?: number;
      search?: string;
      roleId?: string;
      isActive?: boolean;
    },
  ): Promise<{ data: UserResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
      deletedAt: null,
    };

    if (options?.search) {
      where.OR = [
        { email: { contains: options.search, mode: 'insensitive' } },
        { firstName: { contains: options.search, mode: 'insensitive' } },
        { lastName: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    if (options?.roleId) {
      where.roleId = options.roleId;
    }

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { role: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((u: any) => this.toResponseDto(u)),
      meta: { total, page, limit },
    };
  }

  async findOne(organizationId: string, id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toResponseDto(user);
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify role if being updated
    if (dto.roleId) {
      const role = await this.prisma.role.findUnique({
        where: { id: dto.roleId },
      });

      if (!role) {
        throw new BadRequestException('Invalid role');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        roleId: dto.roleId,
        isActive: dto.isActive,
      },
      include: { role: true },
    });

    // If user is deactivated, invalidate their sessions
    if (dto.isActive === false) {
      await this.prisma.refreshToken.deleteMany({
        where: { userId: id },
      });
    }

    return this.toResponseDto(updated);
  }

  async remove(organizationId: string, id: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    // Invalidate sessions
    await this.prisma.refreshToken.deleteMany({
      where: { userId: id },
    });
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
      },
      include: { role: true },
    });

    return this.toResponseDto(user);
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Invalidate all sessions
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async getRoles(organizationId?: string): Promise<RoleResponseDto[]> {
    const roles = await this.prisma.role.findMany({
      where: {
        OR: [
          { organizationId: null, isSystem: true }, // System roles
          { organizationId }, // Organization-specific roles
        ],
      },
      orderBy: { name: 'asc' },
    });

    return roles.map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      permissions: r.permissions,
      isSystem: r.isSystem,
    }));
  }

  private toResponseDto(user: any): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      roleId: user.roleId,
      roleName: user.role?.name,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
