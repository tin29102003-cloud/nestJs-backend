// user/domain/entities/user.entity.ts

export class User {
  id!: number;

  tai_khoan!: string;
  email!: string;
  mat_khau: string | null = null;

  ho_ten: string | null = null;
  ten_shop: string | null = null;

  is_shop: boolean = false;
  vai_tro: number = 0;

  hinh: string | null = null;

  provider: string = 'local';
  provider_id: string | null = null;

  khoa: number = 0;

  token: string | null = null;
  token_expire: Date | null = null;

  refresh_token: string | null = null;
  xac_thuc_email_luc: Date | null = null;

  otp: string | null = null;
  otp_expire: Date | null = null;

  dien_thoai: string | null = null;

  token_version: number = 0;

  login_failed_count: number = 0;
  last_login_fail: Date | null = null;
  locked_until: Date | null = null;

  message_protection_code: string | null = null;

  two_fa_secret: string | null = null;
  is_2fa_enable: boolean = false;

  createdAt?: Date;
  updatedAt?: Date;

  constructor(partial?: Partial<User>) {
    Object.assign(this, partial);//Nó dùng để khởi tạo object nhanh bằng cách copy dữ liệu từ một object khác vào instance hiện tại cos the truyen thieu filetd ko loi
  }
}