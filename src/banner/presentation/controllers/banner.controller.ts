import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { BannerService } from 'src/banner/application/services/banner.service';
import { ROLE } from 'src/common/constants/auth.constaint';
import { Roles } from 'src/common/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CreateBannerDto, PaginationBannerDto, UpdateBannerDto } from '../dto/banner.dto';
import { ParamsIdDto } from 'src/user/presentation/dto/user.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { imgageFileFilter } from 'src/common/ultis/file-upload.ulil';
@UseGuards(JwtAuthGuard,RolesGuard) 
@Roles(ROLE.ADMIN)
@Controller('api/admin/banner')
export class BannerController {
    constructor(
        private readonly bannerService: BannerService,
    ){

    }
    @Get('/')
    async getAllBanner(
        @Query() query: PaginationBannerDto
    ){
        const result = await this.bannerService.FindAllBanner(query.keyword, query.page, query.limit);
        return {
            success: true,
            message: "Lấy danh sách banner thành công",
            result
        }
    }
    
    @Get('/:id')
    async getBannerById(
        @Param() params: ParamsIdDto
    ){
        const result = await this.bannerService.FindOneBannerById(Number(params.id));
        return {
            success: true,
            message: "Lấy thông tin banner thành công",
            result
        }
    }
    @HttpCode(HttpStatus.CREATED)
    @Post('/')
    @UseInterceptors(FileFieldsInterceptor([
        {name: 'hinh_banner', maxCount: 1}
    ], {limits: {fileSize: 10 * 1024 * 1024 }, fileFilter: imgageFileFilter}))
    async createBanner(
        @Body() body: CreateBannerDto,
        @UploadedFiles() files: Record<string, Express.Multer.File[]>
    ){
        const file = files?.['hinh_banner']?.[0] ?? null;
        const result = await this.bannerService.createBannerAdmin(body, 'hinh_banner', file);
        if(result){
            return {
                success: true,
                message: ` Thêm thành công banner có ID là ${result.id}`
            }
        }
    }
    @Put('/:id')
    @UseInterceptors(FileFieldsInterceptor([
        {name: 'hinh_banner', maxCount: 1}
    ], {limits: {fileSize: 10 * 1024 * 1024 }, fileFilter: imgageFileFilter}))
    async updateBanner(
        @Param() params: ParamsIdDto,
        @Body() body: UpdateBannerDto,
        @UploadedFiles() files: Record<string, Express.Multer.File[]>
    ){
        const file = files?.['hinh_banner']?.[0] ?? null;
        const result = await this.bannerService.updateBannerAdmin(Number(params.id), body, 'hinh_banner', file);
        return {
            success: true,
            message: result.update ? `Đã cập nhật banner có ID là ${result.banner.id}` : `Không có cập nhật gì ở Banner có ID là ${result.banner.id}`
        }
    }
    @Delete('/:id')
    async deleteBanner(
        @Param() params: ParamsIdDto
    ){
        await this.bannerService.deleteBannerAdmin(Number(params.id));
        return {
            success: true,
            message: `Đã xóa banner. ID đã xóa là ${params.id}`
        }
    }
}
