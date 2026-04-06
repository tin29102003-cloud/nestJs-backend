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
export class User extends Model {
  
  @Column({
    type: DataType.STRING,
    set(value: string) {
      this.setDataValue('tai_khoan', value?.trim());
    },
  })
  tai_khoan!: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    set(value: string) {
      this.setDataValue('email', value?.trim());
    },
  })
  email!: string;

  @Column(DataType.STRING)
  mat_khau!: string | null;

  @Column({
    type: DataType.STRING,
    set(value: string) {
      this.setDataValue('ho_ten', value?.trim());
    },
  })
  ho_ten!: string | null;

  @Column({
    type: DataType.STRING,
    set(value: string) {
      this.setDataValue('ten_shop', value?.trim());
    },
  })
  ten_shop!: string | null;

  @Default(false)
  @Column(DataType.BOOLEAN)
  is_shop!: boolean;

  @Default(0)
  @Column(DataType.TINYINT)
  vai_tro!: number;

  @Column(DataType.STRING)
  hinh!: string | null;

  @Default('local')
  @AllowNull(false)
  @Column(DataType.STRING)
  provider!: string;

  @Column(DataType.STRING)
  provider_id!: string;

  @Default(0)
  @Column(DataType.TINYINT)
  khoa!: number;

  @Column(DataType.STRING)
  token!: string | null;

  @Column(DataType.DATE)
  token_expire!: Date | null;

  @Column(DataType.STRING)
  refresh_token!: string | null;

  @Column(DataType.DATE)
  xac_thuc_email_luc!: Date | null;

  @Column({
    type: DataType.STRING,
    set(value: string) {
      this.setDataValue('otp', value?.trim());
    },
  })
  otp!: string | null;

  @Column(DataType.DATE)
  otp_expire!: Date | null;

  @Column({
    type: DataType.STRING,
    set(value: string) {
      this.setDataValue('dien_thoai', value?.trim());
    },
  })
  dien_thoai!: string | null;

  @Default(0)
  @Column(DataType.INTEGER)
  token_version!: number;

  @Default(0)
  @Column(DataType.INTEGER)
  login_failed_count!: number;

  @Column(DataType.DATE)
  last_login_fail!: Date | null;

  @Column(DataType.DATE)
  locked_until!: Date | null;

  @Column({
    type: DataType.STRING,
    set(value: string) {
      this.setDataValue('message_protection_code', value?.trim());
    },
  })
  message_protection_code!: string | null;

  @Column({
    type: DataType.STRING,
    set(value: string) {
      this.setDataValue('two_fa_secret', value?.trim());
    },
  })
  two_fa_secret!: string | null;

  @Default(false)
  @Column(DataType.BOOLEAN)
  is_2fa_enable!: boolean;
}