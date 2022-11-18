import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CollectionModule } from '../collections/collection.module';
import { TagModule } from '../tag/tag.module';
import { UserModule } from '../user/user.module';
import { NFT, NFTSchema } from './nft.model';
import { NftResolver } from './nft.resolver';
import { NftService } from './nft.service';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => CollectionModule),
    TagModule,
    MongooseModule.forFeature([{ name: NFT.name, schema: NFTSchema }]),
  ],
  providers: [NftService, NftResolver],
  exports: [NftService],
})
export class NFTModule {}
