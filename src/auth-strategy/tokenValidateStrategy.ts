import {HttpErrors, Request} from '@loopback/rest';
import {AuthenticationStrategy} from '@loopback/authentication';
import {UserProfile} from '@loopback/security';
import jwt from 'jsonwebtoken';

const axios = require('axios');

export class JWTAuthenticationStrategy implements AuthenticationStrategy {
  name = 'user';

  async authenticate(request: Request): Promise<UserProfile | undefined> {
    const token: string = this.extractCredentials(request);
    return axios
      .get(
        'https://api.cimpress.io/auth/access-management/v1/resource-types/auth0-client',
        {
          headers: {Authorization: token},
        },
      )
      .then(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const profileJson: any = jwt.decode(token);
        return {
          sub: profileJson['sub'],
          email: profileJson['https://claims.cimpress.io/email'],
        };
      })
      .catch(() => undefined);
  }

  extractCredentials(request: Request): string {
    if (!request.headers.authorization) {
      throw new HttpErrors.Unauthorized(`Authorization header not found.`);
    }

    // for example : Bearer xxx.yyy.zzz
    const authHeaderValue = request.headers.authorization;

    if (!authHeaderValue.startsWith('Bearer')) {
      throw new HttpErrors.Unauthorized(
        `Authorization header is not of type 'Bearer'.`,
      );
    }

    //split the string into 2 parts : 'Bearer ' and the `xxx.yyy.zzz`
    const parts = authHeaderValue.split(' ');
    if (parts.length !== 2)
      throw new HttpErrors.Unauthorized(
        `Authorization header value has too many parts. It must follow the pattern: 'Bearer xx.yy.zz' where xx.yy.zz is a valid JWT token.`,
      );
    const token = parts[1];

    return token;
  }
}
