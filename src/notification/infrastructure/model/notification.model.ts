import { AllowNull, Column, DataType, Default, Model, Table } from "sequelize-typescript";
import { NotificationTypeEntity } from "src/common/constants/notification.constant";

@Table({
    tableName: 'thong_bao',
    timestamps: true,
    updatedAt: false
})
export class NotificationModel extends Model {
    @AllowNull(false)
    @Column({
        type: DataType.INTEGER,

    })
    id_user!: number;
    
    @AllowNull(false)
    @Column({
        type: DataType.STRING,

        set(val){
            this.setDataValue('tieu_de', typeof val === 'string' ? val.trim() : val)
        }
    })
    tieu_de!: string;

    @Column({
        type: DataType.TEXT,
        set(val: string) {
            this.setDataValue('noi_dung', typeof val === 'string' ? val.trim() : val)
        }
    })
    noi_dung!: string;

    @Column({
        type: DataType.ENUM,
        values: Object.values(NotificationTypeEntity),
    })
    loai_thong_bao!: NotificationTypeEntity;

    @AllowNull(true)
    @Column({
        type: DataType.INTEGER,
    })
    id_tham_chieu!: number;

    @Default(0)
    @Column({
        type: DataType.INTEGER
    })
    vai_tro_nhan!: number;

    @Default(false)
    @Column({
        type: DataType.BOOLEAN
    })
    da_doc!: boolean;
}