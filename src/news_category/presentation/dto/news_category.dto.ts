import { Transform } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsNumberString, IsOptional, IsPositive, IsString } from "class-validator";
import { Trim } from "src/common/decorator/tranform.decorator";

export class PaginationNewsCategoryDto{
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
export class CreateNewsCategoryDto{
    @IsString({message: 'Tên danh mục tin phải là chuỗi'})
    @IsNotEmpty({message: 'Tên danh mục tin không được để trống'})
    @Trim()
    ten_dm!: string;

    @IsNumberString({}, { message: 'parent id phải là số' })
    @IsPositive({ message: 'parent id phải là số dương' })
    @IsOptional()
    parent_id?: number;
    
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
export class UpdateNewsCategoryDto extends CreateNewsCategoryDto {
    @IsNumberString({}, {message: 'STT phải là số'})
    @IsPositive({message: 'STT phải là số dương'})
    @IsOptional()
    stt?: number;
}