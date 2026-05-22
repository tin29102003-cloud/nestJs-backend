import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Banner } from 'src/banner/domain/entities/banner.entity';
import { BANNER_REPOSITORY_INTERFACE, type BannerRepositoryInterface } from 'src/banner/domain/interface/banner.interface';
import { SortOderType, SortOrder } from 'src/common/constants/user.constaint';

@Injectable()
export class BannerService {
    private readonly logger = new Logger(BannerService.name);
    constructor(
        @Inject(BANNER_REPOSITORY_INTERFACE)
        private readonly bannerRepository: BannerRepositoryInterface
    ){}
    async findBannerById(id: number, attributes?: string[]) {
        return await this.bannerRepository.findBannerById(id, attributes);
    }
    async createBannerBy(condition: Partial<Banner>, data: Partial<Banner>) {
        return await this.bannerRepository.createBannerBy(condition, data);
    }
    async updateBannerBy(condition: Partial<Banner>, data: Partial<Banner>) {
        return await this.bannerRepository.updateBannerBy(condition, data);
    }
    async deleteBanner(condition: Partial<Banner>) {
        return await this.bannerRepository.deleteBanner(condition);
    }
    async searchBanner(keyword: string, limit: number, offset: number, attributes?: string[]) {
        return await this.bannerRepository.searchBanner(keyword, limit, offset, attributes);
    }
    async findBannerBy(condition: Partial<Banner>) {
        return await this.bannerRepository.findBannerBy(condition);
    }
      async findAndCountUserBy( limit: number, offset: number, order?: [string, SortOderType][], attributes?: string[],condition?: Partial<Banner>,): Promise<{rows: Banner[] , count: number,}>{
            return await this.bannerRepository.findAndCountUserBy(limit, offset, order, attributes, condition);
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
    private getResulData(rows: Banner[],totalItems: number, limit: number, page: number) {
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
    async FindAllBanner(keyword?: string, page?: string, limit?: string) {
        const  {pageSafe, limitSafe, offset} = this.getPaginationParams(10, page, limit);
        const  result = !keyword ? await this.bannerRepository.findAndCountUserBy(limitSafe, offset, [['createdAt', SortOrder.DESC]]) : await this.bannerRepository.searchBanner(keyword, limitSafe, offset);
        return this.getResulData(result.rows, result.count, limitSafe, pageSafe);
    }
    async FindOneBannerById(id: number) {
        const banner = await this.bannerRepository.findBannerById(id);
        if (!banner) {
            throw  new NotFoundException(`Không tìm thấy banner với ID ${id}`);
        }
        return banner;
    }
}
