import {
  HttpException,
  HttpStatus,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { RedisService } from '@app/common/redis/redis.service';
import { REDIS_KEYS } from '@app/common/redis/redis.config';
import { RATE_LIMIT_KEY, type RateLimitOptions } from './rate-limit.decorator';

type RateLimitRequest = Request & {
  ip?: string;
  user?: { id?: string; sessionId?: string; jti?: string };
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RateLimitRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const identifier = this.buildIdentifier(request);
    const scope = `${context.getClass().name}:${context.getHandler().name}`;
    const key = REDIS_KEYS.RATE_LIMIT(`${scope}:${identifier}`);

    const hits = await this.redisService.incr(key);

    if (hits === 1) {
      await this.redisService.expire(key, options.ttlSeconds);
    }

    let ttl = await this.redisService.ttl(key);
    if (ttl < 0) {
      await this.redisService.expire(key, options.ttlSeconds);
      ttl = options.ttlSeconds;
    }

    const remaining = Math.max(options.limit - hits, 0);
    response.setHeader('X-RateLimit-Limit', String(options.limit));
    response.setHeader('X-RateLimit-Remaining', String(remaining));
    response.setHeader('X-RateLimit-Reset', String(Date.now() + ttl * 1000));

    if (hits > options.limit) {
      response.setHeader('Retry-After', String(Math.max(ttl, 1)));
      throw new HttpException(
        `Rate limit exceeded. Try again in ${Math.max(ttl, 1)} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private buildIdentifier(request: RateLimitRequest): string {
    const userId =
      request.user?.id ?? request.user?.sessionId ?? request.user?.jti;
    if (userId) {
      return `user:${userId}`;
    }

    const forwardedFor = request.headers?.['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0]?.trim()
        : undefined;
    const realIp = request.headers?.['x-real-ip'];
    const remoteIp = request.connection?.remoteAddress;

    const ip =
      forwardedIp ??
      (typeof realIp === 'string' ? realIp : undefined) ??
      request.ip ??
      remoteIp ??
      'unknown';

    return `ip:${ip}`;
  }
}
