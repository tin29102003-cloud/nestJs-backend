import { BadRequestException, ConflictException, Inject,  Injectable,  Logger, NotFoundException } from '@nestjs/common';
import { CACHE_SERVICE_INTERFACE, type CacheServiceInterface } from 'src/cache/domain/interface/cache.interface';
import { AllowedUpdateDanhMucTin } from 'src/common/constants/banner.constaint';
import { REDIS_KEYS } from 'src/common/constants/redis.constaint';
import { SortOderType, SortOrder } from 'src/common/constants/user.constaint';
import { NewsCategory } from 'src/news_category/domain/entities/news-category.entity';
import { NEWS_CATEGORY_REPOSITORY_INTERFACE, type NewsCategoryRepositoryInterface } from 'src/news_category/domain/interface/news_category.interface';
import { CreateNewsCategoryDto, UpdateNewsCategoryDto } from 'src/news_category/presentation/dto/news_category.dto';

@Injectable()
export class NewsCategoryService {
    private readonly logger = new Logger(NewsCategoryService.name);
    constructor(
          @Inject(NEWS_CATEGORY_REPOSITORY_INTERFACE)
          private readonly newsCategoryRepository: NewsCategoryRepositoryInterface,
          @Inject(CACHE_SERVICE_INTERFACE)
          private readonly cache: CacheServiceInterface
    ){
       
    }
     async findNewsCategoryById(id: number, attributes?: string[]) {
        return await this.newsCategoryRepository.findNewsCategoryById(id, attributes);
    }
    async createNewsCategory(data: Partial<NewsCategory>):Promise<NewsCategory | null> {
        return await this.newsCategoryRepository.createNewsCategory(data);
    }
    async updateNewsCategoryBy(condition: Partial<NewsCategory>, data: Partial<NewsCategory>, transaction?: unknown) {
        return await this.newsCategoryRepository.updateNewsCategoryBy(condition, data, transaction);
    }
    async deleteNewsCategory(condition: Partial<NewsCategory>, transaction?: unknown) {
        return await this.newsCategoryRepository.deleteNewsCategory(condition, transaction);
    }
    async searchNewsCategory(keyword: string, limit: number, offset: number, attributes?: string[]) {
        return await this.newsCategoryRepository.searchNewsCategory(keyword, limit, offset, attributes);
    }
    async findNewsCategoryBy(condition: Partial<NewsCategory>) {
        return await this.newsCategoryRepository.findNewsCategoryBy(condition);
    }
    async findAndCountNewsCategoryBy( limit: number, offset: number, order?: [string, SortOderType][], attributes?: string[],condition?: Partial<NewsCategory>,): Promise<{rows: NewsCategory[] , count: number,}>{
        return await this.newsCategoryRepository.findAndCountNewsCategoryBy(limit, offset, order, attributes, condition);
    }
    async getMaxValueOfField(fieldName: keyof NewsCategory,condition?: Partial<NewsCategory>): Promise<number | null>{
        return await this.newsCategoryRepository.getMaxValueOfField(fieldName, condition);
    }
    async incrementField(field: keyof NewsCategory, amount: number, condition?: Partial<NewsCategory>): Promise<void>{
        await this.newsCategoryRepository.incrementField(field, amount, condition);
    }
    async adjustOrderInRange(amount: number, range: { gt?: number; lte?: number; gte?: number; lt?: number }, transaction?: unknown): Promise<void>{
        await this.newsCategoryRepository.adjustOrderInRange(amount, range, transaction);
    }
    async findNewsCategoryByExceptId(condition: Partial<NewsCategory>, id: number): Promise<NewsCategory | null>{
        return await this.newsCategoryRepository.findNewsCategoryByExceptId(condition, id);
    }
    async hasChildren(id: number): Promise<boolean>{
        return await this.newsCategoryRepository.hasChildren(id);
    }
    async executeTransaction<T>(callback: (transaction: unknown) => Promise<T>): Promise<T>{
        return await this.newsCategoryRepository.executeTransaction(callback);
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
    private getResulData(rows: NewsCategory[],totalItems: number, limit: number, page: number) {
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
    private async generateNextOrder(): Promise<number>{
        const maxOrder = await this.getMaxValueOfField('stt');
        return (maxOrder ?? 0) + 1;
    }
     async findAllNewsCategory(keyword?: string, page?: string, limit?: string) {
        const { pageSafe, limitSafe, offset } = this.getPaginationParams(10, page, limit);
        const  result = !keyword ? await this.findAndCountNewsCategoryBy(limitSafe, offset, [['createdAt', SortOrder.DESC]]) : await this.searchNewsCategory(keyword, limitSafe, offset);
        return this.getResulData(result.rows, result.count, limitSafe, pageSafe);
    }
    async createNewsCategoryAdmin(dto: CreateNewsCategoryDto) {
        const existingNewsCategory = await this.findNewsCategoryBy({ ten_dm: dto.ten_dm });
        if (existingNewsCategory) {
            throw new ConflictException('Danh mục tin đã tồn tại vui lòng chọn tên khác');
        }
        if(dto.parent_id !== 0 && dto.parent_id !== null){
            const parentNewsCategory = await this.findNewsCategoryById(Number(dto.parent_id));
            if(!parentNewsCategory){
                throw new BadRequestException('Parent id không tồn tại vui lòng nhập lại');
            }
        }
        const newOrder = await this.generateNextOrder();
        const newsCategoryResult =  await this.createNewsCategory({
            ten_dm: dto.ten_dm,
            parent_id: dto.parent_id || null,
            stt: newOrder,
            an_hien: dto.an_hien
        });
       await this.cache.delete(REDIS_KEYS.NEWS_CATEGORY.ALL)
       return newsCategoryResult;
    }
    async findOneNewsCategoryById(id: number){
        const newsCategory = await this.findNewsCategoryById(id);
        if(!newsCategory){
            throw new NotFoundException(`Không tìm thấy danh mục tin với ID ${id}`);
        }
        return newsCategory;
    }
    async deleteNewsCategoryAdmin(id: number){
        const newsCategory = await this.findNewsCategoryById(id);
        if(!newsCategory){
            throw new NotFoundException(`Không tìm thấy danh mục tin với ID ${id}`);
        }
        await this.executeTransaction(async (transaction) => {
             await this.newsCategoryRepository.adjustOrderInRange(-1, { gt: newsCategory.stt }, transaction);
             await this.deleteNewsCategory({id}, transaction);
        });
        await this.cache.delete(REDIS_KEYS.NEWS_CATEGORY.ALL)
        // await this.newsCategoryRepository.adjustOrderInRange(-1, { gt: newsCategory.stt});
        // await this.deleteNewsCategory({id});
        
    }
    async updateNewsCategoryAdmin(id: number, dto: UpdateNewsCategoryDto){
        const allowUpdate: AllowedUpdateDanhMucTin = {};
        const newsCategory = await this.findNewsCategoryById(id);
        if(!newsCategory){
            throw new NotFoundException(`Không tìm thấy danh mục tin với ID ${id}`);
        }
        if(dto.ten_dm !== newsCategory.ten_dm){
            const existingNewsCategory = await this.findNewsCategoryByExceptId({ ten_dm: dto.ten_dm }, id);
            if (existingNewsCategory) {
                throw new ConflictException('Danh mục tin đã tồn tại vui lòng chọn tên khác');
            }
            allowUpdate.ten_dm = dto.ten_dm;
        }
        if(dto.parent_id != null){
            const newParentId = dto.parent_id === 0 ? null : dto.parent_id;
            if(newsCategory.parent_id !== newParentId){
                const hasChildren = await this.hasChildren(newsCategory.id);
                if(hasChildren){
                    throw new BadRequestException('Không thể thay đổi danh mục cha khi có danh mục con');
                }
                if(newParentId !== null){
                    if(newParentId === id){
                        throw new BadRequestException('Danh mục cha không thể là chính nó');
                    }
                    const parentNewsCategory = await this.findNewsCategoryById(Number(newParentId));
                    if(!parentNewsCategory){
                        throw new BadRequestException('Parent id không tồn tại vui lòng nhập lại');
                    }
                }
                allowUpdate.parent_id = newParentId;
            }
            
        }
        if(dto.stt != null && newsCategory.stt !== dto.stt){
            allowUpdate.stt = dto.stt;
            
        }
        if(dto.an_hien !== newsCategory.an_hien){
            allowUpdate.an_hien = dto.an_hien;
        }
        if(Object.keys(allowUpdate).length === 0){
            return {
                update : false,
                newsCategory
            }
        }
        await this.executeTransaction(async (transaction) => {
            if(allowUpdate.stt != null){
                if(allowUpdate.stt > newsCategory.stt){
                    await this.adjustOrderInRange(-1, { gt: newsCategory.stt, lte: allowUpdate.stt }, transaction);
                }else{
                    await this.adjustOrderInRange(+1, { gte: allowUpdate.stt, lt: newsCategory.stt }, transaction);
                }

            }
            await this.updateNewsCategoryBy({id}, allowUpdate, transaction);
        });
        await this.cache.delete(REDIS_KEYS.NEWS_CATEGORY.ALL);
        return {
            update: true,
            newsCategory
        }
    }
}
