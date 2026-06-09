export class Attribute {
    id!: number;
    ten_thuoc_tinh!: string;
    constructor(partial?: Partial<Attribute>) {
        Object.assign(this, partial);
    }
}
