import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { PrismaService } from '@/common/prisma';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let prisma: PrismaService;

  const mockRole = {
    id: 'role1',
    name: 'Admin',
    description: 'Administrator role',
    permissions: ['read', 'write', 'delete'],
    isSystem: true,
    organizationId: null,
  };

  const mockUser = {
    id: 'user1',
    organizationId: 'org1',
    email: 'test@example.com',
    passwordHash: 'hashedPassword',
    firstName: 'John',
    lastName: 'Doe',
    phone: '0123456789',
    roleId: 'role1',
    isActive: true,
    lastLoginAt: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: mockRole,
  };

  const mockPrismaService: any = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    refreshToken: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((callback: any) => {
      if (typeof callback === 'function') {
        return callback(mockPrismaService);
      }
      return Promise.all(callback);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.create('org1', {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roleId: 'role1',
      });

      expect(result.email).toBe('test@example.com');
      expect(result.firstName).toBe('John');
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException when email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.create('org1', {
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          roleId: 'role1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when role is invalid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.role.findUnique.mockResolvedValue(null);

      await expect(
        service.create('org1', {
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          roleId: 'invalidRole',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create user with optional phone', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaService.user.create.mockResolvedValue({
        ...mockUser,
        phone: '0987654321',
      });

      const result = await service.create('org1', {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '0987654321',
        roleId: 'role1',
      });

      expect(result.phone).toBe('0987654321');
    });

    it('should create user with isActive defaulting to true', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.create('org1', {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roleId: 'role1',
      });

      expect(result.isActive).toBe(true);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockUser]);
      mockPrismaService.user.count.mockResolvedValue(1);

      const result = await service.findAll('org1', { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by search term', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      await service.findAll('org1', { search: 'john' });

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });

    it('should filter by roleId', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      await service.findAll('org1', { roleId: 'role1' });

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ roleId: 'role1' }),
        }),
      );
    });

    it('should filter by isActive', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      await service.findAll('org1', { isActive: true });

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });

    it('should use default pagination when not specified', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      const result = await service.findAll('org1');

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });

    it('should limit maximum results to 100', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      const result = await service.findAll('org1', { limit: 200 });

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a user by ID', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.findOne('org1', 'user1');

      expect(result.id).toBe('user1');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.findOne('org1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        firstName: 'Jane',
      });

      const result = await service.update('org1', 'user1', { firstName: 'Jane' });

      expect(result.firstName).toBe('Jane');
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.update('org1', 'nonexistent', { firstName: 'Jane' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate role when roleId is being updated', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.role.findUnique.mockResolvedValue(null);

      await expect(
        service.update('org1', 'user1', { roleId: 'invalidRole' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update role when valid roleId provided', async () => {
      const newRole = { ...mockRole, id: 'role2', name: 'Manager' };
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.role.findUnique.mockResolvedValue(newRole);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        roleId: 'role2',
        role: newRole,
      });

      const result = await service.update('org1', 'user1', { roleId: 'role2' });

      expect(result.roleId).toBe('role2');
    });

    it('should invalidate sessions when user is deactivated', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 2 });

      await service.update('org1', 'user1', { isActive: false });

      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
      });
    });

    it('should not invalidate sessions when user is not deactivated', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        firstName: 'Jane',
      });

      await service.update('org1', 'user1', { firstName: 'Jane' });

      expect(mockPrismaService.refreshToken.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete a user', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(),
        isActive: false,
      });
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await service.remove('org1', 'user1');

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: { deletedAt: expect.any(Date), isActive: false },
      });
    });

    it('should invalidate sessions when user is removed', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(),
        isActive: false,
      });
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await service.remove('org1', 'user1');

      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.remove('org1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '9876543210',
      });

      const result = await service.updateProfile('user1', {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '9876543210',
      });

      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
      expect(result.phone).toBe('9876543210');
    });

    it('should update only firstName', async () => {
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        firstName: 'Jane',
      });

      const result = await service.updateProfile('user1', { firstName: 'Jane' });

      expect(result.firstName).toBe('Jane');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ firstName: 'Jane' }),
        }),
      );
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await service.changePassword('user1', {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword',
      });

      expect(bcrypt.compare).toHaveBeenCalledWith('oldPassword', 'hashedPassword');
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', 10);
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });

    it('should invalidate all sessions after password change', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 3 });

      await service.changePassword('user1', {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword',
      });

      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword('nonexistent', {
          currentPassword: 'oldPassword',
          newPassword: 'newPassword',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when current password is incorrect', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword('user1', {
          currentPassword: 'wrongPassword',
          newPassword: 'newPassword',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getRoles', () => {
    it('should return all roles for organization', async () => {
      const roles = [
        mockRole,
        { ...mockRole, id: 'role2', name: 'Manager', organizationId: 'org1', isSystem: false },
      ];
      mockPrismaService.role.findMany.mockResolvedValue(roles);

      const result = await service.getRoles('org1');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Admin');
    });

    it('should return system roles when no organizationId provided', async () => {
      const systemRoles = [mockRole];
      mockPrismaService.role.findMany.mockResolvedValue(systemRoles);

      const result = await service.getRoles();

      expect(result).toHaveLength(1);
      expect(result[0].isSystem).toBe(true);
    });

    it('should return roles with correct properties', async () => {
      mockPrismaService.role.findMany.mockResolvedValue([mockRole]);

      const result = await service.getRoles('org1');

      expect(result[0]).toEqual({
        id: 'role1',
        name: 'Admin',
        description: 'Administrator role',
        permissions: ['read', 'write', 'delete'],
        isSystem: true,
      });
    });
  });
});
