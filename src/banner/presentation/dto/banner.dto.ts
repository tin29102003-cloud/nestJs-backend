import { Transform, Type } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsNumber, IsNumberString, IsOptional, IsPositive, isPositive, IsString, IsUrl } from "class-validator";
import { BannerPositionType } from "src/common/constants/banner.constaint";
import { Trim } from "src/common/decorator/tranform.decorator";
export class PaginationBannerDto{
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
export class CreateBannerDto{
    @IsString({message: 'Tên banner phải là chuỗi'})
    @IsNotEmpty({message: 'Tên banner không được để trống'})
    @Trim()
    name!: string;

    @IsString({message: 'Đường dẫn phải là chuỗi'})
    @IsNotEmpty({message: 'Đường dẫn không được để trống'})
    @Trim()
    @IsUrl({
        require_protocol: true,//bật yêu cầu phải có http:// hoặc https://
    }, 
    {
        message: 'URL phải hợp lệ và bắt đầu bằng http hoặc https'
    })   
    url!: string;

    @IsEnum(BannerPositionType, 
        {message: 'Vị trí không hợp lệ. Các vị trí cho phép: home_top, home_middle, home_bottom, home_slider, popup'

        }
    )
    vi_tri!: BannerPositionType;

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
    an_hien!: boolean;
}
export class UpdateBannerDto extends CreateBannerDto{
    @IsOptional()
    @Type(() => Number)
    @IsInt({message: 'Số thứ tự phải là số nguyên'})
    @IsPositive({message: 'Số thứ tự phải là số dương'})
    stt?: number;
}