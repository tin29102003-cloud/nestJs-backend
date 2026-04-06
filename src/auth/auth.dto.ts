import {IsNotEmpty, IsString, MinLength, } from 'class-validator'
export class LoginClientDto{
    @IsNotEmpty({message: "Vui lòng nhập email hoặc tài khoản"})
    @IsString()
    tai_khoan!: string;

    @IsNotEmpty({message: "Vui lòng nhập mật khẩu"})
    @IsString()
    @MinLength(8, {message: "mật khẩu phải có ít nhất 8 ký tự"})
    mat_khau!: string;

}