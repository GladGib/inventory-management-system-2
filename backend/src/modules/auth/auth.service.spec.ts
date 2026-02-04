import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '@/common/prisma';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user1',
    email: 'test@example.com',
    passwordHash: 'hashedPassword',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    deletedAt: null,
    organizationId: 'org1',
    organization: {
      id: 'org1',
      name: 'Test Organization',
    },
    role: {
      id: 'role1',
      name: 'Admin',
      permissions: ['read', 'write'],
    },
  };

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    passwordReset: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((operations) => Promise.all(operations)),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('access-token'),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.accessToken).toBe('access-token');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.organizationName).toBe('Test Organization');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user1' },
          data: expect.objectContaining({ lastLoginAt: expect.any(Date) }),
        }),
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.login({ email: 'invalid@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when account is inactive', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('generateRefreshToken', () => {
    it('should create and return a refresh token', async () => {
      const mockToken = {
        id: 'token1',
        userId: 'user1',
        token: 'refresh-token',
        expiresAt: new Date(),
      };
      mockPrismaService.refreshToken.create.mockResolvedValue(mockToken);

      const result = await service.generateRefreshToken('user1');

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(mockPrismaService.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user1',
          }),
        }),
      );
    });
  });

  describe('refreshAccessToken', () => {
    const mockStoredToken = {
      id: 'token1',
      userId: 'user1',
      token: 'refresh-token',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
      usedAt: null,
      user: mockUser,
    };

    it('should refresh access token successfully', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(mockStoredToken);
      mockPrismaService.refreshToken.update.mockResolvedValue(mockStoredToken);
      mockPrismaService.refreshToken.create.mockResolvedValue({ token: 'new-refresh-token' });

      const result = await service.refreshAccessToken('refresh-token');

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBeDefined();
      expect(mockPrismaService.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'token1' },
          data: { usedAt: expect.any(Date) },
        }),
      );
    });

    it('should throw UnauthorizedException when token not found', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(
        service.refreshAccessToken('invalid-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException and invalidate all tokens on reuse', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        ...mockStoredToken,
        usedAt: new Date(),
      });

      await expect(
        service.refreshAccessToken('refresh-token'),
      ).rejects.toThrow('Refresh token reuse detected');

      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
      });
    });

    it('should throw UnauthorizedException when token is expired', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        ...mockStoredToken,
        expiresAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      });

      await expect(
        service.refreshAccessToken('refresh-token'),
      ).rejects.toThrow('Refresh token expired');
    });
  });

  describe('logout', () => {
    it('should delete refresh token on logout', async () => {
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await service.logout('user1', 'refresh-token');

      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user1', token: 'refresh-token' },
      });
    });

    it('should handle logout without refresh token', async () => {
      await service.logout('user1');

      expect(mockPrismaService.refreshToken.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('should create password reset token when user exists', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.passwordReset.create.mockResolvedValue({
        id: 'reset1',
        token: 'reset-token',
      });

      await service.forgotPassword({ email: 'test@example.com' });

      expect(mockPrismaService.passwordReset.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user1',
          }),
        }),
      );
    });

    it('should silently succeed when user does not exist', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.forgotPassword({ email: 'nonexistent@example.com' }),
      ).resolves.toBeUndefined();

      expect(mockPrismaService.passwordReset.create).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    const mockResetRecord = {
      id: 'reset1',
      userId: 'user1',
      token: 'reset-token',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
      usedAt: null,
    };

    it('should reset password successfully', async () => {
      mockPrismaService.passwordReset.findUnique.mockResolvedValue(mockResetRecord);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');

      await service.resetPassword({
        token: 'reset-token',
        newPassword: 'newPassword123',
      });

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException when token not found', async () => {
      mockPrismaService.passwordReset.findUnique.mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: 'invalid', newPassword: 'newPassword123' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when token already used', async () => {
      mockPrismaService.passwordReset.findUnique.mockResolvedValue({
        ...mockResetRecord,
        usedAt: new Date(),
      });

      await expect(
        service.resetPassword({ token: 'reset-token', newPassword: 'newPassword123' }),
      ).rejects.toThrow('Reset token already used');
    });

    it('should throw BadRequestException when token expired', async () => {
      mockPrismaService.passwordReset.findUnique.mockResolvedValue({
        ...mockResetRecord,
        expiresAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      });

      await expect(
        service.resetPassword({ token: 'reset-token', newPassword: 'newPassword123' }),
      ).rejects.toThrow('Reset token expired');
    });
  });

  describe('validateUser', () => {
    it('should return user when valid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser({
        sub: 'user1',
        org: 'org1',
        role: 'Admin',
        permissions: ['read', 'write'],
      });

      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser({
        sub: 'invalid',
        org: 'org1',
        role: 'Admin',
        permissions: [],
      });

      expect(result).toBeNull();
    });

    it('should return null when user is inactive', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      const result = await service.validateUser({
        sub: 'user1',
        org: 'org1',
        role: 'Admin',
        permissions: [],
      });

      expect(result).toBeNull();
    });

    it('should return null when user is deleted', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(),
      });

      const result = await service.validateUser({
        sub: 'user1',
        org: 'org1',
        role: 'Admin',
        permissions: [],
      });

      expect(result).toBeNull();
    });
  });
});
