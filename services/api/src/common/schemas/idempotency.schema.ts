import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type IdempotencyRecordDocument = IdempotencyRecord & Document;

@Schema({ timestamps: true })
export class IdempotencyRecord {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  key!: string;

  @Prop({ required: true, trim: true })
  operation!: string;

  @Prop({ required: true, trim: true })
  requestHash!: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  response!: Record<string, unknown>;

  @Prop({ required: true, default: 200 })
  statusCode!: number;

  @Prop({ required: true, index: { expires: '24h' } })
  expiresAt!: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const IdempotencyRecordSchema = SchemaFactory.createForClass(IdempotencyRecord);

IdempotencyRecordSchema.index({ tenantId: 1, key: 1 }, { unique: true });
