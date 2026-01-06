import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

// Ye Values lowercase hain, toh DB mein bhi lowercase save hongi ('user', 'admin')
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  hash: string; 

  @Prop({ default: null })
  hashedRt: string; 

  // 👇 Yahan Correction ki hai
  @Prop({ 
    type: String, 
    enum: UserRole,        // Direct Enum pass karo (Errors kam honge)
    default: UserRole.USER // Default value bhi Enum se lo
  })
  role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);