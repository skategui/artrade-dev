import { ObjectType } from '@nestjs/graphql';
import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { defaultRootDocSchemaOption } from '../../helpers/default-schema-option.tools';
import { CreatePayload } from '../../types/mongo-helpers';
import { BaseUser } from './base-user.model';

export type AdminId = string;

@ObjectType()
@Schema(defaultRootDocSchemaOption)
export class Admin extends BaseUser {}

export const AdminSchema = SchemaFactory.createForClass(Admin);

export type AdminCreatePayload = CreatePayload<Admin>;
