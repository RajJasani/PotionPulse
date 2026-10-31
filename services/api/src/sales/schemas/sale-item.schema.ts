import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SaleItemDocument = SaleItem & Document;

@Schema({ timestamps: true })
export class SaleItem {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Sale', required: true, index: true })
  saleId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Ingredient', required: true, index: true })
  ingredientId!: Types.ObjectId;

  @Prop({ required: true, min: 0.0001 })
  quantity!: number;

  @Prop({ required: true, min: 0 })
  unitPrice!: number;

  @Prop({ required: true, min: 0 })
  subtotal!: number;

  @Prop({ type: Types.ObjectId })
  recipeVersionId?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SaleItemSchema = SchemaFactory.createForClass(SaleItem);

SaleItemSchema.index({ tenantId: 1, saleId: 1 });
SaleItemSchema.index({ tenantId: 1, ingredientId: 1 });
