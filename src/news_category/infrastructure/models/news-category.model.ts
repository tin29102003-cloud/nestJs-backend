import { AllowNull, Column, DataType, Default, Model, Table } from "sequelize-typescript";

@Table({
    tableName: 'dm_tin',
    timestamps: true,
})
export class NewsCategoryModel extends Model {
    @AllowNull(false)
    @Column({
        type: DataType.STRING,
        set(val: string) {
            this.setDataValue(
                'ten_dm',
                typeof val === 'string' ? val.trim() : val
            );
        }
    })
    declare ten_dm: string;

    @AllowNull(true)
    @Column({
        type: DataType.INTEGER,
    })
    declare parent_id: number | null;

    @AllowNull(true)
    @Column({
        type: DataType.INTEGER,
    })
    declare stt: number | null;

    
    @Default(true)
    @Column({
        type: DataType.BOOLEAN,
        defaultValue: true,
    })
    declare an_hien: boolean;
}