import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { NotificationModule } from './notification/notification.module';
import databaseConfig from './config/database.config';
@Module({
  imports: [
    //load biến môi trường và file env toàn cuc
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig]
    }),
    DatabaseModule,
    AuthModule,
    UserModule,
    NotificationModule
  ]
})
export class AppModule {}
