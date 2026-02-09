import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AUDIT_ENTITY_KEY } from '../decorators/audit-entity.decorator';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const entityType = this.reflector.get<string>(
      AUDIT_ENTITY_KEY,
      context.getClass(),
    );

    if (!entityType) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Only audit mutating operations
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const action = this.getAction(method);
    const userId = request.user?.id || null;
    const ipAddress = request.ip || request.connection?.remoteAddress || null;
    const userAgent = request.headers?.['user-agent'] || null;
    const body = request.body ? { ...request.body } : null;

    // Remove sensitive fields from audit data
    if (body) {
      delete body.password;
      delete body.currentPassword;
      delete body.newPassword;
      delete body.confirmPassword;
    }

    return next.handle().pipe(
      tap({
        next: (responseData) => {
          const entityId = this.extractEntityId(request, responseData);

          this.prisma.auditLog
            .create({
              data: {
                userId,
                action,
                entityType,
                entityId: entityId || 'unknown',
                newValues: action === 'DELETE' ? Prisma.JsonNull : (body ?? Prisma.JsonNull),
                oldValues: Prisma.JsonNull,
                ipAddress,
                userAgent,
              },
            })
            .catch((err) => {
              this.logger.warn(`Failed to write audit log: ${err.message}`);
            });
        },
      }),
    );
  }

  private getAction(method: string): string {
    switch (method) {
      case 'POST':
        return 'CREATE';
      case 'PUT':
      case 'PATCH':
        return 'UPDATE';
      case 'DELETE':
        return 'DELETE';
      default:
        return method;
    }
  }

  private extractEntityId(request: any, responseData: any): string | null {
    // Try to get from route params
    if (request.params?.id) {
      return request.params.id;
    }

    // Try to get from response data
    if (responseData?.data?.id) {
      return responseData.data.id;
    }

    return null;
  }
}
