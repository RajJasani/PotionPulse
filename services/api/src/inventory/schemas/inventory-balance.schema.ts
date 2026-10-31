import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InventoryBalanceDocument = InventoryBalance & Document;

@Schema({ timestamps: true })
export class InventoryBalance {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Ingredient', required: true, index: true })
  ingredientId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Location', required: true, index: true })
  locationId!: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  onHand!: number;

  @Prop({ required: true, default: 0, min: 0 })
  reserved!: number;

  @Prop({ required: true, default: 1 })
  version!: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const InventoryBalanceSchema = SchemaFactory.createForClass(InventoryBalance);

InventoryBalanceSchema.index(
  { tenantId: 1, ingredientId: 1, locationId: 1 },
  { unique: true },
);
InventoryBalanceSchema.index({ tenantId: 1, onHand: 1 });
