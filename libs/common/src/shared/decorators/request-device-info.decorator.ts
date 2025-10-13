import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import {
  extractDeviceInfoFromRequest,
  type RequestDeviceInfo,
} from '../utils/request-device-info.util';

// Param decorator to inject device info extracted from request headers
export const ReqDeviceInfo = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestDeviceInfo => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return extractDeviceInfoFromRequest(request);
  },
);

export type { RequestDeviceInfo };
