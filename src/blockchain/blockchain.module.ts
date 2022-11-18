import { forwardRef, Module } from '@nestjs/common';
import { CollectionModule } from '../collections/collection.module';
import { NFTModule } from '../nft/nft.module';
import { FileStorageModule } from '../storage/file-storage.module';
import { BlockchainService } from './blockchain.service';

@Module({
  imports: [forwardRef(() => NFTModule), forwardRef(() => CollectionModule), FileStorageModule],
  providers: [BlockchainService],
  exports: [BlockchainService],
})
export class BlockchainModule {}
