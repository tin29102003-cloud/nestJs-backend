import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CACHE_SERVICE_INTERFACE, type CacheServiceInterface } from 'src/cache/domain/interface/cache.interface';
import { SortOderType } from 'src/common/constants/user.constaint';
import { ProductCategory } from 'src/product_category/domain/entities/product_category.entity.ts';
import { PRODUCT_CATEGORY_REPOSITORY_INTERFACE, type ProductCategoryRepositoryInterface } from 'src/product_category/domain/interface/product_category.interface';

@Injectable()
export class ProductCategoryService {
    private readonly logger = new Logger(ProductCategoryService.name);
    constructor(
        @Inject(PRODUCT_CATEGORY_REPOSITORY_INTERFACE)
        private readonly productCategoryRepository: ProductCategoryRepositoryInterface,
        @Inject(CACHE_SERVICE_INTERFACE)
        private readonly cacheService: CacheServiceInterface
    ) {}
    async getProductCategoryById(id: number): Promise<ProductCategory | null> {
        return await this.productCategoryRepository.findProductCategoryById(id);
    }
    async createProductCategory(data: Partial<ProductCategory>): Promise<ProductCategory> {
        return await this.productCategoryRepository.createProductCategory(data);
    }
    async updateProductCategoryBy(condition: Partial<ProductCategory>, data: Partial<ProductCategory>): Promise<boolean> {
        return await this.productCategoryRepository.updateProductCategoryBy(condition, data);
    }
    async deleteProductCategory(condition: Partial<ProductCategory>): Promise<boolean> {
        return await this.productCategoryRepository.deleteProductCategory(condition);
    }
    async searchProductCategory(keyword: string, limit: number, offset: number, attributes?: string[], Order?: [string, SortOderType][]): Promise<{rows: ProductCategory[] , count: number}> {
        return await this.productCategoryRepository.searchProductCategory(keyword, limit, offset, attributes, Order);
    }
    async findProductCategoryBy(condition: Partial<ProductCategory>):Promise<ProductCategory | null> {
        return await this.productCategoryRepository.findProductCategoryBy(condition);
    }
    async findAndCountProductCategoryBy(limit: number, offset: number, order?: [string, 'ASC' | 'DESC'][], attributes?: string[],condition?: Partial<ProductCategory>): Promise<{rows: ProductCategory[] , count: number}> {
        return await this.productCategoryRepository.findAndCountProductCategoryBy(limit, offset, order, attributes, condition);
    }
    async getMaxValueOfField(fieldName: keyof ProductCategory, condition?: Partial<ProductCategory>): Promise<number | null> {
        return await this.productCategoryRepository.getMaxValueOfField(fieldName, condition);
    }
    // async incrementField(field: keyof ProductCategory, amount: number, condition?: Partial<ProductCategory>): Promise<void> {
    //     await this.productCategoryRepository.incrementField(field, amount, condition);
    // }
    async adjustOrderInRange(amount: number, range: { gt?: number; lte?: number; gte?: number; lt?: number }): Promise<void> {
        await this.productCategoryRepository.adjustOrderInRange(amount, range);
    }
    async findProductCategoryByExceptId(condition: Partial<ProductCategory>, id: number): Promise<ProductCategory | null> {
        return await this.productCategoryRepository.findProductCategoryByExceptId(condition, id);
    }
    async hasChildren(id: number): Promise<boolean> {
        return await this.productCategoryRepository.hasChildren(id);
    }
    async executeTransaction<T>(callback: (transaction: unknown) => Promise<T>): Promise<T>{
        return await this.productCategoryRepository.executeTransaction(callback);
    }
    private getPaginationParams(maxLimit: number,page?: string, limit?: string)  {
        const pageSafe = Math.max(1, Number(page) || 1);
        const limitSafe = Math.max(1, Number(limit) || maxLimit);
        return {
            pageSafe,
            limitSafe,
            offset: (pageSafe - 1) * limitSafe
        };
    }
    private getResulData(rows: ProductCategory[],totalItems: number, limit: number, page: number) {
        const totalPages = Math.ceil(totalItems / limit);
        return {
            data: rows,
            pagination: {
                currentPage: page,
                limit: limit,
                totalItems: totalItems,
                totalPages: totalPages
            }
        }
    }
    private async generateNextOrder(){
        const maxOrder = await this.getMaxValueOfField('stt');
        return (maxOrder || 0) + 1;
    }
    async findAllProductCategory(keyword?: string, page?: string, limit?: string) {
        const { pageSafe, limitSafe, offset } = this.getPaginationParams(20, page, limit);
        const { rows, count } = await this.searchProductCategory(keyword || '', limitSafe, offset,undefined, [['createdAt', 'ASC']]);
        return this.getResulData(rows, count, limitSafe, pageSafe);
    }
    
    async findOneProductCategoryById(id: number) {
       const newsCategory = await this.getProductCategoryById(id);
       if(!newsCategory){
            throw new NotFoundException(`Không tìm thấy danh mục sản phẩm với id ${id}`); 
       }
       return newsCategory;
    }    
}
