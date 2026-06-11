import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Op } from 'sequelize';
import { Banner } from 'src/banner/domain/entities/banner.entity';
import { BANNER_REPOSITORY_INTERFACE, type BannerRepositoryInterface } from 'src/banner/domain/interface/banner.interface';
import { CreateBannerDto, UpdateBannerDto } from 'src/banner/presentation/dto/banner.dto';
import { AllowedUpdateBanner } from 'src/common/constants/banner.constaint';
import { Multer } from 'src/common/constants/storage.containt';
import { SortOderType, SortOrder } from 'src/common/constants/user.constaint';
import { type IStorageService, STORAGE_SERVICE } from 'src/common/storage/domain/interfaces/storage.interface';

@Injectable()
export class BannerService {
    private readonly logger = new Logger(BannerService.name);
    constructor(
        @Inject(BANNER_REPOSITORY_INTERFACE)
        private readonly bannerRepository: BannerRepositoryInterface,
        @Inject(STORAGE_SERVICE)
        private readonly storageService: IStorageService

    ){}
    async findBannerById(id: number, attributes?: string[]) {
        return await this.bannerRepository.findBannerById(id, attributes);
    }
    async createBanner(data: Partial<Banner>):Promise<Banner | null> {
        return await this.bannerRepository.createBanner(data);
    }
    async updateBannerBy(condition: Partial<Banner>, data: Partial<Banner>, transaction?: unknown) {
        return await this.bannerRepository.updateBannerBy(condition, data, transaction);
    }
    async deleteBanner(condition: Partial<Banner>, transaction?: unknown) {
        return await this.bannerRepository.deleteBanner(condition, transaction);
    }
    async searchBanner(keyword: string, limit: number, offset: number, attributes?: string[]) {
        return await this.bannerRepository.searchBanner(keyword, limit, offset, attributes);
    }
    async findBannerBy(condition: Partial<Banner>) {
        return await this.bannerRepository.findBannerBy(condition);
    }
    async findAndCountBannerBy( limit: number, offset: number, order?: [string, SortOderType][], attributes?: string[],condition?: Partial<Banner>,): Promise<{rows: Banner[] , count: number,}>{
        return await this.bannerRepository.findAndCountBannerBy(limit, offset, order, attributes, condition);
    }
    async getMaxValueOfField(fieldName: keyof Banner,condition?: Partial<Banner>): Promise<number | null>{
        return await this.bannerRepository.getMaxValueOfField(fieldName, condition);
    }
    async incrementField(field: keyof Banner, amount: number, condition?: Partial<Banner>): Promise<void>{
        await this.bannerRepository.incrementField(field, amount, condition);
    }
    // async adjustOrderInRangeWithTransaction(currentStt: number, newStt: number): Promise<void>{
    //     await this.bannerRepository.adjustOrderWithTransaction(currentStt, newStt);
    // }   
    async adjustOrderInRange(amount: number, range: { gt?: number; lte?: number; gte?: number; lt?: number }, transaction?: unknown): Promise<void>{
        await this.bannerRepository.adjustOrderInRange(amount, range, transaction);
    }
    async findBannerByExceptId(condition: Partial<Banner>, id: number): Promise<Banner | null>{
        return await this.bannerRepository.findBannerByExceptId(condition, id);
    }
    async executeTransaction<T>(callback: (transaction: unknown) => Promise<T>): Promise<T>{
        return await this.bannerRepository.executeTransaction(callback);
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
    private async generateNextOrder(): Promise<number>{
        const maxOrder = await this.getMaxValueOfField('stt');
        return (maxOrder ?? 0) + 1;
    }

    private async rollbackImage(imageUrl: string | null): Promise<void> {
        if (!imageUrl) return;
        await this.storageService.deleteFile(imageUrl).catch(() => {
            this.logger.warn(`Không thể xóa hình: ${imageUrl}`);
        });
    }
    private async applyOrderShift(newStt: number|undefined, oldStt: number, id: number, allowUpdate: AllowedUpdateBanner): Promise<void> {
        await this.executeTransaction(async (transaction) => {
                if(newStt != null){
                    if(newStt > oldStt){
                        await this.adjustOrderInRange(-1, { gt: oldStt, lte: newStt }, transaction);
                    } else {
                        await this.adjustOrderInRange(+1, { gte: newStt, lt: oldStt }, transaction);
                    }
                }
                await this.updateBannerBy({id}, allowUpdate, transaction);
            });
    }
    async FindAllBanner(keyword?: string, page?: string, limit?: string) {
        const  {pageSafe, limitSafe, offset} = this.getPaginationParams(10, page, limit);
        const  result = !keyword ? await this.bannerRepository.findAndCountBannerBy(limitSafe, offset, [['createdAt', SortOrder.DESC]]) : await this.bannerRepository.searchBanner(keyword, limitSafe, offset);
        return this.getResulData(result.rows, result.count, limitSafe, pageSafe);
    }
    async FindOneBannerById(id: number) {
        const banner = await this.bannerRepository.findBannerById(id);
        if (!banner) {
            throw  new NotFoundException(`Không tìm thấy banner với ID ${id}`);
        }
        return banner;
    }
    async createBannerAdmin(dto: CreateBannerDto, fieldName: string, file?: Multer){
        if(!file){
            throw  new BadRequestException(`Bạn cần phải chèn 1 hình vào để tạo banner `);
        }
        const  existingBanner = await this.bannerRepository.findBannerBy({name: dto.name});
        if(existingBanner){
            throw new ConflictException(`Tên banner đã tồn tại vui lòng nhập cái khác`);
        }
        const newOrder = await this.generateNextOrder();      
        let hinhUrl: string | null = null;
        try{
            hinhUrl = await this.storageService.saveFile(file, fieldName);
            const newBanner = await this.createBanner({
                stt: newOrder,
                name: dto.name,
                url: dto.url,
                img:  hinhUrl,
                vi_tri: dto.vi_tri,
                an_hien: dto.an_hien
            })
            return newBanner;
        }catch(error){
            await this.rollbackImage(hinhUrl);
            throw error;
        }
    }
    async updateBannerAdmin(id: number, dto: UpdateBannerDto, fieldName: string, file?: Multer){
        const oldFileToDelete: string[] = [];
        const allowUpdate: AllowedUpdateBanner = {};
        const banner = await this.findBannerById(id);
        if(!banner){
            throw new NotFoundException(`Không tìm thấy banner với ID ${id}`);
        }
        if(dto.name !== banner.name){
            const existingBanner = await this.findBannerByExceptId({name: dto.name}, id);
            if(existingBanner){
                throw new ConflictException(`Tên banner đã tồn tại vui lòng nhập cái khác`);
            }
            allowUpdate.name = dto.name;
        }
       
        
        if(banner.url !== dto.url){
            allowUpdate.url = dto.url;
        }
        if(banner.vi_tri !== dto.vi_tri){
            allowUpdate.vi_tri = dto.vi_tri;
        }
        if(banner.an_hien !== dto.an_hien){
            allowUpdate.an_hien = dto.an_hien;
        }
        if(dto.stt != null && dto.stt !== banner.stt){
            
            allowUpdate.stt = dto.stt;
        }
         if(Object.keys(allowUpdate).length === 0 && !file){
                return {
                    update: false,
                    banner
                }
            }
        let newHinh: string | null = null;
        try{
           
            if(file){
                newHinh = await this.storageService.saveFile(file, fieldName);
                allowUpdate.img = newHinh;
                if(banner.img){
                    oldFileToDelete.push(banner.img);
                }
            }
           
            
            // if(allowUpdate.stt != null){
            //     await this.adjustOrderInRangeWithTransaction(banner.stt, allowUpdate.stt);
            // }
            // await this.updateBannerBy({id}, allowUpdate);
            // await this.executeTransaction(async (transaction) => {
            //     if(allowUpdate.stt != null){
            //         if(allowUpdate.stt > banner.stt){
            //             await this.adjustOrderInRange(-1, { gt: banner.stt, lte: allowUpdate.stt }, transaction);
            //         } else {
            //             await this.adjustOrderInRange(+1, { gte: allowUpdate.stt, lt: banner.stt }, transaction);
            //         }
            //     }
            //     await this.updateBannerBy({id}, allowUpdate, transaction);
            // });
            await this.applyOrderShift(allowUpdate.stt , banner.stt, id, allowUpdate);
           
            if (oldFileToDelete.length > 0) {
                await this.storageService.deleteManyFile(oldFileToDelete);
            }

            return {
                update: true,
                banner: await this.findBannerById(id)
            };
        }catch(error){
            await this.rollbackImage(newHinh);
            throw error;
        }
    }
    async deleteBannerAdmin(id: number){
        const banner = await this.findBannerById(id);
        if(!banner){
            throw new NotFoundException(`Không tìm thấy banner với ID ${id}`);
        }
        
        await this.executeTransaction(async (transaction) => {
            await this.adjustOrderInRange(-1, { gt: banner.stt }, transaction);
            await this.deleteBanner({id}, transaction);
        });
        if(banner.img){
            await this.storageService.deleteFile(banner.img).catch(() => {
                this.logger.warn(`Không thể xóa hình: ${banner.img}`);
            });
        }
        
    }
}
