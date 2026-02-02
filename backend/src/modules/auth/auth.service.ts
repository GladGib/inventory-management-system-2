import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '@/common/prisma';
import { LoginDto, LoginResponseDto, ForgotPasswordDto, ResetPasswordDto } from './dto';

export interface JwtPayload {
  sub: string;
  org: string;
  role: string;
  permissions: string[];
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    // Find user by email (need to search across organizations)
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        deletedAt: null,
      },
      include: {
        organization: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const payload: JwtPayload = {
      sub: user.id,
      org: user.organizationId,
      role: user.role.name,
      permissions: user.role.permissions,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        organizationId: user.organizationId,
        organizationName: user.organization.name,
      },
    };
  }

  async generateRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    return token;
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.usedAt) {
      // Token reuse detected - invalidate all tokens for this user
      await this.prisma.refreshToken.deleteMany({
        where: { userId: storedToken.userId },
      });
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Mark token as used
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { usedAt: new Date() },
    });

    // Generate new access token
    const payload: JwtPayload = {
      sub: storedToken.user.id,
      org: storedToken.user.organizationId,
      role: storedToken.user.role.name,
      permissions: storedToken.user.role.permissions,
    };

    const accessToken = this.jwtService.sign(payload);

    // Generate new refresh token (token rotation)
    const newRefreshToken = await this.generateRefreshToken(storedToken.user.id);

    return { accessToken, refreshToken: newRefreshToken, userId: storedToken.user.id };
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: {
          userId,
          token: refreshToken,
        },
      });
    }
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        deletedAt: null,
      },
    });

    if (!user) {
      // Don't reveal if email exists
      return;
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour

    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // TODO: Send email with reset link
    // For now, just log it (in production, send email)
    console.log(`Password reset token for ${dto.email}: ${token}`);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const resetRecord = await this.prisma.passwordReset.findUnique({
      where: { token: dto.token },
    });

    if (!resetRecord) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (resetRecord.usedAt) {
      throw new BadRequestException('Reset token already used');
    }

    if (resetRecord.expiresAt < new Date()) {
      throw new BadRequestException('Reset token expired');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    // Update password and mark token as used
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
      // Invalidate all refresh tokens
      this.prisma.refreshToken.deleteMany({
        where: { userId: resetRecord.userId },
      }),
    ]);
  }

  async validateUser(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        role: true,
        organization: true,
      },
    });

    if (!user || !user.isActive || user.deletedAt) {
      return null;
    }

    return user;
  }
}
