import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Attribute } from 'src/attribute/domain/entities/attribute.entity';
import { ATTRIBUTE_REPOSITORY_INTERFACE, type AttributeRepositoryInterface } from 'src/attribute/domain/interface/attribute.interface';
import { SortOderType } from 'src/common/constants/user.constaint';
import { PaginationHelper } from 'src/common/helpers/pagination.helper';

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
    
    async findAllAttribute(keyword?: string, page?: string, limit?: string) {
        const { pageSafe, limitSafe, offset } = PaginationHelper.getParams(10, page, limit);
        const { rows, count } = await this.attributeRepository.searchAttribute(keyword || '', limitSafe, offset);
        return PaginationHelper.buildResult(rows, count, limitSafe, pageSafe);
    }
    async findOneAttributeById(id: number) {
        const attribute = await this.attributeRepository.findAttributeById(id);
        if(!attribute){
            throw new NotFoundException(`Không tìm thấy thuộc tính với ID ${id}`);
        }
        return attribute;
    }
}
