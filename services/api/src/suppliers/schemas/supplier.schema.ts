import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type SupplierDocument = Supplier & Document;

export interface SupplierCatalogItem {
  ingredientId: Types.ObjectId;
  supplierSku?: string;
  unitCost: number;
  leadTimeDays: number;
  moq: number; // Minimum Order Quantity
  packSize: number;
}

export interface SupplierPerformance {
  totalOrdersCount: number;
  onTimeDeliveryRate: number; // percentage 0 - 100
  fulfillmentRate: number; // percentage 0 - 100
  rating: number; // 1.0 - 5.0
}

@Schema({ timestamps: true })
export class Supplier {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  contactPerson?: string;

  @Prop({ trim: true })
  email?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ default: 3, min: 0 })
  leadTimeDays!: number;

  @Prop({ default: 'active', enum: ['active', 'inactive'] })
  status!: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: [] })
  catalog!: SupplierCatalogItem[];

  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: {
      totalOrdersCount: 0,
      onTimeDeliveryRate: 100,
      fulfillmentRate: 100,
      rating: 5.0,
    },
  })
  performance!: SupplierPerformance;

  @Prop({ trim: true })
  notes?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);

SupplierSchema.index({ tenantId: 1, name: 1 });
SupplierSchema.index({ tenantId: 1, status: 1 });
