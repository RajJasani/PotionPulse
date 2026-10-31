import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email!: string;

  @Prop({ required: false })
  passwordHash?: string;

  @Prop({ required: true, trim: true })
  displayName!: string;

  @Prop({ type: Object, default: {} })
  authProviderIds?: {
    google?: string;
  };

  @Prop({ default: false })
  isSuperAdmin!: boolean;

  @Prop({ default: 'active', enum: ['active', 'invited', 'suspended'] })
  status!: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
