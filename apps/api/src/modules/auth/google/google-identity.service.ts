import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { ENV } from 'apps/api/src/modules/config';

export interface GoogleIdentityProfile {
  sub: string;
  email: string;
  givenName?: string;
  familyName?: string;
  fullName?: string;
  picture?: string;
}

interface GoogleTokenPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
  picture?: string;
}

@Injectable()
export class GoogleIdentityService {
  private readonly oauthClient = new OAuth2Client();

  constructor(private readonly configService: ConfigService) {}

  async verifyIdToken(idToken: string): Promise<GoogleIdentityProfile> {
    const audience = this.configService.get<string>(ENV.GOOGLE_CLIENT_ID);
    if (!audience) {
      throw new UnauthorizedException('Google Sign-In is not configured');
    }

    let ticket: { getPayload: () => unknown };
    try {
      const verifiedTicket = await this.oauthClient.verifyIdToken({
        idToken,
        audience,
      });
      ticket = verifiedTicket as { getPayload: () => unknown };
    } catch {
      throw new UnauthorizedException('Invalid or expired Google token');
    }

    const payload = ticket.getPayload();
    if (!this.isGoogleTokenPayload(payload)) {
      throw new UnauthorizedException('Invalid Google token payload');
    }

    if (!payload.email_verified) {
      throw new UnauthorizedException('Google email is not verified');
    }

    return {
      sub: payload.sub,
      email: payload.email.toLowerCase(),
      givenName: payload.given_name,
      familyName: payload.family_name,
      fullName: payload.name,
      picture: payload.picture,
    };
  }

  private isGoogleTokenPayload(
    payload: unknown,
  ): payload is GoogleTokenPayload {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    const candidate = payload as Record<string, unknown>;
    return (
      typeof candidate.sub === 'string' &&
      typeof candidate.email === 'string' &&
      typeof candidate.email_verified === 'boolean'
    );
  }
}
