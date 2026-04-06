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
            res.cookie('_atkn', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production' ? true : false,
                path: '/',
                sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                maxAge: 15*60*1000
            })
            return {
                thong_bao: 'Đăng nhập thành công',
            success: true,
            token: result.token,
            user: {
                id: result.user.id,
                tai_khoan: result.user.tai_khoan,
                email: result.user.email,
            }
            }  
        }
    }
