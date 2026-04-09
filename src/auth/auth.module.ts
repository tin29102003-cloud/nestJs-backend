import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from 'src/user/user.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [UserModule, NotificationModule],//nho import module can dung vaof
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
