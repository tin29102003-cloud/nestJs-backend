import { Module } from '@nestjs/common';
import { AuthService } from './application/service/auth.service';

import { NotificationModule } from 'src/notification/notification.module';
import { AuthController } from './presentation/controllers/auth.controller';
import { UserModule } from 'src/user/presentation/user.module';

@Module({
  imports: [UserModule, NotificationModule],//nho import module can dung vaof
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
