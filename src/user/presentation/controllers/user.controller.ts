import { Body, Controller, Get, Inject, Logger, Param, Post, Query, Req, Res,  UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { type Response, type Request } from 'express';
import { ROLE } from 'src/common/constants/auth.constaint';
import { Roles } from 'src/common/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserService } from 'src/user/application/service/user.service';
import { CreateUserDto, PaginationUserDto, ParamsIdDto } from '../dto/user.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { type IStorageService, STORAGE_SERVICE } from 'src/common/storage/domain/interfaces/storage.interface';
import { ROLE_MAP } from 'src/common/constants/user.constaint';

 @UseGuards(JwtAuthGuard,RolesGuard)
//  @Roles(ROLE.ADMIN) 
@Controller('api/admin/user')
export class UserController {
    
    private readonly logger = new Logger(UserController.name);
    
    constructor(
        private readonly userService: UserService,
        
    ){
    
    }
   
   
     
    @Get('/')
    async GetallUser(
        
        @Query() query : PaginationUserDto,
        // @Res({passthrough: true}) res: Response
    ){
        this.logger
        const result = await this.userService.FindAllUser(query.page, query.limit);
        return {
            message: "Lấy danh sách người dùng thành công",
            result
        }
    }
    @Get('/:id')
    async GetUserById(
        @Param() params: ParamsIdDto,
        @Req() req: Request
    ){
        const result = await this.userService.GetOneUserById(Number(params.id));
        return {
            message: "Lấy thông tin người dùng thành công",
            result
        }
    }
    @Post('/')
    @UseInterceptors(FileFieldsInterceptor([
        {name: 'hinh_user', maxCount: 1}
    ], {limits: {fieldSize: 10 * 1024 * 1024}}))
    async CreateUser(
        @Body() body: CreateUserDto,
        @UploadedFiles() files: Record<string, Express.Multer.File[]>
    ){
        debugger
        const file = files?.['hinh_user']?.[0] ?? null;        
        console.log(file);
        const result = await this.userService.createUserByAdmin(body, 'hinh_user',file);
        if(result){
             const role = ROLE_MAP[result.vai_tro];
            return {
                success: true,
                thong_bao: ` Thêm thành công User có id là ${result.id} và role là ${role}`
            }
        }
       
    }
    
}
