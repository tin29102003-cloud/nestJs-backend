import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  AllowNull,
} from 'sequelize-typescript';

@Table({
  tableName: 'users',
  timestamps: true,
})
export class UserModel extends Model {
  
  @Column({
    type: DataType.STRING,
    set(value: string) {
      this.setDataValue('tai_khoan', value?.trim());
    },
  })
  declare tai_khoan: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    set(value: string) {
      this.setDataValue('email', value?.trim());
    },
  })
  declare email: string;

  @Column(DataType.STRING)
  declare mat_khau: string | null;

  @Column({
    type: DataType.STRING,
    set(value: string) {
      this.setDataValue('ho_ten', value?.trim());
    },
  })
  declare ho_ten: string | null;

  @Column({
    type: DataType.STRING,
    set(value: string) {
      this.setDataValue('ten_shop', value?.trim());
    },
  })
  declare ten_shop: string | null;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare is_shop: boolean;

  @Default(0)
  @Column(DataType.TINYINT)
  declare vai_tro: number;

  @Column(DataType.STRING)
  declare hinh: string | null;

  @Default('local')
  @AllowNull(false)
  @Column(DataType.STRING)
  declare provider: string;

  @Column(DataType.STRING)
  declare provider_id: string;

  @Default(0)
  @Column(DataType.TINYINT)
  declare khoa: number;

  @Column(DataType.STRING)
  declare token: string | null;

  @Column(DataType.DATE)
  declare token_expire: Date | null;

  @Column(DataType.STRING)
  declare refresh_token: string | null;

  @Column(DataType.DATE)
  declare xac_thuc_email_luc: Date | null;

  @Column({
    type: DataType.STRING,
    set(value: string) {
      this.setDataValue('otp', value?.trim());
    },
  })
  declare otp: string | null;

  @Column(DataType.DATE)
  declare otp_expire: Date | null;

  @Column({
    type: DataType.STRING,
    set(value: string) {
      this.setDataValue('dien_thoai', value?.trim());
    },
  })
  declare dien_thoai: string | null;

  @Default(0)
  @Column(DataType.INTEGER)
  declare token_version: number;

  @Default(0)
  @Column(DataType.INTEGER)
  declare login_failed_count: number;

  @Column(DataType.DATE)
  declare last_login_fail: Date | null;

  @Column(DataType.DATE)
  declare locked_until: Date | null;

  @Column({
    type: DataType.STRING,
    set(value: string) {
      this.setDataValue('message_protection_code', value?.trim());
    },
  })
  declare message_protection_code: string | null;

  @Column({
    type: DataType.STRING,
    set(value: string) {
      this.setDataValue('two_fa_secret', value?.trim());
    },
  })
  declare two_fa_secret: string | null;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare is_2fa_enable: boolean;
}