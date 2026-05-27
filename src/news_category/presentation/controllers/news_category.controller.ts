import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ROLE } from 'src/common/constants/auth.constaint';
import { Roles } from 'src/common/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { NewsCategoryService } from 'src/news_category/application/services/news_category.service';
import { CreateNewsCategoryDto, PaginationNewsCategoryDto } from '../dto/news_category.dto';
import { ParamsIdDto } from 'src/user/presentation/dto/user.dto';
@UseGuards(JwtAuthGuard,RolesGuard)
@Roles(ROLE.ADMIN)
@Controller('/api/admin/danh-muc-tin')
export class NewsCategoryController {
    constructor(
        private readonly newsCategoryService: NewsCategoryService,
    ){}
    @Get('/')
    async getAllNewsCategory(
        @Query() query: PaginationNewsCategoryDto
    ){
        const result = await this.newsCategoryService.findAllNewsCategory(query.keyword, query.page, query.limit);
        return {
            success: true,
            message: "Lấy danh sách danh mục tin thành công",
            result
        }
    }
    @HttpCode(HttpStatus.CREATED)
    @Post('/')
    async createNewsCategory(
        @Body() body: CreateNewsCategoryDto
    ){
        const result = await this.newsCategoryService.createNewsCategoryAdmin(body);
        if(result){
            return {
                success: true,
                message: `Thêm mới danh mục tin thành công với ID là ${result.id}`,
            }
        }
     
    }
    @Get('/:id')
    async getNewsCategoryById(
        @Param() params: ParamsIdDto
    ){
        const result = await this.newsCategoryService.findOneNewsCategoryById(Number(params.id));
        return {
            success: true,
            message: "Lấy thông tin danh mục tin thành công",
            result
        }
    }
    //mai làm tiep update và delete sau và thêm phần redis cache vào sau
}
