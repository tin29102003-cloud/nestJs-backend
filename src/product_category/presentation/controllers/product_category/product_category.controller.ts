import { Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ProductCategoryService } from 'src/product_category/application/services/product_category.service';
import { PaginationProductCategoryDto } from '../../dto/product_category.dto';
import { ParamsIdDto } from 'src/user/presentation/dto/user.dto';

@Controller('/api/admin/danh-muc-sp')
export class ProductCategoryController {
    constructor(
        private readonly productCategoryService: ProductCategoryService,
    ) {}
    @Get('/')
    async findAllProductCategory(
        @Query() query: PaginationProductCategoryDto
    ) {
        const result = await this.productCategoryService.findAllProductCategory(query.keyword, query.page, query.limit);
        return {
            success: true,
            message: "Lấy danh sách danh mục sản phẩm thành công",
            result
        }
    }
    @Get('/:id')
    async getProductCategoryById(
        @Query() params: ParamsIdDto) {
        const result = await this.productCategoryService.findOneProductCategoryById(Number(params.id));
        return {
            success: true,
            message: "Lấy thông tin danh mục sản phẩm thành công",
            result
        }
    }
}
