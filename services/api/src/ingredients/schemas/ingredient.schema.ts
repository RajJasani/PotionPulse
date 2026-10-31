import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type IngredientDocument = Ingredient & Document;

@Schema({ timestamps: true })
export class Ingredient {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true, uppercase: true })
  sku?: string;

  @Prop({ default: 'General', trim: true })
  category!: string;

  @Prop({ required: true, trim: true, lowercase: true })
  baseUnit!: string;

  @Prop({ default: 0, min: 0 })
  reorderPoint!: number;

  @Prop({ default: 0, min: 0 })
  safetyStock!: number;

  @Prop({ default: 1, min: 0 })
  leadTimeDays!: number;

  @Prop({ default: 0, min: 0 })
  costPerUnit!: number;

  @Prop({ type: Types.ObjectId, ref: 'Location' })
  defaultLocationId?: Types.ObjectId;

  @Prop({ default: null })
  archivedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const IngredientSchema = SchemaFactory.createForClass(Ingredient);

IngredientSchema.index({ tenantId: 1, sku: 1 }, { unique: true, sparse: true });
IngredientSchema.index({ tenantId: 1, name: 1 });
IngredientSchema.index({ tenantId: 1, category: 1 });
IngredientSchema.index({ tenantId: 1, archivedAt: 1 });
