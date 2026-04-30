import { Expose, Transform } from "class-transformer";
import { IsEmail, IsEnum, IsNotEmpty, IsNumberString, IsOptional, isString, IsString, Matches, MinLength } from "class-validator";
import { ROLE } from "src/common/constants/auth.constaint";

export class PaginationUserDto{
	@IsOptional()
	@IsNumberString({}, { message: 'Page phải là số' })
	page?: string;

	@IsOptional()
	@IsNumberString({}, { message: 'Limit phải là số' })
	limit?: string;
}
export class UserResponseDto {
	@Expose()
	id!: number;

	@Expose()
	tai_khoan!: string;

	@Expose()
	email!: string;

	@Expose()
	ho_ten?: string;

	@Expose()
	ten_shop?: string;

	@Expose()
	vai_tro!: number;

	@Expose()
	hinh?: string;

	@Expose()
	provider?: string;

	@Expose()
	provider_id?: string;

	@Expose()
	khoa!: boolean;

	@Expose()
	dien_thoai?: string;

	@Expose()
	login_failed_count!: number;

	@Expose()
	last_login_fail?: Date;

	@Expose()
	is_shop!: boolean;

	@Expose()
	createdAt!: Date;
}
export class ParamsIdDto {
	@IsNumberString({}, { message: 'ID phải là số' })
	id!: string;
}
export class CreateUserDto {
   @IsNotEmpty({ message: 'Bạn chưa nhập tài khoản' })
	@MinLength(5, { message: 'Tài khoản phải có 5 ký tự trở lên' })
	 tai_khoan!: string;
   
	 @IsNotEmpty({ message: 'Bạn chưa nhập email' })
	 @IsEmail({}, { message: 'Email chưa đúng định dạng' })
	 email!: string
	 
	 @IsNotEmpty({ message: 'Bạn chưa nhập mật khẩu' })
	 @IsString()
	 @MinLength(8, { message: 'Mật khẩu phải trên 8 ký tự' })
	 @Matches(/[A-Z]/, { message: 'Mật khẩu phải có ít nhất 1 chữ in hoa' })
	 @Matches(/[!@#$%^&*(),.?":{}|<>]/, { message: 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt' })
	 mat_khau!: string;
   

	 @IsNotEmpty()
	 @IsString()
	 mat_khau_nhap_lai!: string;
	@Transform(({ value }) => Number(value))
	 @IsEnum(ROLE, {message: "Vai trò không hợp lệ"})
	 vai_tro!: number;
	 
}