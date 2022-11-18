import { bundlrStorage, keypairIdentity, Metaplex } from '@metaplex-foundation/js';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  Cluster,
  clusterApiUrl,
  Connection,
  Keypair,
  ParsedAccountData,
  PublicKey,
} from '@solana/web3.js';
import { FetchCollectionImageBlockchainEvent } from '../collections/collection-metadata-event';
import { CollectionService } from '../collections/collection.service';
import { resizeImageFromUri } from '../helpers/image-resizer';
import { AppLogger } from '../logging/logging.service';
import { FetchNFTImageBlockchainEvent } from '../nft/nft-metadata-event';
import { NftService } from '../nft/nft.service';
import { FileStorageService } from '../storage/file-storage.service';

const network = (process.env.SOLANA_NETWORK as Cluster) ?? 'mainnet-beta';
const connection = new Connection(clusterApiUrl(network));
const wallet = Keypair.generate();

const metaplex = Metaplex.make(connection).use(keypairIdentity(wallet)).use(bundlrStorage());

export type WalletAddr = string;

@Injectable()
export class BlockchainService {
  constructor(
    private logger: AppLogger,
    private readonly nftService: NftService,
    private readonly collectionService: CollectionService,
    private readonly fileStorageService: FileStorageService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  @OnEvent(FetchCollectionImageBlockchainEvent.symbol)
  async fetchCollectionImageBlockchain(
    payload: FetchCollectionImageBlockchainEvent,
  ): Promise<void> {
    this.logger.verbose('FetchCollectionImageBlockchain');
    this.logger.verbose(payload);

    // get data from blockchain
    const nftJson = await this.getNftFromBlockchain(payload.mintAddress);
    // get last wallet, but it's useless for now
    // const ownerInfo = await this.getOwnerWalletAddr(payload.nftId);
    //this.logger.debug(ownerInfo);

    // get only the image from the payload
    const {
      json: { image: imageURI },
    } = nftJson;

    // resize the image
    const resizedImage = await resizeImageFromUri(imageURI);

    //store the image in s3
    const s3Uri = await this.fileStorageService.putObjectInBucket({
      bucketPath: `medium/${payload.collectionId}.webp`,
      imageBuffer: resizedImage,
    });
    this.logger.debug(s3Uri);

    await this.collectionService.updateThumbnail(payload.collectionId, s3Uri);
  }

  @OnEvent(FetchNFTImageBlockchainEvent.symbol)
  async fetchNFTImageFromBlockchain(payload: FetchNFTImageBlockchainEvent): Promise<void> {
    console.log('fetchNFTMetadataBlockchain');
    console.log(payload);

    // get data from blockchain
    const nftJson = await this.getNftFromBlockchain(payload.mintAddress);
    // get last wallet, but it's useless for now
    // const ownerInfo = await this.getOwnerWalletAddr(payload.nftId);
    //this.logger.debug(ownerInfo);

    // get only the image from the payload
    const {
      json: { image: imageURI },
    } = nftJson;

    // resize the image
    const resizedImage = await resizeImageFromUri(imageURI);

    //store the image in s3
    const s3Uri = await this.fileStorageService.putObjectInBucket({
      bucketPath: `medium/${payload.nftId}.webp`,
      imageBuffer: resizedImage,
    });
    this.logger.debug('s3Uri');

    await this.nftService.updateAsset(payload.nftId, s3Uri);
  }

  private async getNftFromBlockchain(
    tokenKey: string,
    metaplexInstance: Metaplex = metaplex,
  ): Promise<any> {
    const mintAddress = new PublicKey(tokenKey);
    return await metaplexInstance.nfts().findByMint({ mintAddress }).run();
  }

  private async getOwnerWalletAddr(
    tokenMint: string,
    solanaConnection: Connection = connection,
  ): Promise<WalletAddr> {
    const mintAddress = new PublicKey(tokenMint);
    const largestAccounts = await solanaConnection.getTokenLargestAccounts(mintAddress);
    const largestAccountInfo = await solanaConnection.getParsedAccountInfo(
      largestAccounts.value[0].address,
    );
    const parsedAccountData = largestAccountInfo?.value?.data as ParsedAccountData;
    return parsedAccountData.parsed?.info.owner;
  }
}
