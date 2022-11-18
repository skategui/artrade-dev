import { Controller, Get, Query, Redirect } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { ConfigService } from '../config/config.service';
import { AppLogger } from '../logging/logging.service';
import { UserService } from '../user/user.service';

@Controller('verify')
export class VerificationController {
  constructor(
    private logger: AppLogger,
    private conf: ConfigService,
    private readonly userService: UserService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  @Public()
  @Get('/email')
  @Redirect()
  async emailVerification(@Query('message') message: string): Promise<{ url: string }> {
    const decodedMessage = Buffer.from(message, 'base64').toString();
    const { code, email, nickname } = JSON.parse(decodedMessage);
    const user = await this.userService.verifyEmail(email, code);

    if (!user?.emailVerified) {
      this.logger.warn('Email verification failed for email: ', email);
      return {
        url: `${this.conf.artradeBaseUrl}/auth/email-verify?resendCode=true&email=${email}&handle=${nickname}`,
      };
    }

    return { url: `${this.conf.artradeBaseUrl}/auth/signin` };
  }
}
