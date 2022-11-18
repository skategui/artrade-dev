import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AppLogger } from '../logging/logging.service';
import { AdminAuthService } from './admin-auth.service';
import { CurrentAuthToken } from './decorators/current-token-payload.decorator';
import { Public } from './decorators/public.decorator';
import { CredentialInput } from './dto/credential.input';
import { TokenPairOutputDto } from './dto/token.dto';
import { UserAuthService } from './user-auth.service';

@Resolver('auth')
export class AuthResolver {
  constructor(
    private logger: AppLogger,
    private userAuthService: UserAuthService,
    private adminAuthService: AdminAuthService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  /* ================= MUTATION =============== */

  @Public()
  @Mutation(() => TokenPairOutputDto, { description: 'Login to the application as a user' })
  async signIn(@Args() input: CredentialInput): Promise<TokenPairOutputDto> {
    this.logger.verbose('login');
    return await this.userAuthService.signIn(input);
  }

  @Public()
  @Mutation(() => TokenPairOutputDto, { description: 'Login to the application as an admin' })
  async adminSignIn(@Args() input: CredentialInput): Promise<TokenPairOutputDto> {
    this.logger.verbose('adminLogin');
    return await this.adminAuthService.signIn(input);
  }

  @Public()
  @Mutation(() => TokenPairOutputDto, { description: 'Refreshing an user auth token' })
  async refreshAuthToken(
    @CurrentAuthToken() refreshJwt: string, // Unlike other endpoints, the provided jwt must be the refresh token.
  ): Promise<TokenPairOutputDto> {
    this.logger.verbose('refreshUserAuthToken');
    return await this.userAuthService.refreshAuthToken(refreshJwt);
  }

  @Public()
  @Mutation(() => TokenPairOutputDto, { description: 'Refreshing an admin auth token' })
  async adminRefreshAuthToken(
    @CurrentAuthToken() refreshJwt: string, // Unlike other endpoints, the provided jwt must be the refresh token.
  ): Promise<TokenPairOutputDto> {
    this.logger.verbose('refreshAdminAuthToken');
    return await this.adminAuthService.refreshAuthToken(refreshJwt);
  }
}
