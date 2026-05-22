import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { BannerService } from 'src/banner/application/services/banner.service';
import { ROLE } from 'src/common/constants/auth.constaint';
import { Roles } from 'src/common/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { PaginationBannerDto } from '../dto/banner.dto';
import { ParamsIdDto } from 'src/user/presentation/dto/user.dto';

@UseGuards(JwtAuthGuard,RolesGuard) 
@Roles(ROLE.ADMIN)
@Controller('api/admin/banner')
export class BannerController {
    constructor(
        private readonly bannerService: BannerService,
    ){

    }
    @Get('/')
    async GetAllBanner(
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
    async GetBannerById(
        @Param() params: ParamsIdDto
    ){
        const result = await this.bannerService.FindOneBannerById(Number(params.id));
        return {
            success: true,
            message: "Lấy thông tin banner thành công",
            result
        }
    }
}
