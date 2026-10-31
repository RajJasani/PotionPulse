import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CustomerDocument = Customer & Document;

@Schema({ timestamps: true })
export class Customer {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ default: 'standard', enum: ['standard', 'vip', 'guild', 'wholesale'] })
  tier!: string;

  @Prop({ default: 0, min: 0 })
  totalSpend!: number;

  @Prop({ default: 0, min: 0 })
  orderCount!: number;

  @Prop({ trim: true })
  notes?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

CustomerSchema.index({ tenantId: 1, name: 1 });
CustomerSchema.index({ tenantId: 1, email: 1 });
CustomerSchema.index({ tenantId: 1, totalSpend: -1 });
