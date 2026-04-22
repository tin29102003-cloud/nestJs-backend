import { Controller, Get, Logger, Query, Req, Res, UseGuards } from '@nestjs/common';
import { type Response, type Request } from 'express';
import { ROLE } from 'src/common/constants/auth.constaint';
import { Roles } from 'src/common/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserService } from 'src/user/application/service/user.service';
import { PaginationUserDto } from '../dto/user.dto';

 @UseGuards(JwtAuthGuard,RolesGuard)
//  @Roles(ROLE.ADMIN) 
@Controller('api/admin/user')
export class UserController {
    private readonly logger = new Logger(UserController.name);
    constructor(
        private readonly userService: UserService
    ){
    
    }
   
   
     
    @Get('/')
    async GetallUser(
        @Query() query : PaginationUserDto,
        // @Res({passthrough: true}) res: Response
    ){
        const result = await this.userService.FindAllUser(query.page, query.limit);
        return {
            message: "Lấy danh sách người dùng thành công",
            result
        }
    }
}
