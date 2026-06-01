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
import { RealtimeModule } from './realtime/realtime.module';

import { BannerModule } from './banner/banner.module';
import { NewsCategoryModule } from './news_category/news_category.module';
import { CacheModule } from './cache/cache.module';
import { ProductCategoryModule } from './product_category/product_category.module';
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
      limit: 10000 //globbal 60s
      }
    ]),
    DatabaseModule,
    AuthModule,
    UserModule,
    NotificationModule,
    StorageModule,
    RealtimeModule,
    BannerModule,
    NewsCategoryModule,
    CacheModule,
    ProductCategoryModule
  ]
})
export class AppModule {}
