import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Package } from 'src/packages/package.schema';
import { User } from 'src/users/user.schema';

@Schema({ timestamps: true })
export class UserPackage extends Document {
  @Prop({ required: MongooseSchema.Types.ObjectId, ref: 'User' })
  user_id: MongooseSchema.Types.ObjectId | User; // ref tới User

  @Prop({ required: MongooseSchema.Types.ObjectId, ref: 'Package' })
  package_id: MongooseSchema.Types.ObjectId | Package; // ref tới Package

  @Prop({ required: true })
  start_at: Date; // Ngày bắt đầu sử dụng gói

  @Prop({ required: true })
  end_at: Date; // Ngày kết thúc sử dụng gói

  @Prop({ required: true })
  is_active: boolean; // Trạng thái gói, true nếu đang hoạt động, false nếu đã hết hạn
}

export const UserPackageSchema = SchemaFactory.createForClass(UserPackage);
