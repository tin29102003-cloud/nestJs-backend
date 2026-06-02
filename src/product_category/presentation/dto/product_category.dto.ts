import { Transform, Type } from "class-transformer";
import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsNumberString, IsOptional, IsPositive, IsString } from "class-validator";
import { Trim } from "src/common/decorator/tranform.decorator";

export class PaginationProductCategoryDto{
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
export class CreateProductCategoryDto {
    @IsString({ message: 'Tên danh mục sản phẩm phải là chuỗi' })
    @IsNotEmpty({ message: 'Tên danh mục sản phẩm không được để trống' })
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

    @IsString({ message: 'Slug phải là chuỗi' })
    @Trim()
    @IsOptional()
    slug? : string;

}
export class UpdateProductCategoryDto extends CreateProductCategoryDto {
    @Type(() => Number)
    @IsInt({message: 'Số thứ tự phải là số nguyên'})
    @IsPositive({ message: 'STT phải là số dương' })
    @IsOptional()
    stt?: number;
}