import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';

import { NotificationModule } from './notification/notification.module';
import databaseConfig from './config/database.config';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserModule } from './user/user.module';
import { StorageModule } from './common/storage/storage.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
@Module({
  imports: [
     ServeStaticModule.forRoot({
            rootPath: join(process.cwd(), 'public'),//báo cho nestjs biết lấy thu mục public làm nơi chưa ảnh tỉnh
            serveRoot: '/',//không càn tiền tố gì cả, cứ gõ /san-pham/... là trỏ thẳng vào trong public
        }),
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
    NotificationModule,
    StorageModule
  ]
})
export class AppModule {}
