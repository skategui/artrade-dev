import { registerEnumType } from '@nestjs/graphql';

export enum ListEventsPossible {
  NftScreenShown = 'NftScreenShown',
  NftScreenCtaClicked = 'NftScreenCtaClicked',
  PurchaseError = 'PurchaseError', // Purchase failed at payment time
  PurchaseRefunded = 'PurchaseRefunded', // Purchased payment was successful, but the offer could not be accepted. Refunded.
  PurchaseRefundFailed = 'PurchaseRefundFailed', // Same as PurchaseRefunded, but the refund failed.
  PurchaseNftTransferError = 'PurchaseNftTransferError', // Offer was successfully accepted, but the NFT transfer failed.
  InsufficientFund = 'InsufficientFund',
}

registerEnumType(ListEventsPossible, {
  name: 'ListEventsPossible',
});
