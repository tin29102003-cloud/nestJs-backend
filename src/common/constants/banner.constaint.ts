export enum BannerPositionType {
    HOME_TOP = 'home_top',
    HOME_MIDDLE = 'home_middle',
    HOME_BOTTOM = 'home_bottom',
    HOME_SLIDER = 'home_slider',
    POPUP = 'popup'
}
export interface AllowedUpdateBanner{
    stt?: number;
    name?: string;
    url?: string;
    img?: string| null;
    vi_tri?: BannerPositionType;
    an_hien?: boolean;
}
export interface AllowedUpdateDanhMucTin{
    ten_dm?: string;
    parent_id?: number|null;
    stt?: number;
    an_hien?: boolean;
}