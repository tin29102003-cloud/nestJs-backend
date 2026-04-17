import { Module } from '@nestjs/common';
import { AuthService } from './application/service/auth.service';

import { NotificationModule } from 'src/notification/notification.module';
import { AuthController } from './presentation/controllers/auth.controller';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';
import { PassportModule } from '@nestjs/passport';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [UserModule, NotificationModule,
    JwtModule.register({
      secret: 'abc',
      signOptions: {expiresIn: '1d'}//day laf truong hopwj coookie neu ko  co option se cai nay
    }),PassportModule.register({session: false})
  ],//nho import module can dung vaof
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard,FacebookStrategy,GoogleStrategy],//để jwtau vào để chỗ khác dùng
  exports: [JwtAuthGuard]
})
export class AuthModule {}
