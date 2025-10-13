import type { Request } from 'express';

export interface RequestDeviceInfo {
  ip?: string | string[];
  userAgent?: string | string[];
  platform?: string | string[];
  language?: string | string[];
}

// Extract device info from an Express Request headers
export function extractDeviceInfoFromRequest(req: Request): RequestDeviceInfo {
  return {
    ip: (req.ip as any) || (req.socket && (req.socket as any).remoteAddress),
    userAgent: req.headers['user-agent'],
    platform: req.headers['sec-ch-ua-platform'],
    language: req.headers['accept-language'],
  };
}
