export class ProductCategory{
    id!: number;
    ten_dm!: string;
    img!: string;
    stt!: number;
    parent_id: number | null = null;
    an_hien!: boolean;
    slug!: string;
    constructor(partial?: Partial<ProductCategory>) {
        Object.assign(this, partial);
    }
}
