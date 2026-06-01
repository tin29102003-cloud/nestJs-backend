import { Module } from '@nestjs/common';
import { PRODUCT_CATEGORY_REPOSITORY_INTERFACE } from './domain/interface/product_category.interface';
import { ProductCategoryRepository } from './infrastructure/repositories/product_category.repository';
import { ProductCategoryController } from './presentation/controllers/product_category/product_category.controller';
import { ProductCategoryService } from './application/services/product_category.service';
import { SequelizeModule } from '@nestjs/sequelize/dist/sequelize.module';
import { ProductCategoryModel } from './infrastructure/models/product_category.model';
import { UserModule } from 'src/user/user.module';

@Module({
    imports: [
        SequelizeModule.forFeature([ProductCategoryModel]), UserModule
    ],
    providers: [
        ProductCategoryService,
        {
            provide: PRODUCT_CATEGORY_REPOSITORY_INTERFACE,
            useClass: ProductCategoryRepository
        },

    ],
    controllers: [ProductCategoryController],
    exports: [ProductCategoryService]
})
export class ProductCategoryModule {}
