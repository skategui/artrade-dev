import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NftModule } from '../nft/nft.module';
import { Analytic, AnalyticSchema } from './analytic.model';
import { AnalyticResolver } from './analytic.resolver';
import { AnalyticService } from './analytic.service';

@Module({
  imports: [
    forwardRef(() => NftModule),
    MongooseModule.forFeature([{ name: Analytic.name, schema: AnalyticSchema }]),
  ],
  providers: [AnalyticService, AnalyticResolver],
  exports: [AnalyticService],
})
export class AnalyticModule {}
