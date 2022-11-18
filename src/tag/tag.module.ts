import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tag, TagSchema } from './tag.model';
import { TagResolver } from './tag.resolver';
import { TagService } from './tag.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Tag.name, schema: TagSchema }])],
  providers: [TagService, TagResolver],
  exports: [TagService],
})
export class TagModule {}
