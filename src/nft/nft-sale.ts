import { Field, Int, InterfaceType, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { z } from 'zod';
import { defaultSubDocWithDiscriminatorSchemaOption } from '../helpers/default-schema-option.tools';
import { Bid } from './bid.model';
import { Offer } from './offer.model';

export enum NftSaleKind {
  Auction = 'Auction',
  FixedPrice = 'FixedPrice',
  OpenToOffer = 'OpenToOffer',
}

registerEnumType(NftSaleKind, {
  name: 'NftSaleKind',
});

export enum NftStatus {
  AuctionPast = 'AuctionPast',
  AuctionOnGoing = 'AuctionOnGoing',
  AuctionFuture = 'AuctionFuture',
  OfferActive = 'activeOffer',
  OfferOpen = 'openOffer',
  FixedPrice = 'FixedPrice',
}

registerEnumType(NftStatus, { name: 'NftStatus' });

const resolveType = (value: BaseNftSale) => {
  switch (value.kind) {
    case NftSaleKind.Auction:
      return NftAuctionSale;
    case NftSaleKind.FixedPrice:
      return NftFixedPriceSale;
    case NftSaleKind.OpenToOffer:
      return NftOpenToOfferSale;
    default:
      throw Error(`Unknown NftSaleKind ${(value as any).kind}`);
  }
};

@InterfaceType({ resolveType })
@Schema({ ...defaultSubDocWithDiscriminatorSchemaOption, discriminatorKey: 'kind' })
export class BaseNftSale {
  @Field(() => NftSaleKind)
  kind: NftSaleKind;
}

@ObjectType({ implements: BaseNftSale })
@Schema(defaultSubDocWithDiscriminatorSchemaOption)
export class NftAuctionSale extends BaseNftSale {
  kind = NftSaleKind.Auction as const;

  @Prop({ required: true, index: true })
  @Field(() => Date)
  startDate: Date;

  @Prop({ required: true, index: true })
  @Field(() => Date)
  endDate: Date;

  @Prop({ required: true })
  @Field(() => Int)
  startingPriceInSol: number;

  @Prop()
  @Field(() => Int, { nullable: true })
  highestBid?: number;

  @Prop([{ type: Bid, default: [] }])
  @Field(() => [Bid])
  bids: Bid[];

  @Prop({ type: Bid, index: true })
  @Field(() => Bid, { nullable: true })
  winnerBid?: Bid;
}

@ObjectType({ implements: BaseNftSale })
@Schema(defaultSubDocWithDiscriminatorSchemaOption)
export class NftFixedPriceSale extends BaseNftSale {
  kind = NftSaleKind.FixedPrice as const;

  @Prop({ required: true })
  @Field(() => Int)
  priceInSol: number;
}

@ObjectType({ implements: BaseNftSale })
@Schema(defaultSubDocWithDiscriminatorSchemaOption)
export class NftOpenToOfferSale extends BaseNftSale {
  kind = NftSaleKind.OpenToOffer as const;

  @Prop([{ type: Offer, default: [] }])
  @Field(() => [Offer])
  offers: Offer[];
}

export type NftSale = NftAuctionSale | NftFixedPriceSale | NftOpenToOfferSale;

export const registerNftSaleSchemas = (schema: MongooseSchema): void => {
  z.object({}).parse(schema);
  schema.discriminator(NftSaleKind.Auction, SchemaFactory.createForClass(NftAuctionSale));
  schema.discriminator(NftSaleKind.FixedPrice, SchemaFactory.createForClass(NftFixedPriceSale));
  schema.discriminator(NftSaleKind.OpenToOffer, SchemaFactory.createForClass(NftOpenToOfferSale));
};

export const NftSaleSchema = SchemaFactory.createForClass(BaseNftSale);
