import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { AppLogger } from '../logging/logging.service';

export interface GoogleUserInfo {
  email: string;
  nickname: string;
  lastName?: string;
  firstName?: string;
  picture?: string;
}

/* istanbul ignore next */
// handle the call to google API to get user profile info
@Injectable()
export class GoogleUserInfoService {
  constructor(private logger: AppLogger) {
    this.logger.setContext(this.constructor.name);
  }

  async getUserData(accessToken: string): Promise<GoogleUserInfo | undefined> {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo?alt=json', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!data.email) return undefined;

    return {
      picture: data.picture || undefined,
      email: data.email,
      nickname: data.email?.split('@')[0],
      firstName: data.given_name || undefined,
      lastName: data.family_name || undefined,
    };
  }
}
