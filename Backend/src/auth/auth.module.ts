import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/user.module';
import { FirebaseStrategy } from './firebase.strategy';
import { FirebaseConfigService } from './firebase.config';
import { EmailService } from './email.service';

@Module({
  imports: [
    UsersModule,
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'firebase' }),
  ],
  providers: [AuthService, FirebaseStrategy, FirebaseConfigService, EmailService],
  controllers: [AuthController],
  exports: [AuthService, FirebaseConfigService, PassportModule],
})
export class AuthModule {}
