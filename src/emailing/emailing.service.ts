import { Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { ConfigService } from '../config/config.service';
import { AppLogger } from '../logging/logging.service';
import { createAlphanumericId } from '../storage/helpers';
import { User } from '../user/model/user.model';
import { CreateVerificationInputDto } from '../verification/dto/create-verification-input.dto';
import { VerificationService } from '../verification/verification.service';

@Injectable()
export class EmailingService {
  constructor(
    private logger: AppLogger,
    private readonly confService: ConfigService,
    private readonly verificationService: VerificationService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  async resentEmail(user: User, isForgotPassword: boolean): Promise<void> {
    const code = createAlphanumericId(10);
    const verification: CreateVerificationInputDto = {
      code,
      email: user.email,
      userId: user._id,
    };
    await this.verificationService.create(verification);
    const emailRequest = isForgotPassword
      ? this.buildForgotPasswordEmailRequestBody(user.email, code, user.nickname)
      : this.buildSignUpEmailRequestBody(user.email, code, user.nickname);
    this.logger.warn(
      `email request params: email => ${user.email}, code => ${code}, nickname => ${user.nickname}`,
    );
    await this.postSmtpEmail(emailRequest);
  }

  async accountCreated(user: User): Promise<void> {
    await this.resentEmail(user, false);
  }

  private buildSignUpEmailRequestBody(
    email: string,
    code: string,
    nickname: string,
  ): OneEmailRequestBody {
    const message = Buffer.from(
      JSON.stringify({
        code,
        email,
        nickname,
      }),
    ).toString('base64');
    const queryStringEncoded = encodeURIComponent(message);
    this.logger.warn(queryStringEncoded);
    const uri = `${this.confService.artradeApiBaseUrl}/verify/email?message=${queryStringEncoded}`;
    const link = `<a href='${uri}' target='_blank'>Click the link to verify</a>`;
    return {
      sender: {
        name: 'Artrade App',
        email: 'support@artrade.app',
      },
      to: [
        {
          email,
          name: nickname,
        },
      ],
      subject: 'Email confirmation link',
      htmlContent: `<html><head></head><body><p>Hello,</p>Welcome to Artrade - beta test</p><br>${link}</body></html>`,
    };
  }

  private buildForgotPasswordEmailRequestBody(
    email: string,
    code: string,
    nickname: string,
  ): OneEmailRequestBody {
    const message = Buffer.from(
      JSON.stringify({
        code,
        nickname,
      }),
    ).toString('base64');
    const queryStringEncoded = encodeURIComponent(message);
    const uri = `https://artrade.app/reset-password?message=${queryStringEncoded}`;
    const link = `<a href='${uri}' target='_blank'>Click the link to reset password</a>`;
    return {
      sender: {
        name: 'Artrade App',
        email: 'support@artrade.app',
      },
      to: [
        {
          email,
          name: nickname,
        },
      ],
      subject: 'Reset password',
      htmlContent: `<html><head></head><body><p>Hello,</p>Reset password action - beta test</p><br>${link}</body></html>`,
    };
  }

  async sendInviteEmails(emails: string[], authorName: string): Promise<void> {
    const recipients = emails.map((email) => ({
      email,
      name: email.split('@')[0],
    }));
    const payload = {
      sender: {
        email: 'support@artrade.app',
        name: 'Artrade App',
      },
      subject: `${authorName} invited you to join Artrade!`,
      htmlContent: `<html><body>
      <p>Hello! ${authorName} thinks you could be interested in joining the Artrade community.</p>
      <p>To join Artrade, you just have to go to <a href='https://dev.artrade.app'>https://dev.artrade.app</a> and create an account.</p>
      <p>It would only take 5 minutes.</p>
      <p>See you soon on the Artrade App.</p>
      </body></html>`,
      messageVersions: [{ to: recipients }],
    };
    const response = await this.postSmtpEmail(payload);
    this.logger.debug(`send email response: ${response.statusText}`);
  }

  private async postSmtpEmail(body: OneEmailRequestBody): Promise<AxiosResponse>;
  private async postSmtpEmail(body: BatchEmailsRequestBody): Promise<AxiosResponse>;
  private async postSmtpEmail(body: unknown): Promise<AxiosResponse> {
    try {
      return await axios.post('https://api.sendinblue.com/v3/smtp/email', body, {
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
          'api-key': this.confService.emailing.apiKey,
        },
      });
    } catch (e) {
      throw e;
    }
  }
}

interface Person {
  name: string;
  email: string;
}

interface EmailRequestBody {
  sender: Person;
  subject: string;
  htmlContent: string;
}

interface OneEmailRequestBody extends EmailRequestBody {
  to: Person[];
}

interface BatchEmailsRequestBody extends EmailRequestBody {
  messageVersions: { to: Person[] }[];
}
