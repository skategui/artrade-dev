import { Injectable } from '@nestjs/common';
import { TokenPairOutputDto } from '../auth/dto/token.dto';
import { UserAuthService } from '../auth/user-auth.service';
import { AppLogger } from '../logging/logging.service';
import { UserService } from '../user/user.service';
import { GoogleUserInfoService } from './google-userinfo.service';

@Injectable()
export class GoogleService {
  private PREFIX_PWD = 'Artrade_';

  constructor(
    private logger: AppLogger,
    private readonly userService: UserService,
    private readonly authService: UserAuthService,
    private readonly googleUserInfoService: GoogleUserInfoService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  async loginGoogleUser(token: string): Promise<TokenPairOutputDto | undefined> {
    const data = await this.googleUserInfoService.getUserData(token);
    if (!data || !data?.email) return undefined;
    let user = await this.userService.getByEmail(data.email);
    if (!user) {
      const userId = UserService.createUserId();
      user = await this.userService.createWithCompleteInfo(
        {
          email: data.email,
          nickname: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          password: `${this.PREFIX_PWD}${userId}`,
        },
        userId,
        data.picture,
      );
    }
    return this.authService.signIn({
      email: user.email,
      password: `${this.PREFIX_PWD}${user._id}`,
    });
  }
}
