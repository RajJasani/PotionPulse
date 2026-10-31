import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type ProductionBatchDocument = ProductionBatch & Document;

export interface BatchIngredientUsage {
  ingredientId: Types.ObjectId;
  ingredientName?: string;
  plannedQty: number;
  actualQty: number;
  unit: string;
  wastageQty: number;
  cost: number;
}

@Schema({ timestamps: true })
export class ProductionBatch {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Recipe', required: true, index: true })
  recipeId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  batchNumber!: string;

  @Prop({
    default: 'completed',
    enum: ['planned', 'in_progress', 'completed', 'failed'],
  })
  status!: string;

  @Prop({ required: true, default: 1.0, min: 0.01 })
  scaleFactor!: number;

  @Prop({ required: true, min: 0 })
  expectedYield!: number;

  @Prop({ required: true, min: 0 })
  actualYield!: number;

  @Prop({ required: true, default: 'bottles' })
  yieldUnit!: string;

  @Prop({ default: 0, min: 0 })
  totalCost!: number;

  @Prop({ type: MongooseSchema.Types.Mixed, default: [] })
  ingredientsConsumed!: BatchIngredientUsage[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  brewedBy?: Types.ObjectId;

  @Prop({ default: Date.now })
  brewedAt!: Date;

  @Prop({ trim: true })
  notes?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ProductionBatchSchema = SchemaFactory.createForClass(ProductionBatch);

ProductionBatchSchema.index({ tenantId: 1, batchNumber: 1 }, { unique: true });
ProductionBatchSchema.index({ tenantId: 1, recipeId: 1, brewedAt: -1 });
