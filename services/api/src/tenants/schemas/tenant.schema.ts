import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TenantDocument = Tenant & Document;

@Schema({ timestamps: true })
export class Tenant {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  slug!: string;

  @Prop({ default: 'UTC' })
  timezone!: string;

  @Prop({ default: 'USD' })
  currency!: string;

  @Prop({ default: 'metric' })
  unitSystem!: string;

  @Prop({
    type: Object,
    default: {
      allowNegativeStock: false,
      defaultSafetyStockDays: 7,
    },
  })
  settings!: {
    allowNegativeStock: boolean;
    defaultSafetyStockDays: number;
  };

  createdAt?: Date;
  updatedAt?: Date;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
