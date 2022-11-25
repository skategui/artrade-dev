import { Injectable } from '@nestjs/common';
import { Args, Mutation, Query } from '@nestjs/graphql';
import { DevEndpoint } from '../auth/decorators/dev-endpoint.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Nft } from '../nft/nft.model';
import { NftSearchArgs } from './dto/nft-search.args';
import { NftElasticsearchService } from './nft-elasticsearch.service';
import { NftElasticsearchTester } from './nft-elasticsearch.tester';

@Injectable()
export class NftElasticsearchResolver {
  constructor(
    private readonly nftElasticsearchService: NftElasticsearchService,
    private readonly nftElasticsearchTester: NftElasticsearchTester,
  ) {}

  @Public()
  @Query(() => [Nft])
  async nftSearch(
    @Args({ type: () => NftSearchArgs, nullable: true }) args: NftSearchArgs = {},
  ): Promise<Nft[]> {
    const { page, titleOrDescription, saleKinds, maxPrice, minPrice, tagIds } = args;
    const pageSize = 20;
    return await this.nftElasticsearchService.get(
      { titleOrDescription, saleKinds, maxPrice, minPrice, requiredTagIds: tagIds },
      {
        skip: (page ?? 0) * pageSize,
        limit: pageSize,
      },
    );
  }

  /* DEV ENDPOINTS */

  @DevEndpoint()
  @Mutation(() => Boolean)
  async _devElasticsearchNftIndexSync(): Promise<boolean> {
    await this.nftElasticsearchService.deleteAndReindexAll();
    return true;
  }

  @DevEndpoint()
  @Query(() => Boolean)
  async _devRunElasticsearchNftTestSuite(): Promise<boolean> {
    // Elasticsearch cannot be run in-memory like we do e.g. with MongoDB.
    // Therefore the tests must be run offline on a real ES instance.
    // These tests ensure that we get the expected results according to the given filters.
    // It serves as regression tests as we tweek the scoring for various criterias.
    await this.nftElasticsearchTester.runTests();
    return true;
  }
}
