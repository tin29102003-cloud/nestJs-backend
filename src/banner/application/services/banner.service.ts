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
    async findAndCountBannerBy( limit: number, offset: number, order?: [string, SortOderType][], attributes?: string[],condition?: Partial<Banner>,): Promise<{rows: Banner[] , count: number,}>{
        return await this.bannerRepository.findAndCountBannerBy(limit, offset, order, attributes, condition);
    }
    async getMaxValueOfField(fieldName: keyof Banner,condition?: Partial<Banner>): Promise<number | null>{
        return await this.bannerRepository.getMaxValueOfField(fieldName, condition);
    }
    async incrementField(field: keyof Banner, amount: number, condition?: Partial<Banner>): Promise<void>{
        await this.bannerRepository.incrementField(field, amount, condition);
    }
    async adjustOrderInRangeWithTransaction(currentStt: number, newStt: number): Promise<void>{
        await this.bannerRepository.adjustOrderWithTransaction(currentStt, newStt);
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
            const existingBanner = await this.bannerRepository.findBannerBy({name: dto.name});
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
        if(dto.stt !== undefined && dto.stt !== banner.stt){
            
            allowUpdate.stt = dto.stt;
        }
        if(Object.keys(allowUpdate).length === 0){
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
            
            if(allowUpdate.stt !== undefined){
                await this.adjustOrderInRangeWithTransaction(banner.stt, allowUpdate.stt);
            }
            await this.updateBannerBy({id}, allowUpdate);
            if (file && banner.img) {
                await this.storageService.deleteManyFile(oldFileToDelete);
            }

            return {
                update: true,
                banner
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
        
        await this.bannerRepository.adjustOrderInRange(-1, { gt: banner.stt });
        await this.deleteBanner({id});
        if(banner.img){
            await this.storageService.deleteFile(banner.img).catch(() => {
                this.logger.warn(`Không thể xóa hình: ${banner.img}`);
            });
        }
        
    }
}
