import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { UserRole } from '../enums/user-roles.enum';

// Interface for the user payload structure
export interface CurrentUserPayload {
  id: string;
  email: string;
  role: UserRole;
  profileId?: string;
  sessionId: string;
  jti: string;
  refreshTokenId?: string;
  [key: string]: any;
}

// Param decorator to extract current user from request
export const CurrentUser = createParamDecorator(
  (
    property: string | undefined,
    ctx: ExecutionContext,
  ): CurrentUserPayload | string | null => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as CurrentUserPayload;

    if (!user) {
      return null;
    }

    // If specific property requested, return that property
    if (property) {
      return user[property];
    }

    // Return full user payload
    return user;
  },
);
