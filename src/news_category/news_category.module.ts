import { Module } from '@nestjs/common';
import {  NewsCategoryController } from './presentation/controllers/news_category.controller';
import { NewsCategoryRepository } from './infrastructure/reppositories/news_category.repository';
import { NEWS_CATEGORY_REPOSITORY_INTERFACE } from './domain/interface/news_category.interface';
import { NewsCategoryService } from './application/services/news_category.service';
import { NewsCategoryModel } from './infrastructure/models/news-category.model';
import { SequelizeModule } from '@nestjs/sequelize/dist/sequelize.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [SequelizeModule.forFeature([NewsCategoryModel]), UserModule],
  controllers: [NewsCategoryController],
  providers: [
    NewsCategoryService,
    {
      provide: NEWS_CATEGORY_REPOSITORY_INTERFACE,
      useClass: NewsCategoryRepository
    }
  ],
  exports: [NewsCategoryService]
})
export class NewsCategoryModule {}
