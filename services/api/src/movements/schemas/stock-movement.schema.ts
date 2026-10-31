import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { StockMovementType } from '@potionpulse/contracts';

export type StockMovementDocument = StockMovement & Document;

@Schema({ timestamps: true })
export class StockMovement {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Ingredient', required: true, index: true })
  ingredientId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Location', required: true, index: true })
  locationId!: Types.ObjectId;

  @Prop({
    required: true,
    enum: Object.values(StockMovementType),
  })
  type!: StockMovementType;

  @Prop({ required: true })
  quantityDelta!: number;

  @Prop({ required: true, lowercase: true, trim: true })
  unit!: string;

  @Prop({ required: true })
  balanceAfter!: number;

  @Prop({ required: true, trim: true })
  reason!: string;

  @Prop({
    required: false,
    enum: ['sale', 'purchase_order', 'manual_adjustment', 'production', 'reversal', 'initial_seed'],
  })
  referenceType?: string;

  @Prop({ required: false, trim: true })
  referenceId?: string;

  @Prop({ required: false, trim: true, index: true })
  idempotencyKey?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  actorId!: Types.ObjectId;

  @Prop({ required: true, default: Date.now, index: true })
  occurredAt!: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const StockMovementSchema = SchemaFactory.createForClass(StockMovement);

StockMovementSchema.index({ tenantId: 1, idempotencyKey: 1 }, { unique: true, sparse: true });
StockMovementSchema.index({ tenantId: 1, ingredientId: 1, occurredAt: -1 });
StockMovementSchema.index({ tenantId: 1, type: 1, occurredAt: -1 });
