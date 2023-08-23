import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IJwtPayload } from '~/src/helpers/interfaces/JwtPayload';
import { IPartialUser } from '~/src/helpers/interfaces/User';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  // The return object gets saved in the request
  async validate(payload: IJwtPayload): Promise<IPartialUser> {
    return {
      _id: payload.sub,
      personId: payload.personId,
      username: payload.username,
      roles: payload.roles,
    };
  }
}
