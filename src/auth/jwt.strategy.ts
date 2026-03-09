import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { JwtUser } from './types/jwt-user.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: (req: Request) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) return null;
        const [scheme, token] = authHeader.split(' ');
        if (scheme !== 'Bearer' || !token) return null;
        return token;
      },
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'dev-jwt-secret',
    });
  }

  validate(payload: JwtUser) {
    return payload;
  }
}
