import { Transform } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsNumberString, IsOptional, IsString } from "class-validator";
import { Trim } from "src/common/decorator/tranform.decorator";

export class PaginationPtttDto{
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
export class CreatePtttDto {
    @IsString({ message: 'Tên phương thức thanh toán phải là chuỗi' })
    @IsNotEmpty({ message: 'Tên phương thức thanh toán không được để trống' })
    @Trim()
    ten_pt!: string;
    
    @IsString({message: 'Code phương thức thanh toán phải là chuỗi'})
    @IsNotEmpty({ message: 'Code phương thức thanh toán không được để trống' })
    @Trim()
    code!: string
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

    @IsString({ message: 'Slug phải là chuỗi' })
    @Trim()
    @IsOptional()
    slug? : string;
}