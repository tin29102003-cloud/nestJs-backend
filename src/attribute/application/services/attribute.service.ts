import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Attribute } from 'src/attribute/domain/entities/attribute.entity';
import { ATTRIBUTE_REPOSITORY_INTERFACE, type AttributeRepositoryInterface } from 'src/attribute/domain/interface/attribute.interface';
import { SortOderType } from 'src/common/constants/user.constaint';

@Injectable()
export class AttributeService {
    constructor(
            @Inject(ATTRIBUTE_REPOSITORY_INTERFACE)
            private attributeRepository: AttributeRepositoryInterface,

    ){
        
    }
    async findAttributeById(id: number, attributes?: string[]) {
        return this.attributeRepository.findAttributeById(id, attributes);
    }
    async createAttribute(data: Partial<Attribute>) {
        return this.attributeRepository.createAttribute(data);
    }
    async updateAttributeBy(condition: Partial<Attribute>, data: Partial<Attribute>) {
        return this.attributeRepository.updateAttributeBy(condition, data);
    }
    async deleteAttribute(condition: Partial<Attribute>) {
        return this.attributeRepository.deleteAttribute(condition);
    }
    async searchAttribute(keyword: string, limit: number, offset: number, attributes?: string[], order?: [string, SortOderType][]) {
        return this.attributeRepository.searchAttribute(keyword, limit, offset, attributes, order);
    }
    async findAttributeBy(condition: Partial<Attribute>) {
        return this.attributeRepository.findAttributeBy(condition);
    }
    async findAndCountAttributeBy(limit: number, offset: number, order?: [string, SortOderType][], attributes?: string[], condition?: Partial<Attribute>) {
        return this.attributeRepository.findAndCountAttributeBy(limit, offset,attributes, condition, order);
    }
    async findAttributeByExceptId(condition: Partial<Attribute>, id: number) {
        return this.attributeRepository.findAttributeByExceptId(condition, id);
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
     private getResulData(rows: Attribute[],totalItems: number, limit: number, page: number) {
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
    async findAllAttribute(keyword?: string, page?: string, limit?: string) {
        const { pageSafe, limitSafe, offset } = this.getPaginationParams(10, page, limit);
        const { rows, count } = await this.attributeRepository.searchAttribute(keyword || '', limitSafe, offset);
        return this.getResulData(rows, count, limitSafe, pageSafe);
    }
    async findOneAttributeById(id: number) {
        const attribute = await this.attributeRepository.findAttributeById(id);
        if(!attribute){
            throw new NotFoundException(`Không tìm thấy thuộc tính với ID ${id}`);
        }
        return attribute;
    }
}
