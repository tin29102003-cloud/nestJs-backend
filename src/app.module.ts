import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';

import { NotificationModule } from './notification/notification.module';
import databaseConfig from './config/database.config';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserModule } from './user/user.module';
@Module({
  imports: [
    //load biến môi trường và file env toàn cuc
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig]
    }), ThrottlerModule.forRoot([
      {ttl: 60000, //60s
      limit: 100 //globbal 60s
      }
    ]),
    DatabaseModule,
    AuthModule,
    UserModule,
    NotificationModule
  ]
})
export class AppModule {}
