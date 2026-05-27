export class NewsCategory {
    id!: number;
    ten_dm!: string;
    parent_id: number|null = null;
    stt: number| null = null;
    an_hien!: boolean
    constructor(partial?: Partial<NewsCategory>) {
        Object.assign(this, partial);
    }
}
