import { Prop, Schema } from "@nestjs/mongoose";

@Schema({ timestamps: true })
export class UserPackage extends Document {
  @Prop({ required: true, ref: 'User' })
  user_id: string; // ref tới User

  @Prop({required: true, ref: 'Package'})
  package_id: string; // ref tới Package

  @Prop({ required: true, default: 'active' })
  status: string;

  @Prop({ required: true })
  start_at: Date; // Ngày bắt đầu sử dụng gói

  @Prop({ required: true })
  end_at: Date; // Ngày kết thúc sử dụng gói

  @Prop({ required: true })
  is_active: boolean; // Trạng thái gói, true nếu đang hoạt động, false nếu đã hết hạn
}