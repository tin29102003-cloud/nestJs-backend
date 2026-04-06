import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'node_modules/bcryptjs';
import { UserService } from 'src/user/user.service';
import jwt from 'jsonwebtoken'
@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService
    ){}
    async LoginService(tai_khoan: string, mat_khau: string){
        const user = await this.userService.FindUserToLogin(tai_khoan);
        if(!user){
            throw new  UnauthorizedException("email hoặc tài khoản không tồn tại");
        }
        if(user.khoa === 1){
            throw new ForbiddenException("Tài khoản đã bị khóa");
        }
        if(!user.mat_khau){
            throw new UnauthorizedException("Tài khoản không hợp lệ");
        }
        const isMatch = await bcrypt.compare(mat_khau, user.mat_khau);
        if(!isMatch){
            throw new UnauthorizedException("Mật khẩu không đúng");
        }
        const token = jwt.sign(
            {id: user.id, tai_khoan: user.tai_khoan},
            process.env.JWT_SECRET || 'co-cai-nit',
            {expiresIn: '15m'}
        )

        return {user, token}
    }
}
