import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DemandEventDocument = DemandEvent & Document;

@Schema({ timestamps: true })
export class DemandEvent {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true })
  startAt!: Date;

  @Prop({ required: true })
  endAt!: Date;

  @Prop({ required: true, default: 1.0, min: 0.1 })
  multiplier!: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Ingredient' }], default: [] })
  ingredientIds!: Types.ObjectId[];

  @Prop({ default: 'active', enum: ['active', 'scheduled', 'expired', 'archived'] })
  status!: string;

  @Prop({ trim: true })
  description?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const DemandEventSchema = SchemaFactory.createForClass(DemandEvent);

DemandEventSchema.index({ tenantId: 1, startAt: 1, endAt: 1 });
