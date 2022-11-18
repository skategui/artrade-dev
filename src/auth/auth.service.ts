import { InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthenticationError } from 'apollo-server-express';
import moment from 'moment';
import { ConfigService } from '../config/config.service';
import { jwtDelayRegex } from '../config/jwt.config';
import { hash } from '../helpers/strings.tools';
import { AppLogger } from '../logging/logging.service';
import { BaseUser } from '../user/model/base-user.model';
import { CredentialInput } from './dto/credential.input';
import { Token, TokenPairOutputDto } from './dto/token.dto';
import { AuthTokenPayload, RefreshTokenPayload, Role, TokenType } from './types';

export interface UserAuthTrait<U extends BaseUser = BaseUser> {
  tryLoginByEmailAndPassword(email: string, password: string): Promise<U | null>;
  getOne(filter: { id: string; refreshJwtHash: string }): Promise<U | null>;
  updateJwtHash(userId: string, hash: string): Promise<void>;
}

export abstract class AuthService<U extends BaseUser = BaseUser> {
  constructor(
    private userAuth: UserAuthTrait<U>,
    private userRole: Role,
    protected logger: AppLogger,
    protected conf: ConfigService,
    protected jwtService: JwtService,
  ) {
    this.logger.setContext('AuthService');
  }

  async signIn(input: CredentialInput): Promise<TokenPairOutputDto> {
    const user = await this.userAuth.tryLoginByEmailAndPassword(input.email, input.password);
    if (!user) {
      throw new AuthenticationError('Incorrect email or password.');
    }
    return await this.createAndSaveTokenPair(user._id);
  }

  verifyToken(jwt: string): AuthTokenPayload {
    return this.jwtService.verify<AuthTokenPayload>(jwt);
  }

  async refreshAuthToken(refreshJwt: string): Promise<TokenPairOutputDto> {
    this.logger.verbose('refreshAuthToken');
    const { sub: userId, type: tokenType } =
      this.jwtService.verify<RefreshTokenPayload>(refreshJwt);
    if (tokenType !== TokenType.Refresh) {
      throw new AuthenticationError(`Expected Refresh token. Received ${tokenType} token`);
    }
    const user = await this.userAuth.getOne({ id: userId, refreshJwtHash: hash(refreshJwt) });
    if (!user) {
      throw new AuthenticationError('No user with this refresh JWT');
    }
    return await this.createAndSaveTokenPair(userId);
  }

  private async createAndSaveTokenPair(userId: string): Promise<TokenPairOutputDto> {
    return {
      authToken: this.createAuthToken(userId),
      refreshToken: await this.createAndSaveUserRefreshToken(userId),
    };
  }

  private createAuthToken(userId: string): Token {
    this.logger.verbose(`createAuthToken for ${userId}`);
    const payload: AuthTokenPayload = { type: TokenType.Auth, sub: userId, role: this.userRole };
    const expireDelay = this.conf.jwt.authExpire;
    const [delayAmount, delayUnit] = splitDateAmountAndUnit(expireDelay);
    const expirationDate = moment().add(delayAmount, delayUnit as any);
    return {
      expiresAt: expirationDate.toDate(),
      token: this.jwtService.sign(payload, { expiresIn: expireDelay }),
    };
  }

  private async createAndSaveUserRefreshToken(userId: string): Promise<Token> {
    this.logger.verbose(`createAndSaveUserRefreshToken for ${userId}`);
    const refreshToken = this.createRefreshToken(userId);
    await this.userAuth.updateJwtHash(userId, hash(refreshToken.token));
    return refreshToken;
  }

  private createRefreshToken(userId: string): Token {
    this.logger.verbose(`createRefreshToken for ${userId}`);
    const payload: RefreshTokenPayload = {
      type: TokenType.Refresh,
      sub: userId,
      role: this.userRole,
    };
    const expireDelay = this.conf.jwt.refreshExpire;
    const [delayAmount, delayUnit] = splitDateAmountAndUnit(expireDelay);
    const expirationDate = moment().add(delayAmount, delayUnit as any);
    return {
      expiresAt: expirationDate.toDate(),
      token: this.jwtService.sign(payload, { expiresIn: expireDelay }),
    };
  }
}

const splitDateAmountAndUnit = (str: string): [number, string] => {
  const match = str.match(jwtDelayRegex);
  if (!match) {
    throw new InternalServerErrorException(`"${str}" doest not match regex ${jwtDelayRegex}`);
  }
  return [+match[1], match[2]];
};
