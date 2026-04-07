import { ForbiddenException, HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'node_modules/bcryptjs';
import { UserService } from 'src/user/user.service';
import jwt from 'jsonwebtoken'
import { User } from 'src/user/user.model';
import type { StringValue } from "ms";

import { AuthLoginResult, CustomJwtPayload, LOCK_DURATION, LOGIN_FAIL_MAX, PERM_LOCK_MAX, RefreshJwtPayload, SafeUserData, TempJwtPayLoad } from 'src/common/constants/auth.constaint';
@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService
    ){}
    //hàm privaate sinh token
    private async issueTokenPair(user: User){
        const accessTokenPayLoad: CustomJwtPayload = {
            id: user.id, tai_khoan: user.tai_khoan, vai_tro: user.vai_tro, ho_ten: user.ho_ten, token_version: user.token_version
        }
        const refreshTokenPayLoad: RefreshJwtPayload = {
            id: user.id, token_version: user.token_version
        }
        const jwtExpiresIn  =  process.env.ACCESS_TOKEN_EXPIRES_IN ?? `15m`;
        const refreshJwtExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN ?? "7d";
        // console.log(jwtExpiresIn, refreshJwtExpiresIn);
        const token = jwt.sign(
            accessTokenPayLoad,
            process.env.JWT_SECRET ||'Your-secret-pass',
            {expiresIn: jwtExpiresIn as StringValue}
        );
        // console.log(token);
        const refreshToken = jwt.sign(
            refreshTokenPayLoad,
            process.env.REFRESH_JWT_SECRET ||'Your-secret-pass',
            {expiresIn: refreshJwtExpiresIn as StringValue}
        )
        // console.log(refreshToken);
        const  salt =  bcrypt.genSaltSync(10);
        const hasedRefreshToken =  bcrypt.hashSync(refreshToken, salt);
        this.userService.UpdateUser(user.id, {
            refresh_token: hasedRefreshToken
        });
        return {token, refreshToken};
    }
    async LoginService(tai_khoan: string, mat_khau: string): Promise<AuthLoginResult>{
        const user = await this.userService.FindUserToLogin(tai_khoan);
        if(!user){
            throw new  UnauthorizedException("email hoặc tài khoản không tồn tại");
        }
     
        const now = new Date();
        
        if(!user.xac_thuc_email_luc || user.xac_thuc_email_luc > now){
            throw new HttpException("Bạn cần phải xác thực tài khoản qua mail trước khi đăng nhập",423);
        }
        if(user.khoa === 1){
            throw new HttpException("Tài khoản đã bị khóa vui lòng liên hệ với bản quản trị để xử lý",423);
        }
        if(user.locked_until && user.locked_until > now){
            throw  new HttpException("Tài khoản của bạn đã bị khóa do đăng nhập sai quá nhiều lần, vui thử lại sau ít phút",423);
        }
        if(!user.mat_khau){
            throw new UnauthorizedException("Tài khoản không hợp lệ");
        }
        const isMatch = await bcrypt.compare(mat_khau, user.mat_khau);
        
        if(!isMatch){
            const failCount = user.login_failed_count + 1 ;
            const updatedata: Partial<User> = {
                login_failed_count: failCount,
                last_login_fail: now
            };
            const remaining = PERM_LOCK_MAX - failCount;
            if(failCount > PERM_LOCK_MAX){
                updatedata.khoa = 1;
                updatedata.locked_until = null;
                this.userService.UpdateUser(user.id, updatedata);
                
                throw new HttpException("Bạn nhập sai mật khẩu quá số lần cho phép tài khoản đã bị khóa liên hệ quản trị viên để biết thêm chi tiết", 423);
            }else if(failCount >= LOGIN_FAIL_MAX){
                updatedata.locked_until = new Date(now.getTime() + LOCK_DURATION);
                this.userService.UpdateUser(user.id, updatedata);
                const minutes = LOCK_DURATION / 60_000;
                throw  new HttpException(`Bạn nhập sai mật khẩu quá nhiều, còn ${remaining} lần nũa sẽ khóa tài khoản, vui  lòng thử lại sau ${minutes} phút`, 423);
            }else{
                await this.userService.UpdateUser(user.id, updatedata);
                throw new UnauthorizedException(`Mật khẩu không đúng, còn ${remaining} lần nũa sẽ khóa tài khoản`);
            }
        }
        this.userService.UpdateUser(user.id, {
            login_failed_count: 0,
            last_login_fail: null,
            locked_until: null
        });
        if(user.is_2fa_enable){
            const tempPayLoad: TempJwtPayLoad = {
			    id: user.id, is_temp_2fa: true
		    };
            const tempJwtExpiresIn = process.env.TEMP_TOKEN_EXPIRES_IN ?? "5m";
            const tempToken = jwt.sign(
                tempPayLoad,
                process.env.TEMP_JWT_SECRET!,
                {expiresIn: tempJwtExpiresIn as StringValue }
            );
            return {
                require_2fa: true, 
                temp_token: tempToken,
            }
        }
            const tokens = await this.issueTokenPair(user); 
            const safeUserData: SafeUserData = {
                ho_ten: user.ho_ten, tai_khoan: user.tai_khoan, vai_tro: user.vai_tro, email: user.email, is_shop: user.is_shop, hinh: user.hinh
            };
            return {require_2fa: false, ...tokens, user: safeUserData}
        
        
    }
}
