import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SaleDocument = Sale & Document;

@Schema({ timestamps: true })
export class Sale {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  saleNumber!: string;

  @Prop({
    default: 'completed',
    enum: ['completed', 'refunded', 'partially_refunded', 'cancelled'],
  })
  status!: string;

  @Prop({
    default: 'paid',
    enum: ['paid', 'pending', 'refunded'],
  })
  paymentStatus!: string;

  @Prop({ type: Types.ObjectId, ref: 'Customer' })
  customerId?: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  totalAmount!: number;

  @Prop({ default: 'USD', uppercase: true })
  currency!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  actorId!: Types.ObjectId;

  @Prop({ default: Date.now, index: true })
  soldAt!: Date;

  @Prop({ trim: true })
  notes?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SaleSchema = SchemaFactory.createForClass(Sale);

SaleSchema.index({ tenantId: 1, saleNumber: 1 }, { unique: true });
SaleSchema.index({ tenantId: 1, soldAt: -1 });
