import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AccessTokenPayload } from '../interfaces/jwt-payload.interface';

// Re-export AccessTokenPayload as CurrentUserPayload for convenience
export type CurrentUserPayload = AccessTokenPayload;

// Param decorator to extract current user from request
export const CurrentUser = createParamDecorator(
  (
    property: string | undefined,
    ctx: ExecutionContext,
  ): CurrentUserPayload | string | null => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as AccessTokenPayload;

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
