import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NftCollectionModule } from '../collections/nft-collection.module';
import { TagModule } from '../tag/tag.module';
import { UserModule } from '../user/user.module';
import { Nft, NftSchema } from './nft.model';
import { NftResolver } from './nft.resolver';
import { NftService } from './nft.service';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => NftCollectionModule),
    TagModule,
    MongooseModule.forFeature([{ name: Nft.name, schema: NftSchema }]),
  ],
  providers: [NftService, NftResolver],
  exports: [NftService],
})
export class NftModule {}
