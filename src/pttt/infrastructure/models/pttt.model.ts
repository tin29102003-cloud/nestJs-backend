import {
    Table,
    Column,
    Model,
    DataType,
    AllowNull,
    Default,
} from 'sequelize-typescript';

@Table({
    tableName: 'phuong_thuc_tt',
    timestamps: true,
})
export class PTTTModel extends Model {

    @AllowNull(false)
    @Column({ type: DataType.STRING,
        set(val: string) {
            this.setDataValue('ten_pt',typeof val === 'string' ? val.trim() : val);
        },
    })
    declare ten_pt: string;

    @AllowNull(false)
    @Column({ type: DataType.STRING,
        unique: true,
        set(val: string) {
            this.setDataValue('code',typeof val === 'string' ? val.trim() : val);
        }
     })
    declare code: string;

    @AllowNull(true)
    @Column({ type: DataType.STRING })
    declare img: string | null;

  
    @Default(true)
    @Column({ type: DataType.BOOLEAN })
    declare an_hien: boolean;
}