import { AllowNull, Column, DataType, Model, Table } from "sequelize-typescript";

@Table({
    tableName: 'thuoc_tinh',
    timestamps: false,
})
export class AttributeModel extends Model {
    @AllowNull(false)
    @Column({type: DataType.STRING,
        set(val: string){
            this.setDataValue(
                'ten_thuoc_tinh',
                typeof val === 'string' ? val.trim() : val
            );
        }
    })
    declare ten_thuoc_tinh: string;
}
