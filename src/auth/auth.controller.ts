import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginClientDto } from './auth.dto';
import { type Response } from 'express';

@Controller('api/auth')
export class AuthController {
    constructor(private readonly authService: AuthService){}
    @Post('dang-nhap')
    async Login(
        @Body() body: LoginClientDto, 
        @Res({passthrough: true} ) res: Response){
            const result = await this.authService.LoginService(body.tai_khoan, body.mat_khau);
            if(result.require_2fa){
                return {
                    require_2fa: true,
                    temp_token: result.temp_token,
                    thong_bao: "Vui lòng nhập mã xác thực 2 bước từ ứng dụng google authencation",
                    success: true
                }
            }
            const cookieMaxAge = process.env.TEMP_TOKEN_EXPIRES_IN || 15 * 60 * 1_000;
            const cookieMaxAgeRefresh = process.env.COOKIE_REFRESH_MAX_AGE || 7 * 24 * 60 * 60 * 1_000;
            res.cookie("_atkn",result.token,{
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production' ? true : false,//deploy thatja thi mo len
                path: '/',
                sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                maxAge: cookieMaxAge as number, 
            });

            res.cookie("_rtkn",result.token,{
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production' ? true : false,//deploy thatja thi mo len
                path: '/',
                sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                maxAge: cookieMaxAgeRefresh as number, 
            });
            return {
                thong_bao: "Đăng nhập thành công",
                token: result.token,
                user: result.user,
                success: true

            }
        }
    }
