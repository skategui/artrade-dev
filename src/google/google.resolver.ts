import { HttpException, HttpStatus } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Public } from '../auth/decorators/public.decorator';
import { TokenPairOutputDto } from '../auth/dto/token.dto';
import { AppLogger } from '../logging/logging.service';
import { GoogleService } from './google.service';

@Resolver()
export class GoogleOauthResolver {
  constructor(private logger: AppLogger, private readonly googleService: GoogleService) {
    this.logger.setContext(this.constructor.name);
  }

  @Public()
  @Mutation(() => TokenPairOutputDto)
  async googleLogin(@Args('token') token: string): Promise<TokenPairOutputDto> {
    const result = await this.googleService.loginGoogleUser(token);
    if (result) {
      return result;
    } else {
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          error: 'Error while logging in with google',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
