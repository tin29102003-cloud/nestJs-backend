export type NotificationType =
  | 'regiter_email'
  | 'verify_email'
  | 'forget_pass_email'
  | 'login_fast_email'
export interface RegisterEmailpayLoad{
  tai_khoan: string,
  verifyLink: string
}
export interface VerifyEmailPayload{
  title: string,
  content: string,
  link: string,
  buttonText: string,
  mainColor: "#02A4E9" | "#E94E02" ,
  borderColor: "#02A4E9" | "#E94E02" 
}
export enum ResultVerifyEmail  {
  success =  'success',
  invalid_request = 'invalid_request',
  invalid_token = 'invalid_token'
}
export interface ForgotPassPayload{
  tai_khoan: string,
  otp: string
}
export interface LoginFastPayLoad{
  tai_khoan: string;
  magicLink: string
}
