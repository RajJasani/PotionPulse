import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from '@potionpulse/contracts';

export type MembershipDocument = Membership & Document;

@Schema({ timestamps: true })
export class Membership {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({
    required: true,
    enum: Object.values(UserRole),
    default: UserRole.STAFF,
  })
  role!: UserRole;

  @Prop({ default: 'active', enum: ['active', 'invited', 'suspended'] })
  status!: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const MembershipSchema = SchemaFactory.createForClass(Membership);

MembershipSchema.index({ tenantId: 1, userId: 1 }, { unique: true });
MembershipSchema.index({ userId: 1, status: 1 });
