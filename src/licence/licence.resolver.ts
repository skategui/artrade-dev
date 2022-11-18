import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Public } from '../auth/decorators/public.decorator';
import { AppLogger } from '../logging/logging.service';
import { Licence } from './licence.model';
import { LicenceService } from './licence.service';

@Resolver(() => Licence)
export class LicenceResolver {
  constructor(private logger: AppLogger, private licenceService: LicenceService) {
    this.logger.setContext(this.constructor.name);
  }

  /* ================= QUERY =============== */
  @Public()
  @Query(() => [Licence])
  async licences(): Promise<Licence[]> {
    this.logger.verbose('licences');
    return await this.licenceService.getMany();
  }

  /* ================= MUTATION =============== */
  @Public()
  @Mutation(() => Licence)
  async createLicence(@Args('name') name: string): Promise<Licence> {
    this.logger.verbose('createLicence');
    return await this.licenceService.create(name);
  }
}
