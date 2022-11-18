import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Public } from '../auth/decorators/public.decorator';
import { AppLogger } from '../logging/logging.service';
import { UserService } from '../user/user.service';
import { EmailingService } from './emailing.service';

@Resolver()
export class EmailingResolver {
  constructor(
    private logger: AppLogger,
    private service: EmailingService,
    private userService: UserService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  /* ================= MUTATION =============== */
  @Public()
  @Mutation(() => Boolean)
  async resentEmail(
    @Args('isForgotPassword') isForgotPassword: boolean,
    @Args('email') email: string,
  ): Promise<boolean> {
    this.logger.verbose('resentEmail');
    const user = await this.userService.getByEmail(email);
    if (!user) {
      return true;
    }
    await this.service.resentEmail(user, isForgotPassword);
    return true;
  }

  @Public()
  @Mutation(() => Boolean)
  async resentEmailVerification(@Args('nickname') nickname: string): Promise<boolean> {
    this.logger.verbose('resentEmailVerification');
    // todo
    return true;
  }

  @Public()
  @Mutation(() => Boolean)
  async emailConfirmation(@Args('message') message: string): Promise<boolean> {
    this.logger.verbose('emailConfirmation');
    // todo
    return true;
  }
}
