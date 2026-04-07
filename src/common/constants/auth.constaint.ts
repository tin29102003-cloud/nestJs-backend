import { JwtPayload } from "jsonwebtoken";

export const AUTH_PROVIDER = {
    LOCAL: 'local',
    GOOGLE: 'google',
    FACEBOOK: 'facebook'
}
export interface CustomJwtPayload extends JwtPayload {
    id: number;
    tai_khoan: string;
    vai_tro: number;
    ho_ten: string | null;
    token_version: number;
}
export interface RefreshJwtPayload extends JwtPayload{
    id: number;
    token_version: number;
}
export interface TempJwtPayLoad extends JwtPayload{
    id:number;
    is_temp_2fa: boolean;
}
export interface SafeUserData{
    ho_ten: string | null;
    tai_khoan: string;
    vai_tro: number;
    email: string;
    is_shop: boolean;
    hinh: string|null;
}
export const LOGIN_FAIL_MAX=5
 export const PERM_LOCK_MAX=8
export const LOCK_DURATION= 5 * 60 * 1_000
export type AuthLoginResult =
  | {
      require_2fa: true;
      temp_token: string;
    }
  | {
      require_2fa: false;
      user: SafeUserData;
      token: string;
      refreshToken: string;
    };