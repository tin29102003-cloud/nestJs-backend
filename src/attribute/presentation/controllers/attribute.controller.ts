import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AttributeService } from 'src/attribute/application/services/attribute.service';
import { ROLE } from 'src/common/constants/auth.constaint';
import { Roles } from 'src/common/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { PaginationAttributeDto } from '../dto/attribute.dto';
import { ParamsIdDto } from 'src/user/presentation/dto/user.dto';


@Controller('attribute')
@UseGuards(JwtAuthGuard,RolesGuard)
@Roles(ROLE.ADMIN)
export class AttributeController {
    constructor(
        private readonly attributeService: AttributeService
    ) {}
    @Get('/')
    async findAllAttribute(
        @Query() query : PaginationAttributeDto
    ) {
        const result = await this.attributeService.findAllAttribute(query.keyword, query.page, query.limit);
        return {
            success: true,
            message: "Lấy danh sách thuộc tính thành công",
            result
        }
    }
    @Get('/:id')
    async getAttributeById(
        @Param() params: ParamsIdDto) {
        const result = await this.attributeService.findAttributeById(Number(params.id));
        return {
            success: true,
            message: "Lấy thông tin thuộc tính thành công",
            result
        }
    }
}
