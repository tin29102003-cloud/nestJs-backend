import { Expose, Transform } from "class-transformer";
import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsNumberString, IsOptional, isString, IsString, Matches, MaxLength, minLength, MinLength } from "class-validator";
import { ROLE } from "src/common/constants/auth.constaint";
import { Trim } from "src/common/decorator/tranform.decorator";

export class PaginationUserDto{
	@Trim()
	@IsOptional()
	@IsString()
	keyword?: string;

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
	@Trim()
   @IsNotEmpty({ message: 'Bạn chưa nhập tài khoản' })
	@MinLength(5, { message: 'Tài khoản phải có 5 ký tự trở lên' })
	 tai_khoan!: string;
   
	 @Trim()
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
export class UpdateUserDto {
 
	 
	 @IsOptional()
	 @IsString()
	 @MinLength(8, { message: 'Mật khẩu phải trên 8 ký tự' })
	 @Matches(/[A-Z]/, { message: 'Mật khẩu phải có ít nhất 1 chữ in hoa' })
	 @Matches(/[!@#$%^&*(),.?":{}|<>]/, { message: 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt' })
	 mat_khau?: string;
   

	 @IsOptional()
	 @IsString()
	 mat_khau_nhap_lai?: string;
	
	 @Trim()
	@IsNotEmpty()
	@IsString()
	@MinLength(5, {message: "Họ tên không được dưới 5 ký tự"})
	ho_ten!: string;

	@Trim()
	@IsNotEmpty()
	@IsNumberString()
	@MinLength(9,{message: "Số điện thoại khong dưới 9 ký tự"})
	dien_thoai!: string;

	@Transform(({ value }) => Number(value))
	 @IsEnum(ROLE, {message: "Vai trò không hợp lệ"})
	 vai_tro!: number;
	 
}
export class Disble2FaDto{

	@IsNotEmpty({message: "Lý do ko được để trống"})
	@IsString()
	@MinLength(5,{message:"Lý do không được dưới 5 ký tự"})
	@MaxLength(255,{message: "Lý do không quá  255 ký tự"})
	ly_do!: string;
}
export class QuickUpdateUserDto {
	 @Transform(({ value }) => {
    if (
        value === 'true' ||
        value === true ||
        value === '1' ||
        value === 1
        ) {
        return true;
        }

        return false;
    })
	@IsBoolean()
	khoa!: boolean;
}