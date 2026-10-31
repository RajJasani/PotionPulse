import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type AnomalyDocument = Anomaly & Document;

@Schema({ timestamps: true })
export class Anomaly {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Ingredient', required: true, index: true })
  ingredientId!: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['CONSUMPTION_SPIKE', 'LEDGER_DISCREPANCY', 'UNUSUAL_ADJUSTMENT', 'MISSING_STOCK'],
  })
  type!: string;

  @Prop({ default: 'medium', enum: ['low', 'medium', 'high', 'critical'] })
  severity!: string;

  @Prop({ default: Date.now })
  observedAt!: Date;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  evidence!: {
    observedValue?: number;
    expectedBaseline?: number;
    deviationPercentage?: number;
    explanation?: string;
  };

  @Prop({ default: 'open', enum: ['open', 'acknowledged', 'resolved', 'false_positive'] })
  status!: string;

  @Prop({ required: true, trim: true })
  fingerprint!: string;

  @Prop({ trim: true })
  resolutionNotes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  resolvedBy?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AnomalySchema = SchemaFactory.createForClass(Anomaly);

AnomalySchema.index({ tenantId: 1, fingerprint: 1 });
AnomalySchema.index({ tenantId: 1, status: 1, observedAt: -1 });
