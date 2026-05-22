import { BannerPositionType } from "src/common/constants/banner.constaint";

export class Banner {
    id!: number;
    stt!: number;
    name: string| null= null;
    url: string| null = null;
    img: string| null= null;
    vi_tri!: BannerPositionType;
    an_hien!: boolean;
    constructor(partial?: Partial<Banner>) {
        Object.assign(this, partial);
    }
}
