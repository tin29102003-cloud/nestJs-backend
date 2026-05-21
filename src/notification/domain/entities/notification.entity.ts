import { NotificationTypeEntity } from "src/common/constants/notification.constant"
export class Notification {
    id!: number;
    id_user!: number;
    tieu_de!: string;
    noi_dung: string | null = null;
    loai_thong_bao!: NotificationTypeEntity;
    id_tham_chieu: number | null = null;
    vai_tro_nhan!: number;
    da_doc!: boolean;
    createdAt?: Date;
    constructor(partial?: Partial<Notification>) {
        Object.assign(this, partial);
    }
}
