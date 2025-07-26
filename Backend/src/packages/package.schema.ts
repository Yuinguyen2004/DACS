import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Package extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  Duration: number;

  @Prop({ required: true })
  Benefit: string;
}

export const PackageSchema = SchemaFactory.createForClass(Package);
