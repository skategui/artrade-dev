import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TagModule } from '../tag/tag.module';
import { UserModule } from '../user/user.module';
import { NftCollection, NftCollectionSchema } from './nft-collection.model';
import { NftCollectionResolver } from './nft-collection.resolver';
import { NftCollectionService } from './nft-collection.service';

@Module({
  imports: [
    forwardRef(() => UserModule),
    TagModule,
    MongooseModule.forFeature([{ name: NftCollection.name, schema: NftCollectionSchema }]),
  ],
  providers: [NftCollectionService, NftCollectionResolver],
  exports: [NftCollectionService],
})
export class NftCollectionModule {}
