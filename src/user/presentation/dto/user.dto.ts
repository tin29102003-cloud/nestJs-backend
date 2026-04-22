import { Expose } from "class-transformer";
import { IsNumberString, IsOptional } from "class-validator";

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