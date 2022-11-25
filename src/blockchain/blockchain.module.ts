import { forwardRef, Module } from '@nestjs/common';
import { NftCollectionModule } from '../collections/nft-collection.module';
import { NftModule } from '../nft/nft.module';
import { FileStorageModule } from '../storage/file-storage.module';
import { BlockchainService } from './blockchain.service';

@Module({
  imports: [forwardRef(() => NftModule), forwardRef(() => NftCollectionModule), FileStorageModule],
  providers: [BlockchainService],
  exports: [BlockchainService],
})
export class BlockchainModule {}
