import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { allowedUpdatePTTT } from 'src/common/constants/pttt.constaint';
import { Multer } from 'src/common/constants/storage.containt';
import { SortOderType, SortOrder } from 'src/common/constants/user.constaint';
import { PaginationHelper } from 'src/common/helpers/pagination.helper';
import { type IStorageService, STORAGE_SERVICE } from 'src/common/storage/domain/interfaces/storage.interface';
import { PTTT } from 'src/pttt/domain/entities/pttt.entity';
import { PTTT_REPOSITORY_INTERFACE,type PTTTRepositoryInterface } from 'src/pttt/domain/interface/pttt.interface';
import { CreatePtttDto } from 'src/pttt/presentation/dto/pttt.dto';

@Injectable()
export class PtttService {
    private readonly logger = new Logger(PtttService.name);
    constructor(
        @Inject(PTTT_REPOSITORY_INTERFACE)
        private ptttRepository: PTTTRepositoryInterface,
        @Inject(STORAGE_SERVICE)
        private storageService: IStorageService
    ) {}
    async findPTTTById(id: number, attributes?: string[]) {
        return this.ptttRepository.findPTTTById(id, attributes);
    }
    async createPTTT(data: Partial<PTTT>) {
        return this.ptttRepository.createPTTT(data);
    }
    async findPtttByOr(condition: Partial<PTTT>[]) {
        return this.ptttRepository.findPtttByOr(condition);
    }
    async updatePTTTBy(condition: Partial<PTTT>, data: Partial<PTTT>) {
        return this.ptttRepository.updatePTTTBy(condition, data);
    }
    async deletePTTT(condition: Partial<PTTT>) {
        return this.ptttRepository.deletePTTT(condition);
    }
    async searchPTTT(keyword: string, limit: number, offset: number, attributes?: string[], order?: [string, SortOderType][]) {
        return this.ptttRepository.searchPTTT(keyword, limit, offset, attributes, order);
    }
    async findPTTTBy(condition: Partial<PTTT>) {
        return this.ptttRepository.findPTTTBy(condition);
    }
    async findAndCountPTTTBy(limit: number, offset: number, order?: [string, SortOderType][], attributes?: string[], condition?: Partial<PTTT>) {
        return this.ptttRepository.findAndCountPTTTBy(limit, offset, order, attributes, condition);
    }
    async findPTTTByExceptId(condition: Partial<PTTT>, id: number) {
        return this.ptttRepository.findPTTTByExceptId(condition, id);
    }
    // private getPaginationParams(maxLimit: number,page?: string, limit?: string)  {
    //     const pageSafe = Math.max(1, Number(page) || 1);
    //     const limitSafe = Math.max(1, Number(limit) || maxLimit);
    //     return {
    //         pageSafe,
    //         limitSafe,
    //         offset: (pageSafe - 1) * limitSafe
    //     };
    // }
    // private getResulData(rows: PTTT[],totalItems: number, limit: number, page: number) {
    //     const totalPages = Math.ceil(totalItems / limit);
    //     return {
    //         data: rows,
    //         pagination: {
    //             currentPage: page,
    //             limit: limit,
    //             totalItems: totalItems,
    //             totalPages: totalPages
    //         }
    //     }
    // }
        private async rollbackImage(imageUrl: string | null): Promise<void> {
        if (!imageUrl) return;
        await this.storageService.deleteFile(imageUrl).catch(() => {
            this.logger.warn(`Không thể xóa hình: ${imageUrl}`);
        });
    }
    async findAllPTTT(keyword?: string, page?: string, limit?: string) {
        const {pageSafe, limitSafe, offset} = PaginationHelper.getParams(20, page, limit);
        const {rows, count} = await this.ptttRepository.searchPTTT(keyword || '', limitSafe, offset,undefined, [['createdAt', SortOrder.DESC]]);
        return PaginationHelper.buildResult(rows, count, limitSafe, pageSafe);
    }
    async findOnePtttById(id: number) {
        const pttt = await this.ptttRepository.findPTTTById(id);
        if(!pttt){
            throw new NotFoundException(`Không tìm thấy phương thức thanh toán với id ${id}`);
        }
        return pttt;
    }

