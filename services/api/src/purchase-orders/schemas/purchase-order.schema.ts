import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type PurchaseOrderDocument = PurchaseOrder & Document;

@Schema({ timestamps: true })
export class PurchaseOrder {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Supplier', required: true, index: true })
  supplierId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  poNumber!: string;

  @Prop({
    default: 'draft',
    enum: ['draft', 'submitted', 'partially_received', 'received', 'cancelled'],
  })
  status!: string;

  @Prop({ default: null })
  expectedAt?: Date;

  @Prop({ default: 0, min: 0 })
  totalCost!: number;

  @Prop({ type: MongooseSchema.Types.Mixed, default: [] })
  items!: Array<{
    ingredientId: Types.ObjectId;
    orderedQty: number;
    receivedQty: number;
    unitCost: number;
  }>;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PurchaseOrderSchema = SchemaFactory.createForClass(PurchaseOrder);

PurchaseOrderSchema.index({ tenantId: 1, poNumber: 1 }, { unique: true });
PurchaseOrderSchema.index({ tenantId: 1, status: 1, expectedAt: 1 });
