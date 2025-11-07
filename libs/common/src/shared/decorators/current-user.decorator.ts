import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

// Interface for the user payload structure
export interface CurrentUserPayload {
  id: string;
  sub: string; // JWT standard subject field
  email: string;
  role: string;
  profileId: string;
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
    const jwtPayload = request.user as any;

    if (!jwtPayload) {
      return null;
    }

    // Map JWT payload to CurrentUserPayload format
    const user: CurrentUserPayload = {
      id: jwtPayload.sub, // Map sub to id for convenience
      sub: jwtPayload.sub,
      email: jwtPayload.email,
      role: jwtPayload.role,
      profileId: jwtPayload.profileId,
      sessionId: jwtPayload.sessionId,
      jti: jwtPayload.jti,
      refreshTokenId: jwtPayload.refreshTokenId,
      ...jwtPayload, // Include any other properties
    };

    // If specific property requested, return that property
    if (property) {
      // Handle both 'id' and 'sub' requests for backward compatibility
      if (property === 'id') {
        return user.sub;
      }
      return user[property];
    }

    // Return full user payload
    return user;
  },
);
