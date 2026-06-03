import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CACHE_SERVICE_INTERFACE, type CacheServiceInterface } from 'src/cache/domain/interface/cache.interface';
import { AllowedUpdateDanhMucSP } from 'src/common/constants/product_category.constaint';
import { REDIS_KEYS } from 'src/common/constants/redis.constaint';
import { Multer } from 'src/common/constants/storage.containt';
import { SortOderType, SortOrder } from 'src/common/constants/user.constaint';
import { type IStorageService, STORAGE_SERVICE } from 'src/common/storage/domain/interfaces/storage.interface';
import { ProductCategory } from 'src/product_category/domain/entities/product_category.entity.ts';
import { PRODUCT_CATEGORY_REPOSITORY_INTERFACE, type ProductCategoryRepositoryInterface } from 'src/product_category/domain/interface/product_category.interface';
import { CreateProductCategoryDto, UpdateProductCategoryDto } from 'src/product_category/presentation/dto/product_category.dto';

@Injectable()
export class ProductCategoryService {
    private readonly logger = new Logger(ProductCategoryService.name);
    constructor(
        @Inject(PRODUCT_CATEGORY_REPOSITORY_INTERFACE)
        private readonly productCategoryRepository: ProductCategoryRepositoryInterface,
        @Inject(CACHE_SERVICE_INTERFACE)
        private readonly cacheService: CacheServiceInterface,
        @Inject(STORAGE_SERVICE)
        private readonly storageService: IStorageService
    ) {}
    async getProductCategoryById(id: number): Promise<ProductCategory | null> {
        return await this.productCategoryRepository.findProductCategoryById(id);
    }
    async createProductCategory(data: Partial<ProductCategory>): Promise<ProductCategory> {
        return await this.productCategoryRepository.createProductCategory(data);
    }
    async updateProductCategoryBy(condition: Partial<ProductCategory>, data: Partial<ProductCategory>, transaction?: unknown): Promise<boolean> {
        return await this.productCategoryRepository.updateProductCategoryBy(condition, data, transaction);
    }
    async deleteProductCategory(condition: Partial<ProductCategory>, transaction?: unknown): Promise<boolean> {
        return await this.productCategoryRepository.deleteProductCategory(condition, transaction);
    }
    async searchProductCategory(keyword: string, limit: number, offset: number, attributes?: string[], Order?: [string, SortOderType][]): Promise<{rows: ProductCategory[] , count: number}> {
        return await this.productCategoryRepository.searchProductCategory(keyword, limit, offset, attributes, Order);
    }
    async findProductCategoryBy(condition: Partial<ProductCategory>):Promise<ProductCategory | null> {
        return await this.productCategoryRepository.findProductCategoryBy(condition);
    }
    async findAndCountProductCategoryBy(limit: number, offset: number, order?: [string, SortOderType][], attributes?: string[],condition?: Partial<ProductCategory>): Promise<{rows: ProductCategory[] , count: number}> {
        return await this.productCategoryRepository.findAndCountProductCategoryBy(limit, offset, order, attributes, condition);
    }
    async getMaxValueOfField(fieldName: keyof ProductCategory, condition?: Partial<ProductCategory>): Promise<number | null> {
        return await this.productCategoryRepository.getMaxValueOfField(fieldName, condition);
    }
    // async incrementField(field: keyof ProductCategory, amount: number, condition?: Partial<ProductCategory>): Promise<void> {
    //     await this.productCategoryRepository.incrementField(field, amount, condition);
    // }
    async adjustOrderInRange(amount: number, range: { gt?: number; lte?: number; gte?: number; lt?: number }, transaction?: unknown): Promise<void> {
        await this.productCategoryRepository.adjustOrderInRange(amount, range, transaction);
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
    private async rollbackImage(imageUrl: string | null): Promise<void> {
        if (!imageUrl) return;
        await this.storageService.deleteFile(imageUrl).catch(() => {
            this.logger.warn(`Không thể xóa hình: ${imageUrl}`);
        });
    }
    private removeVietnameseTones(str: string): string {
        return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D');
    }
    private generateSlug(text: string): string {
        if(!text) return "";
        return this.removeVietnameseTones(text)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')//
        .replace(/^-+|-+$/g, '');
    }
    private resolveFinalSlug(providedSlug: string | undefined, name: string): string {
        if (providedSlug) {
            const slugNoTones = this.removeVietnameseTones(providedSlug);
            if (slugNoTones !== providedSlug) {
                throw new BadRequestException('Slug không được chứa ký tự có dấu tiếng việt');
            }
            const isValidSlug = /^[a-z0-9-]+$/;
            if (!isValidSlug.test(providedSlug)) {
                throw new BadRequestException('Slug chỉ được chứa chữ thường, số và dấu gạch ngang');
            }
            return providedSlug;
        }
        return this.generateSlug(name);
    }
    private async assertSlugUnique(slug: string, excludeId?: number): Promise<void> {
        const existingCategory = excludeId
            ? await this.findProductCategoryByExceptId({ slug }, excludeId)
            : await this.findProductCategoryBy({ slug });

        if (existingCategory) {
            throw new ConflictException('Slug đã tồn tại vui lòng chọn slug khác');
        }
    }
    private resolveNewSlug(
        oldSlug: string,
        newSlug: string | undefined,
        newName: string | undefined
    ){
        if(newSlug && newSlug !== oldSlug){
            if (this.removeVietnameseTones(newSlug) !== newSlug) {
                throw new BadRequestException('Slug không được chứa ký tự có dấu tiếng Việt');
            }
            if (!/^[a-z0-9-]+$/.test(newSlug)) {
                throw new BadRequestException('Slug chỉ được chứa chữ thường, số và dấu gạch ngang');
            }
            return newSlug;
        }
        if(!newSlug && newName){
            return this.generateSlug(newName);
        }
        return null;
    }
    async findAllProductCategory(keyword?: string, page?: string, limit?: string) {
        const { pageSafe, limitSafe, offset } = this.getPaginationParams(20, page, limit);
        const { rows, count } = await this.searchProductCategory(keyword || '', limitSafe, offset,undefined, [['createdAt', SortOrder.DESC]]);
        return this.getResulData(rows, count, limitSafe, pageSafe);
    }
    
    async findOneProductCategoryById(id: number) {
       const newsCategory = await this.getProductCategoryById(id);
       if(!newsCategory){
            throw new NotFoundException(`Không tìm thấy danh mục sản phẩm với id ${id}`); 
       }
       return newsCategory;
    }    
    async createProductCategoryAdmin(dto: CreateProductCategoryDto, imageFieldName: string, file?: Multer) {
        if(!file){
            throw new BadRequestException(`Bạn phải cung cấp hình ảnh cho danh mục sản phẩm`);
        }
        const existingCategory = await this.findProductCategoryBy({ ten_dm: dto.ten_dm });
        if (existingCategory) {
            throw new ConflictException('Tên danh mục sản phẩm đã tồn tại vui lòng chọn tên khác');
        }
        if(dto.parent_id !== 0 && dto.parent_id !== null){
            const parentCategory = await this.getProductCategoryById(Number(dto.parent_id));
            if(!parentCategory){
                throw new BadRequestException('Danh mục cha Không tồn tại vui lòng nhập lại');
            }
        }
        const newOrder = await this.generateNextOrder();
        const finalSlug = this.resolveFinalSlug(dto.slug, dto.ten_dm);
        await this.assertSlugUnique(finalSlug);
        // let finalSlug: string = "";
        // if(dto.slug && dto.slug !== undefined){
        //     const slugNovietnese = this.removeVietnameseTones(dto.slug); 
        //     if(slugNovietnese !== dto.slug){
        //         throw new BadRequestException('Slug không được chứa ký tự có dấu tiếng việt');
        //     }
        //     const isValidSlug = /^[a-z0-9-]+$/;
        //     if(!isValidSlug.test(dto.slug)){
        //         throw new BadRequestException('Slug chỉ được chứa chữ thường, số và dấu gạch ngang');
        //     }
        //     finalSlug = dto.slug;

        // }else{
        //     finalSlug = this.generateSlug(dto.ten_dm);
        // }
        // const existingSlugCategory = await this.findProductCategoryBy({ slug: finalSlug });
        // if ( existingSlugCategory) {
        //     throw new ConflictException('Slug đã tồn tại vui lòng chọn slug khác');
        // }
        let hinhUrl: string | null = null;
        try{
            hinhUrl = await this.storageService.saveFile(file, imageFieldName);
            const newCategory = await this.createProductCategory({
                ten_dm: dto.ten_dm,
                parent_id: dto.parent_id || null,
                an_hien: dto.an_hien,
                slug: finalSlug,
                img: hinhUrl,
                stt: newOrder
            });
            await this.cacheService.delete([
                REDIS_KEYS.CATEGORY.TREE,
                REDIS_KEYS.CATEGORY.PARENT
            ]);
            return newCategory;
        }catch(error){
            await this.rollbackImage(hinhUrl);
            throw error;
        }
        
    }
    async updateProductCategoryAdmin(id: number, dto: UpdateProductCategoryDto, imageFieldName: string, file?: Multer) {
         const oldFileToDelete: string[] = [];
         const allowUpdate: AllowedUpdateDanhMucSP = {};
         const category = await this.getProductCategoryById(id);
        if(!category){
            throw new NotFoundException(`Không tìm thấy danh mục sản phẩm với id ${id}`);
        }
        if(dto.ten_dm !== category.ten_dm){
            const existingCategory = await this.findProductCategoryByExceptId({ ten_dm: dto.ten_dm }, id);
            if (existingCategory) {
                throw new ConflictException('Tên danh mục sản phẩm đã tồn tại vui lòng chọn tên khác');
            }
            allowUpdate.ten_dm = dto.ten_dm;
        }
        if(dto.parent_id !== null){
            const newParentId = dto.parent_id === 0 ? null : dto.parent_id;
            if(category.parent_id !== newParentId){
                const hasChildren = await this.hasChildren(category.id);
                if(hasChildren){
                    throw new BadRequestException('Danh mục có chứa danh mục con, không thể thay đổi danh mục cha');
                }
                if(newParentId !== null){
                    if(newParentId === category.id){
                        throw new BadRequestException('Danh mục cha không thể là chính nó');
                    }
                    const ParentNewsCategory = await this.findOneProductCategoryById(Number(newParentId));
                    if(!ParentNewsCategory){
                        throw new BadRequestException('Danh mục cha Không tồn tại vui lòng nhập lại');
                    }
                }
                allowUpdate.parent_id = newParentId;
            }
            
        }
        if(dto.stt !== null && category.stt !== dto.stt){
            allowUpdate.stt = dto.stt;
        }
        if(dto.an_hien !== category.an_hien){
            allowUpdate.an_hien = dto.an_hien;
        }
        const newSlug = this.resolveNewSlug(category.slug, dto.slug, dto.ten_dm);
        if(newSlug){//Nếu có sự thay đổi slug mới thì mới cần kiểm tra tính duy nhất của slug
            await this.assertSlugUnique(newSlug, id);
            allowUpdate.slug = newSlug;
        }
     
        if(Object.keys(allowUpdate).length === 0 && !file){
            return { updated: false, category };
        }
        let newHinh: string | null = null;
        try{
            if(file){
                newHinh = await this.storageService.saveFile(file, imageFieldName);
                allowUpdate.img = newHinh;
                if(category.img){
                    oldFileToDelete.push(category.img);
                }
            }
           
            
            await this.executeTransaction(async (transaction) => {
                if(allowUpdate.stt != null){
                    if(allowUpdate.stt > category.stt){
                        await this.adjustOrderInRange(-1, { gt: category.stt, lte: allowUpdate.stt }, transaction);
                    }else{
                        await this.adjustOrderInRange(1, { gte: allowUpdate.stt, lt: category.stt }, transaction);
                    }
                }
                await this.updateProductCategoryBy({ id }, allowUpdate, transaction);
            });
            if(file && category.img){
                await this.storageService.deleteManyFile(oldFileToDelete);
            }
            await this.cacheService.delete([
                REDIS_KEYS.CATEGORY.TREE,
                REDIS_KEYS.CATEGORY.PARENT
            ]);
            return {
                updated: true,
                category: await this.getProductCategoryById(id)
            }

        }catch(error){
            await this.rollbackImage(newHinh);
            throw error;
        }

    }
    async deleteProductCategoryAdmin(id: number) {
        const category = await this.getProductCategoryById(id);
        if(!category){
            throw new NotFoundException(`Không tìm thấy danh mục sản phẩm với id ${id}`);
        }
        const hasChildren = await this.hasChildren(category.id);
        if(hasChildren){
            throw new BadRequestException('Không thể xóa danh mục sản phẩm khi có danh mục con');
        }
      
        await this.executeTransaction(async (transaction) => {
            await this.adjustOrderInRange(-1, { gt: category.stt }, transaction);
            await this.deleteProductCategory({ id }, transaction);
        });
        await this.cacheService.delete([
            REDIS_KEYS.CATEGORY.TREE,
            REDIS_KEYS.CATEGORY.PARENT
        ]);
        if(category.img){
            await this.storageService.deleteFile(category.img).catch(() => {
                this.logger.warn(`Không thể xóa hình: ${category.img}`);
            });
        }

    }



}
