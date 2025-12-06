import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/user.module';
import { FirebaseStrategy } from './firebase.strategy';
import { FirebaseConfigService } from './firebase.config';
import { EmailService } from './email.service';
import { User, UserSchema } from '../users/user.schema';

@Module({
  imports: [
    UsersModule,
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'firebase' }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [AuthService, FirebaseStrategy, FirebaseConfigService, EmailService],
  controllers: [AuthController],
  exports: [AuthService, FirebaseConfigService, PassportModule],
})
export class AuthModule {}
