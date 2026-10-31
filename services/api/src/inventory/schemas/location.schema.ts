import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LocationDocument = Location & Document;

@Schema({ timestamps: true })
export class Location {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, uppercase: true, trim: true })
  code!: string;

  @Prop({ default: 'shelf', enum: ['shelf', 'room', 'bin', 'refrigerator', 'storage'] })
  type!: string;

  @Prop({ default: false })
  isDefault!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const LocationSchema = SchemaFactory.createForClass(Location);

LocationSchema.index({ tenantId: 1, code: 1 }, { unique: true });
