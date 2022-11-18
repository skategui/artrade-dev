import { Injectable } from '@nestjs/common';
import { Auth, google } from 'googleapis';
import { TokenPairOutputDto } from '../auth/dto/token.dto';
import { UserAuthService } from '../auth/user-auth.service';
import { AppLogger } from '../logging/logging.service';
import { UserService } from '../user/user.service';

@Injectable()
export class GoogleService {
  private oauthClient: Auth.OAuth2Client;
  private PREFIX_PWD = 'Artrade_';

  constructor(
    private logger: AppLogger,
    private readonly userService: UserService,
    private readonly authService: UserAuthService,
  ) {
    this.logger.setContext(this.constructor.name);

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    this.oauthClient = new google.auth.OAuth2(clientId, clientSecret);
  }

  async loginGoogleUser(token: string): Promise<TokenPairOutputDto | undefined> {
    const tokenInfo = await this.oauthClient.getTokenInfo(token);
    let user = await this.userService.getByEmail(tokenInfo.email || '');
    if (!user) {
      const oauth2Client = new google.auth.OAuth2(); // create new auth client
      oauth2Client.setCredentials({ access_token: token }); // use the new auth client with the access_token
      const oauth2 = google.oauth2({
        auth: oauth2Client,
        version: 'v2',
      });
      const { data } = await oauth2.userinfo.get();
      if (!data.email) return undefined;

      const userId = UserService.createUserId();
      user = await this.userService.createWithCompleteInfo(
        {
          email: data.email || '',
          nickname: data.email?.split('@')[0] || '',
          firstName: data.given_name || '',
          lastName: data.family_name || '',
          password: `${this.PREFIX_PWD}${userId}`,
        },
        userId,
        data.picture || '',
      );
    }
    return this.authService.signIn({
      email: user.email,
      password: `${this.PREFIX_PWD}${user._id}`,
    });
  }
}