    async createPTTTByAdmin(dto: CreatePtttDto, imgFieldName: string, file?: Multer ) {
        if(!file){
            throw new BadRequestException('Hình ảnh phương thức thanh toán là bắt buộc');
        }
        const existingPttt = await this.findPtttByOr([{ ten_pt: dto.ten_pt }, { code: dto.code }]);
        if(existingPttt){
            if(existingPttt.ten_pt === dto.ten_pt){
                throw new ConflictException(`Tên phương thức thanh toán '${dto.ten_pt}' đã tồn tại`);
            }
            if(existingPttt.code === dto.code){
                throw new ConflictException(`Code phương thức thanh toán '${dto.code}' đã tồn tại`);
            }
        }
        let hinhUrl: string | null = null;
        try{
            hinhUrl = await this.storageService.saveFile(file, imgFieldName);
            const newPTTT = await this.createPTTT({
                ten_pt: dto.ten_pt,
                code: dto.code,
                an_hien: dto.an_hien,
                img: hinhUrl
            });
            return newPTTT;;
        }catch(error){
           await this.rollbackImage(hinhUrl);
           throw error;
        }
       
    }
    async deletePTTTByAdmin(id: number) {
        const pttt = await this.findPTTTById(id);
        if(!pttt){
            throw new NotFoundException(`Không tìm thấy phương thức thanh toán với id ${id}`);
        }
        await this.deletePTTT({ id });
        if(pttt.img){
            await this.storageService.deleteFile(pttt.img).catch(() => {
                this.logger.warn(`Không thể xóa hình: ${pttt.img}`);
            });
        }
    }
    async updatePTTTByAdmin(id: number, dto: CreatePtttDto, imgFieldName: string, file?: Multer) {
        const pttt = await this.findPTTTById(id);
        const oldFileToDelete: string[] = [];
        if(!pttt){
            throw new NotFoundException(`Không tìm thấy phương thức thanh toán với id ${id}`);
        }
        const allowedUpdateData: allowedUpdatePTTT = {};
        if(dto.ten_pt !== pttt.ten_pt){
            const existingByName = await this.findPTTTByExceptId({ ten_pt: dto.ten_pt }, id);
            if(existingByName){
                throw new ConflictException(`Tên phương thức thanh toán '${dto.ten_pt}' đã tồn tại`);
            }
            allowedUpdateData.ten_pt = dto.ten_pt;
        }
        if(dto.code !== pttt.code){
            const existingByCode = await this.findPTTTByExceptId({ code: dto.code }, id);
            if(existingByCode){
                throw new ConflictException(`Code phương thức thanh toán '${dto.code}' đã tồn tại`);
            }
            allowedUpdateData.code = dto.code;
        }
        if(dto.an_hien !== pttt.an_hien){
            allowedUpdateData.an_hien = dto.an_hien;
        }
        if(Object.keys(allowedUpdateData).length === 0 && !file){
            return {
                update: false,
                pttt
            }
        }
        let newHinhUrl: string | null = null;
        try{
            if(file){
                newHinhUrl = await this.storageService.saveFile(file, imgFieldName);
                allowedUpdateData.img = newHinhUrl;
                if(pttt.img){
                    oldFileToDelete.push(pttt.img);
                }
            }
            await this.updatePTTTBy({ id }, allowedUpdateData);
            if(file && pttt.img){
                await this.storageService.deleteManyFile(oldFileToDelete);
            }
            return {
                update: true,
                pttt: await this.findPTTTById(id)
            }
        }catch(error){
            await this.rollbackImage(newHinhUrl);
            throw error;
        }

    }

}
