
import { PtttService } from 'src/pttt/application/services/pttt.service';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { CreatePtttDto, PaginationPtttDto } from '../dto/pttt.dto';
import { ParamsIdDto } from 'src/user/presentation/dto/user.dto';
import { PTTT } from 'src/pttt/domain/entities/pttt.entity';
import { FileFieldsInterceptor } from '@nestjs/platform-express/multer/interceptors/file-fields.interceptor';

@Controller('/api/admin/pttt')
export class PtttController {
    constructor(
        private ptttService: PtttService
    ) {}
    @Get('/')
    async findAllPTTT(
        @Query() query: PaginationPtttDto
    ) {
        const result = await this.ptttService.findAllPTTT(query.keyword, query.page, query.limit);
        return {
            success: true,
            message: "Lấy danh sách phương thức thanh toán thành công",
            result
        }
    }
    @Get('/:id')
    async getPtttById(
        @Param() params: ParamsIdDto
    ){
        const result = await this.ptttService.findOnePtttById(Number(params.id));
        return {
            success: true,
            message: "Lấy thông tin phương thức thanh toán thành công",
            result
        }
    }
    @HttpCode(HttpStatus.CREATED)
    @Post('/')
    @UseInterceptors(FileFieldsInterceptor([
        {name: 'hinh_pttt', maxCount: 1}
    ]))
    async createPttt(
        @Body() body: CreatePtttDto,
        @UploadedFiles() files: Record<string, Express.Multer.File[]>
    ) {
        const file = files?.['hinh_pttt']?.[0] ?? null;
        const result = await this.ptttService.createPTTTByAdmin(body, 'hinh_pttt', file);
        return {
            success: true,
            message: `Thêm mới phương thức thanh toán thành công với ID là ${result.id}`,
        }
      
    }
    @Delete('/:id')
    async deletePttt(
        @Param() params: ParamsIdDto
    ) {
        await this.ptttService.deletePTTTByAdmin(Number(params.id));
        return {
            success: true,
            message: "Xóa phương thức thanh toán thành công"
        }
    }
}
