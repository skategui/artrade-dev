import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Licence, LicenceSchema } from './licence.model';
import { LicenceResolver } from './licence.resolver';
import { LicenceService } from './licence.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Licence.name, schema: LicenceSchema }])],
  providers: [LicenceService, LicenceResolver],
  exports: [LicenceService],
})
export class LicenceModule {}
