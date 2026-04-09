import { IsEmail, IsNotEmpty, IsNumberString,  IsOptional,  IsString,  Matches , MinLength, } from 'class-validator'
export class LoginDto{
    @IsNotEmpty({message: "Vui lòng nhập email hoặc tài khoản"})
    @IsString()
    tai_khoan!: string;

    @IsNotEmpty({message: "Vui lòng nhập mật khẩu"})
    @IsString()
    @MinLength(8, {message: "mật khẩu phải có ít nhất 8 ký tự"})
    mat_khau!: string;

}
export class RegisterDto {
  
  @IsNotEmpty({ message: 'Bạn chưa nhập tài khoản' })
  @MinLength(5, { message: 'Tài khoản phải có 5 ký tự trở lên' })
  tai_khoan!: string;

  @IsNotEmpty({ message: 'Bạn chưa nhập email' })
  @IsEmail({}, { message: 'Email chưa đúng định dạng' })
  email!: string
  
  @IsNotEmpty({ message: 'Bạn chưa nhập mật khẩu' })
  @MinLength(8, { message: 'Mật khẩu phải trên 8 ký tự' })
  @Matches(/[A-Z]/, { message: 'Mật khẩu phải có ít nhất 1 chữ in hoa' })
  @Matches(/[!@#$%^&*(),.?":{}|<>]/, { message: 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt' })
  mat_khau!: string;

  @IsNotEmpty({ message: 'Bạn chưa nhập lại mật khẩu' })
  mat_khau_nhap_lai!: string;

  @IsNotEmpty({ message: 'Bạn chưa nhập số điện thoại' })
  @IsNumberString({}, { message: 'Điện thoại phải là số' })
  @MinLength(9, { message: 'Điện thoại phải hơn 9 ký tự' })
  dien_thoai!: string;
}
export class VerifyRegisterDto{
  @IsString()
  @IsOptional()
  email?: string;
  @IsOptional()
  @IsString()
  token?: string;
}