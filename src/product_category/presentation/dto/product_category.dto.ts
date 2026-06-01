import { IsNumberString, IsOptional, IsString } from "class-validator";
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