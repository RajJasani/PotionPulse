import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type ForecastDocument = Forecast & Document;

@Schema({ timestamps: true })
export class Forecast {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Ingredient', required: true, index: true })
  ingredientId!: Types.ObjectId;

  @Prop({ required: true, default: Date.now })
  generatedAt!: Date;

  @Prop({ default: '14d' })
  horizon!: string;

  @Prop({ required: true, default: 'seasonal_naive_v1' })
  modelVersion!: string;

  @Prop({ default: 'ADEQUATE', enum: ['SUFFICIENT', 'LIMITED', 'SPARSE', 'ADEQUATE'] })
  dataSufficiency!: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: [] })
  points!: Array<{
    date: string;
    baselineDemand: number;
    eventAdjustedDemand: number;
  }>;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'DemandEvent' }], default: [] })
  eventIds!: Types.ObjectId[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const ForecastSchema = SchemaFactory.createForClass(Forecast);

ForecastSchema.index({ tenantId: 1, ingredientId: 1, generatedAt: -1 });
