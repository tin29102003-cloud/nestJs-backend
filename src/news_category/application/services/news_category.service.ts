import { BadRequestException, ConflictException, Inject,  Injectable,  Logger, NotFoundException } from '@nestjs/common';
import { SortOderType, SortOrder } from 'src/common/constants/user.constaint';
import { NewsCategory } from 'src/news_category/domain/entities/news-category.entity';
import { NEWS_CATEGORY_REPOSITORY_INTERFACE, type NewsCategoryRepositoryInterface } from 'src/news_category/domain/interface/news_category.interface';
import { CreateNewsCategoryDto } from 'src/news_category/presentation/dto/news_category.dto';

@Injectable()
export class NewsCategoryService {
    private readonly logger = new Logger(NewsCategoryService.name);
    constructor(
          @Inject(NEWS_CATEGORY_REPOSITORY_INTERFACE)
          private readonly newsCategoryRepository: NewsCategoryRepositoryInterface,
    ){
       
    }
     async findNewsCategoryById(id: number, attributes?: string[]) {
        return await this.newsCategoryRepository.findNewsCategoryById(id, attributes);
    }
    async createNewsCategory(data: Partial<NewsCategory>):Promise<NewsCategory | null> {
        return await this.newsCategoryRepository.createNewsCategory(data);
    }
    async updateNewsCategoryBy(condition: Partial<NewsCategory>, data: Partial<NewsCategory>) {
        return await this.newsCategoryRepository.updateNewsCategoryBy(condition, data);
    }
    async deleteNewsCategory(condition: Partial<NewsCategory>) {
        return await this.newsCategoryRepository.deleteNewsCategory(condition);
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
        if(dto.parent_id !== 0){
            const parentNewsCategory = await this.findNewsCategoryById(Number(dto.parent_id));
            if(!parentNewsCategory){
                throw new BadRequestException('Parent id không tồn tại vui lòng nhập lại');
            }
        }
        const newOrder = await this.generateNextOrder();
        const newBanner = await this.createNewsCategory({
            ten_dm: dto.ten_dm,
            parent_id: dto.parent_id || null,
            stt: newOrder,
            an_hien: dto.an_hien
        });
        return newBanner;    
    }
    async findOneNewsCategoryById(id: number){
        const newsCategory = await this.findNewsCategoryById(id);
        if(!newsCategory){
            throw new NotFoundException(`Không tìm thấy danh mục tin với ID ${id}`);
        }
        return newsCategory;
    }
}
