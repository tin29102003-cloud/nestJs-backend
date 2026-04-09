import { Body, Controller, Get, Logger, Post, Query, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import {  LoginDto, RegisterDto, VerifyRegisterDto } from './auth.dto';
import { type Response } from 'express';
import { VerifyEmailPayload } from 'src/common/constants/notification.constant';
import { TemplateService } from 'src/notification/template/template.service';

@Controller('api/auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);
    constructor(
        private readonly authService: AuthService,
        private readonly templateService: TemplateService,
       
    ){}
    private setAuthCookie(res: Response,token: string, refreshToken: string){
         const cookieMaxAge = process.env.COOKIE_ACCESS_MAX_AGE || 15 * 60 * 1_000;
            const cookieMaxAgeRefresh = process.env.COOKIE_REFRESH_MAX_AGE || 7 * 24 * 60 * 60 * 1_000;
            res.cookie("_atkn",token,{
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production' ? true : false,//deploy thatja thi mo len
                path: '/',
                sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                maxAge: cookieMaxAge as number, 
            });

            res.cookie("_rtkn",refreshToken,{
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production' ? true : false,//deploy thatja thi mo len
                path: '/',
                sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                maxAge: cookieMaxAgeRefresh as number, 
            });
    }
    @Post('dang-nhap')
    async LoginClient(
        @Body() body: LoginDto, 
        @Res({passthrough: true} ) res: Response){
            const result = await this.authService.LoginService(body.tai_khoan, body.mat_khau);
        if(result.require_2fa){
            return {
                require_2fa: true,
                temp_token: result.temp_token,
                message: "Vui lòng nhập mã xác thực 2 bước từ ứng dụng google authencation",
                success: true
            }
        }
        this.setAuthCookie(res,result.token,result.refreshToken);
        
        return {
            message: "Đăng nhập thành công",
            token: result.token,
            user: result.user,
            success: true

        }
    }

    @Post('login')
    async LoginAdmin(
        @Body() body: LoginDto, 
        @Res({passthrough: true} ) res: Response){
            const result = await this.authService.LoginAdminService(body.tai_khoan, body.mat_khau);
        if(result.require_2fa){
            return {
                require_2fa: true,
                temp_token: result.temp_token,
                message: "Vui lòng nhập mã xác thực 2 bước từ ứng dụng google authencation",
                success: true
            }
        }
        this.setAuthCookie(res,result.token,result.refreshToken);
        
        return {
            message: "Đăng nhập thành công",
            token: result.token,
            user: result.user,
            success: true

        }
    }
    @Post('dang-ky')
    async RegisterAccount(
        @Body() body: RegisterDto,
        @Res({passthrough:true}) res: Response){
            const result = await this.authService.RegisterService(body.tai_khoan, body.email, body.mat_khau, body.mat_khau_nhap_lai,body.dien_thoai);
             return {
                message:"Đã đăng ký thành công tài khoản vui long xac thục qua mail"
                ,success: true
            }
        }
    @Get('xac-thuc-dang-ky')
    async VerifyRegisterAccount(
        @Query()  query: VerifyRegisterDto,
        @Res() res: Response
    ){
        let payload: VerifyEmailPayload
        try {
            const {email, token} = query;
            console.log(query);
            const result = await this.authService.VerifyService(email, token);
            let html = '';
            console.log(result);
            if(result.type === 'invalid_request'){
                html = this.templateService.compileTemplate('verify_email',payload= {
                    title: "Xác thực thông báo",
                    content: "Đường dẫn không hợp lệ. Thiếu token hoặc email.",
                    link: `${process.env.BASE_URL || 'phimmoi.com'}`,
                    buttonText: "Quay lại trang chủ",
                    mainColor: '#E94E02',
                    borderColor: '#E94E02'
                })
                return res.status(400).send(html);
            }else if(result.type === 'invalid_token'){
                html = this.templateService.compileTemplate('verify_email', payload = {
                    title: "Xác thực thông báo",
                    content: "Liên kết xác thực không hợp lệ hoặc hết hạn. Vui lòng thử đăng ký lại.",
                    link: `${process.env.BASE_URL || 'phimmoi.com'}`,
                    buttonText: "Quay lại trang chủ",
                    mainColor: '#E94E02',
                    borderColor: '#E94E02'
                });
                return res.status(200).send(html);
            }else if(result.type === 'success'){
                		

            const succesMessage = `Xin chào ${result.user.tai_khoan}, bạn đã kích hoạt tài khoản KADU Shop thành công. Hãy đăng nhập để bắt đầu trải nghiệm mua sắm tuyệt vời!`;
                html = this.templateService.compileTemplate('verify_email',payload= {
                    title: "Xác thực thành công",
                    content: succesMessage,
                    link: `${process.env.LOGIN_URL || 'phimmoi.com'}`,
                    buttonText: "Quay lại trang đăng nhập",
                    mainColor: '#02A4E9',
                    borderColor: '#02A4E9'
                })
                return res.status(200).send(html);
            }
        } catch (err) {
            const error = err as Error;
            const html = this.templateService.compileTemplate('verify_email',payload = {
                title : 'Xác thực không thành công',
                content : "Lỗi máy chủ khi xác thực. Vui lòng thử lại sau.",
                link: `${process.env.BASE_URL || 'phimmoi.com'}`,
                buttonText: "Quay lại trang chủ",
                mainColor: '#E94E02',
                borderColor: '#E94E02'
            })
            this.logger.error(`[CRITICAL] Lỗi API Xác thực: ${error.message}`, error.stack);
            return res.status(500).send(html);
        }
        
    }   
    
    

    

}
