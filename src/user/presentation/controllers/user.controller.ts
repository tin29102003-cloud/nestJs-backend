import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Logger, Param, Patch, Post, Put, Query, Req, Res,  UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { type Response, type Request } from 'express';
import { AuthUser, ROLE } from 'src/common/constants/auth.constaint';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserService } from 'src/user/application/service/user.service';
import { CreateUserDto, Disble2FaDto, PaginationUserDto, ParamsIdDto, QuickUpdateUserDto, UpdateUserDto } from '../dto/user.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ROLE_MAP } from 'src/common/constants/user.constaint';
import { Roles } from 'src/common/decorator/roles.decorator';
import { imgageFileFilter } from 'src/common/ultis/file-upload.ulil';

 @UseGuards(JwtAuthGuard,RolesGuard)
 @Roles(ROLE.ADMIN) 
@Controller('api/admin/user')
export class UserController {
     constructor(
        private readonly userService: UserService,
        
    ){
    } 
    @Get('/')
    async GetallUser(
        
        @Query() query : PaginationUserDto,
        // @Res({passthrough: true}) res: Response
    ){

        const result = await this.userService.FindAllUser(query.keyword,query.page, query.limit);
        return {
            success: true,
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
            success: true,
            message: "Lấy thông tin người dùng thành công",
            result
        }
    }
    @HttpCode(HttpStatus.CREATED)
    @Post('/')
    @UseInterceptors(FileFieldsInterceptor([
        {name: 'hinh_user', maxCount: 1}
    ], {limits: {fileSize: 10 * 1024 * 1024 }, fileFilter: imgageFileFilter}))
    async CreateUser(
        @Body() body: CreateUserDto,
        @UploadedFiles() files: Record<string, Express.Multer.File[]>
    ){
        
        const file = files?.['hinh_user']?.[0] ?? null;        
   
        const result = await this.userService.createUserByAdmin(body, 'hinh_user',file);
        if(result){
             const role = ROLE_MAP[result.vai_tro];
            return {
                success: true,
                message: ` Thêm thành công User có id là ${result.id} và role là ${role}`
            }
        }
       
    }
    @Put('/:id')
    @UseInterceptors(FileFieldsInterceptor([
        {name: 'hinh_user', maxCount: 1}
    ],{limits: {fileSize: 10 * 1024 * 1024 }, fileFilter: imgageFileFilter}))
    async UpdateUser(
        @Param() params: ParamsIdDto,
        @Body() body: UpdateUserDto,
        @UploadedFiles() files: Record<string, Express.Multer.File[]>
    ){
        const file = files?.['hinh_user']?.[0] ?? null;
        const result = await this.userService.updateUserByAdmin(Number(params.id),body, 'hinh_user',file);
        return {
            success: true,
            message: result.update ? `Đã cập nhật user có ID là ${result.user.id}` : `Không có cập nhật gì ở User có ID là ${result.user.id}`
        }
    }
    @Delete('/:id')
    async DeleteUser(
        @Req() req: Request,
        @Param() params: ParamsIdDto,
    ){
        const userpayload = req['user'] as AuthUser;
        await this.userService.deleteUserByAdmin(Number(params.id), userpayload.id);
        return {
            success: true,
            message: "Đã xóa thành công user"
        }
    }
    @Patch('/:id/2fa')
    async disble2Fa(
        @Param() params: ParamsIdDto,
        @Body() body: Disble2FaDto
    ){
        const result = await this.userService.disble2FaByAdmin(Number(params.id), body);
        return {
             success: true,
            message: `đã tắt xác thực  2 bước cho người dùng ${result.email}`
        }
    }
    //quick update
    @Patch('/:id')
    async quickUpdate(
        @Param() params: ParamsIdDto,
        @Body() body: QuickUpdateUserDto
    ){
        const result  = await this.userService.quickUpdateUserByAdmin(Number(params.id), body);
        return {
             success: true,
            message: result.update ? 
            "Cập nhật trạng thái khóa thành công"
            : "Không có thay đổi nào"
        }
    }

}
