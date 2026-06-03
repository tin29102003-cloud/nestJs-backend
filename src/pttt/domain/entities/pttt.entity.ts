export class PTTT {
    id!: number;
    ten_pt!: string;
    code!: string;
    img: string | null = null;
    an_hien!: boolean;
    constructor(partial?: Partial<PTTT>) {
        Object.assign(this, partial);
    }
}
