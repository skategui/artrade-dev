import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TagModule } from '../tag/tag.module';
import { UserModule } from '../user/user.module';
import { CollectionNFT, CollectionNFTSchema } from './collection.model';
import { CollectionResolver } from './collection.resolver';
import { CollectionService } from './collection.service';

@Module({
  imports: [
    forwardRef(() => UserModule),
    TagModule,
    MongooseModule.forFeature([{ name: CollectionNFT.name, schema: CollectionNFTSchema }]),
  ],
  providers: [CollectionService, CollectionResolver],
  exports: [CollectionService],
})
export class CollectionModule {}
