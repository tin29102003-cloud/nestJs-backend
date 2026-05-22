import {
    AllowNull,
    Column,
    DataType,
    Default,
    Model,
    Table
} from "sequelize-typescript";
import { BannerPositionType } from "src/common/constants/banner.constaint";


@Table({
    tableName: 'banner',
    timestamps: true,
})
export class BannerModel extends Model {

    @AllowNull(false)
    @Default(null)
    @Column({
        type: DataType.INTEGER,
    })
    declare stt: number;

    @AllowNull(true)
    @Column({
        type: DataType.STRING,
        set(val: string) {
            this.setDataValue(
                'name',
                typeof val === 'string' ? val.trim() : val
            );
        }
    })
    declare name: string | null;

    @AllowNull(true)
    @Column({
        type: DataType.STRING,
        set(val: string) {
            this.setDataValue(
                'url',
                typeof val === 'string' ? val.trim() : val
            );
        }
    })
     declare url: string | null;

    @AllowNull(true)
    @Column({
        type: DataType.STRING,
    })
    declare img: string | null;

    @AllowNull(false)
    @Column({
        type: DataType.ENUM,
        values: Object.values(BannerPositionType)
    })
    declare vi_tri: BannerPositionType;

    @Default(true)
    @Column({
        type: DataType.BOOLEAN,
    })
    declare an_hien: boolean;
}