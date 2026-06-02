import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { ProductCategoryService } from 'src/product_category/application/services/product_category.service';
import { CreateProductCategoryDto, PaginationProductCategoryDto, UpdateProductCategoryDto } from '../../dto/product_category.dto';
import { ParamsIdDto } from 'src/user/presentation/dto/user.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express/multer/interceptors/file-fields.interceptor';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorator/roles.decorator';
import { ROLE } from 'src/common/constants/auth.constaint';
@UseGuards(JwtAuthGuard,RolesGuard)
@Roles(ROLE.ADMIN)
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
    @HttpCode(HttpStatus.CREATED)
    @Post('/')
    @UseInterceptors(FileFieldsInterceptor([
        {name: 'hinh_dm', maxCount: 1}
    ]))
    async createProductCategory(
        @Body() body: CreateProductCategoryDto,
        @UploadedFiles() files: Record<string, Express.Multer.File[]>
    ) {
        const file = files?.['hinh_dm']?.[0] ?? null;
        const result = await this.productCategoryService.createProductCategoryAdmin(body, 'hinh_dm', file);
        if(result){
            return {
                success: true,
                message: `Thêm mới danh mục sản phẩm thành công với ID là ${result.id}`,
            }
        }
    }
    @Put('/:id')
    @UseInterceptors(FileFieldsInterceptor([
        {name: 'hinh_dm', maxCount: 1}
    ]))
    async updateProductCategory(
        @Body() body: UpdateProductCategoryDto,
        @Param() params: ParamsIdDto,
        @UploadedFiles() files: Record<string, Express.Multer.File[]>
    ) {
        const file = files?.['hinh_dm']?.[0] ?? null;
        const result = await this.productCategoryService.updateProductCategoryAdmin(Number(params.id), body, 'hinh_dm', file);
       return {
            success: true,
            message: result.updated ? `Đã cập nhật danh mục sản phẩm có ID là ${params.id}` : `Không có cập nhật gì ở danh mục sản phẩm có ID là ${params.id}`,
            result: result.category
       }
    }
}
