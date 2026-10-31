import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type RecipeDocument = Recipe & Document;

export interface RecipeIngredientRequirement {
  ingredientId: Types.ObjectId;
  ingredientName?: string;
  quantity: number; // required quantity for base yield
  unit: string;
  costEstimate?: number;
}

@Schema({ timestamps: true })
export class Recipe {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ default: 'General', trim: true })
  category!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ default: 1, min: 1 })
  version!: number;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ required: true, default: 1, min: 0.1 })
  baseYield!: number; // e.g. 10 units

  @Prop({ required: true, default: 'bottles', trim: true })
  yieldUnit!: string; // e.g. 'bottles', 'flasks', 'vials'

  @Prop({ default: 30, min: 1 })
  preparationTimeMinutes!: number;

  @Prop({ type: MongooseSchema.Types.Mixed, default: [] })
  ingredients!: RecipeIngredientRequirement[];

  @Prop({ type: [String], default: [] })
  instructions!: string[];

  @Prop({ default: 0, min: 0 })
  estimatedCostPerUnit!: number;

  @Prop({ default: 0, min: 0 })
  suggestedRetailPrice!: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const RecipeSchema = SchemaFactory.createForClass(Recipe);

RecipeSchema.index({ tenantId: 1, name: 1 });
RecipeSchema.index({ tenantId: 1, category: 1 });
RecipeSchema.index({ tenantId: 1, isActive: 1 });
