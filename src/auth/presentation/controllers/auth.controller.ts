import { Body, Controller, Get, Inject, Logger, Post, Put, Query, Req, Res, SetMetadata, UnauthorizedException, UseGuards } from '@nestjs/common';
import { type Request, type Response } from 'express';
import { VerifyEmailPayload } from 'src/common/constants/notification.constant';
import { TEMPLATE_INTERFACE, type TemplateServiceInterface } from 'src/notification/domain/interface/template.inteface';
import { AuthService } from 'src/auth/application/service/auth.service';
import { ChangePassDto, LoginDto, OtpChangePassDto, RegisterDto, ResendVerifyRegisterDto, SetConversationPinDto, setUpTwoFactorDto, TurnOnTwoFactorDto, VerifyRegisterDto, VerifyTwoFactoryDto } from '../dto/auth.dto';
import { Throttle, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AUTH_THROTTLE } from 'src/config/throttler.config';
import { CrytoUlti } from 'src/config/ultis/crypto.util';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthUser, CookieName, dataToSendLogin, RefreshJwtPayload, SafeUserData } from 'src/common/constants/auth.constaint';
import { RefreshAuthGuard } from 'src/common/guards/refresh-auth.guard';
import { CheckTempToken } from 'src/common/guards/temp.gaurd';
import { User } from 'src/user/domain/entities/user.entity';
import { FacebookAuthGuard } from 'src/common/guards/facebook-auth.guard';

@Controller('api/auth')
export class AuthController {
	private readonly logger = new Logger(AuthController.name);
	private readonly deploy: boolean =  process.env.NODE_ENV === 'production'
	private readonly HOME_URL: string = process.env.BASE_URL ?? "http://phimmoi.com";
	constructor(
		private readonly authService: AuthService,	
		@Inject(TEMPLATE_INTERFACE)
		private readonly templateService: TemplateServiceInterface,
	   
	){}
	private CleanCookie(cookieName: CookieName, res: Response){
		res.clearCookie(cookieName,{
			httpOnly: this.deploy ? true : false,
			sameSite: this.deploy ? 'strict' : 'lax',
			path: '/',
		})
	}
	private creatCookie(res: Response,cookieName: CookieName, cookiePayload: string, maxAge: string | number){
		res.cookie(cookieName, cookiePayload,{
			httpOnly: true,
			secure: this.deploy ? true : false,//deploy thatja thi mo len
			path: '/',
			sameSite: this.deploy ? 'strict' : 'lax',
			maxAge: maxAge as number, 
		})
	}
	private setAuthCookie(res: Response,token: string, refreshToken: string){
		 const cookieMaxAge = process.env.COOKIE_ACCESS_MAX_AGE || 15 * 60 * 1_000;
			const cookieMaxAgeRefresh = process.env.COOKIE_REFRESH_MAX_AGE || 7 * 24 * 60 * 60 * 1_000;
			this.creatCookie(res, "_atkn", token, cookieMaxAge)
			this.creatCookie(res, "_rtkn", refreshToken, cookieMaxAgeRefresh);
	}

	private setEmailCookie(res: Response, email: string){
		const encryptedEmail = CrytoUlti.encrypt(email);
		const cookieEmailMaxAge = process.env.COOKIE_EMAIL_MAX_AGE ?? 5 * 60 *1000;
		this.creatCookie(res,'_usrE', encryptedEmail, cookieEmailMaxAge )
	}

	@Post('dang-nhap')
	async LoginClient(
		@Body() body: LoginDto, 
		@Res({passthrough: true} ) res: Response){
			const result = await this.authService.LoginService(body.tai_khoan, body.mat_khau);
		if(result.require_2fa){
			return {
				require_2fa: true,
				temp_token: result.temp_token,
				message: "Vui lòng nhập mã xác thực 2 bước từ ứng dụng google authencation",
				success: true
			}
		}
		this.setAuthCookie(res,result.token,result.refreshToken);
		
		return {
			message: "Đăng nhập thành công",
			token: result.token,
			user: result.user,
			success: true

		}
	}

	@Post('login')
	async LoginAdmin(
		@Body() body: LoginDto, 
		@Res({passthrough: true} ) res: Response){
			const result = await this.authService.LoginAdminService(body.tai_khoan, body.mat_khau);
		if(result.require_2fa){
			return {
				require_2fa: true,
				temp_token: result.temp_token,
				message: "Vui lòng nhập mã xác thực 2 bước từ ứng dụng google authencation",
				success: true
			}
		}
		this.setAuthCookie(res,result.token,result.refreshToken);
		
		return {
			message: "Đăng nhập thành công",
			token: result.token,
			user: result.user,
			success: true

		}
	}
	@Post('dang-ky')
	async RegisterAccount(
		@Body() body: RegisterDto,
		@Res({passthrough:true}) res: Response){
			const result = await this.authService.RegisterService(body.tai_khoan, body.email, body.mat_khau, body.mat_khau_nhap_lai,body.dien_thoai);
			 return {
				message:"Đã đăng ký thành công tài khoản vui long xac thục qua mail"
				,success: true
			}
		}
	@UseGuards(ThrottlerGuard)
	@Throttle({default: AUTH_THROTTLE.VERIFY_REGISTER_EMAIL})
	@Get('xac-thuc-dang-ky')
	async VerifyRegisterAccount(
		@Query()  query: VerifyRegisterDto,
		@Res() res: Response
	){
		let payload: VerifyEmailPayload
		try {
			const {email, token} = query;
			
			const result = await this.authService.VerifyService(email, token);
			let html = '';
			
			if(result.type === 'invalid_request'){
				html = this.templateService.compileTemplate('verify_email',payload= {
					title: "Xác thực thông báo",
					content: "Đường dẫn không hợp lệ. Thiếu token hoặc email.",
					link: `${process.env.BASE_URL || 'phimmoi.com'}`,
					buttonText: "Quay lại trang chủ",
					mainColor: '#E94E02',
					borderColor: '#E94E02'
				})
				return res.status(400).send(html);
			}else if(result.type === 'invalid_token'){
				html = this.templateService.compileTemplate('verify_email', payload = {
					title: "Xác thực thông báo",
					content: "Liên kết xác thực không hợp lệ hoặc hết hạn. Vui lòng thử đăng ký lại.",
					link: `${process.env.BASE_URL || 'phimmoi.com'}`,
					buttonText: "Quay lại trang chủ",
					mainColor: '#E94E02',
					borderColor: '#E94E02'
				});
				return res.status(200).send(html);
			}else if(result.type === 'success'){
						

			const succesMessage = `Xin chào ${result.user.tai_khoan}, bạn đã kích hoạt tài khoản KADU Shop thành công. Hãy đăng nhập để bắt đầu trải nghiệm mua sắm tuyệt vời!`;
				html = this.templateService.compileTemplate('verify_email',payload= {
					title: "Xác thực thành công",
					content: succesMessage,
					link: `${process.env.LOGIN_URL || 'phimmoi.com'}`,
					buttonText: "Quay lại trang đăng nhập",
					mainColor: '#02A4E9',
					borderColor: '#02A4E9'
				})
				return res.status(200).send(html);
			}
		} catch (err) {
			const error = err as Error;
			const html = this.templateService.compileTemplate('verify_email',payload = {
				title : 'Xác thực không thành công',
				content : "Lỗi máy chủ khi xác thực. Vui lòng thử lại sau.",
				link: `${process.env.BASE_URL || 'phimmoi.com'}`,
				buttonText: "Quay lại trang chủ",
				mainColor: '#E94E02',
				borderColor: '#E94E02'
			})
			this.logger.error(`[CRITICAL] Lỗi API Xác thực: ${error.message}`, error.stack);
			return res.status(500).send(html);
		}
		
	}   
	@UseGuards(ThrottlerGuard)
	
	@Throttle({default: AUTH_THROTTLE.RESEND_REGISTER_EMAIL})
	@Post('gui-lai-xac-thuc-dk')
	async ResendRegisterAccount(
		@Body() body: ResendVerifyRegisterDto,
		@Res({passthrough: true}) res: Response
	){
		const result = await this.authService.resendRegistrationService(body.email);
		return {
			message: "Đã gửi lại thư xác thực, vui lòng kiểm tra email của bạn",
			success: true
		}
	}
	
	@UseGuards(ThrottlerGuard)
	@Throttle({default: AUTH_THROTTLE.FORGOT_PASS})
	@Post('quen-pass')
	async ForgotPassAccount(
		@Body() body: ResendVerifyRegisterDto,
		@Res({passthrough: true}) res: Response
	){
		this.setEmailCookie(res, body.email);
		const result = await this.authService.forgotPassService(body.email);
		return {
			message: result.message,
			success: true
		}
	}

	@UseGuards(ThrottlerGuard)
	@Throttle({default: AUTH_THROTTLE.VERIFY_OTP})
	@Post('xac-thuc-otp-doi-pass')
	async VerifyOtpChangePass(
		@Body() body: OtpChangePassDto,
		@Req() req: Request,
		@Res({passthrough: true}) res: Response
	){
		const encryptEmail = req.cookies._userE as string;
		
		await this.authService.VerifyOtpForgotPass(body.otp, body.mat_khau_moi, body.mat_khau_nhap_lai, encryptEmail);
		res.clearCookie('_userE',{
			httpOnly: true,
			secure: this.deploy ? true: false,
			path: '/',
			sameSite: this.deploy ? 'strict' : 'lax'
		})
		return {
			success: true,
			message: "Đã  đổi mật khẩu thành công Vui lòng đăng nhập để sử  dụng dịch vụ"
		}
	}
	
	@UseGuards(JwtAuthGuard)
	@Post('doi-pass')
	async ChangePass(
		@Body() body: ChangePassDto,
		@Req() req: Request,
		@Res({passthrough: true}) res: Response
	){
		const userPayload = req['user'] as AuthUser
		const {id, tai_khoan} = userPayload;
		const  result = await this.authService.ChangPass(id, tai_khoan, body.mat_khau_cu, body.mat_khau_moi, body.mat_khau_nhap_lai);
		this.setAuthCookie(res, result.token, result.refreshToken);
		return {
			message:"Đổi mật khẩu thành công",
			success: true
		}
	}

	@UseGuards(ThrottlerModule)
	@Throttle({default: AUTH_THROTTLE.LOGIN_FAST})
	@Post('dang-nhap-nhanh')
	async LoginFast(
		@Body() body: ResendVerifyRegisterDto,
		@Res({passthrough: true}) res: Response
	){
		const result = await this.authService.LoginFast(body.email);
		return {
			success: true,
			message: result.message
		}
	}
	
	@UseGuards(ThrottlerModule)
	@Throttle({default: AUTH_THROTTLE.VERIFY_LOGIN_FAST})
	@Get('xac-thuc-dang-nhap-nhanh')
	async VerifyLoginFast(
		@Query() query: VerifyRegisterDto,
		@Res({passthrough: true}) res: Response 
	){
		const {email, token} = query;
		const result = await this.authService.verifyLoginFast(email, token);
		this.setAuthCookie(res, result.token, result.refreshToken);
		return res.redirect(this.HOME_URL);
	}
	
	@UseGuards(JwtAuthGuard)
	@Get('profile')
	async getProfile(
		@Req() req: Request,
	){
		const userPayload = req['user'] as AuthUser
		const {id} = userPayload;
		const reuslt = await this.authService.GetProfile(id);
		return {
			success: true,
			user: reuslt.safeUserData,
			message: "Lấy thông tin user thanh công"
		}
	}

	@UseGuards(JwtAuthGuard)
	@Post('logout')
	async logOut(
		@Req() req: Request,
		@Res({passthrough: true}) res: Response
	){
		const payload = req['user'] as AuthUser;
		await this.authService.logoutAccount(payload.id);
		this.CleanCookie('_atkn',res);
		this.CleanCookie('_rtkn',res);
		return {
			message: "Đăng xuất thành công",
			success: true
		}
	}
	
	@UseGuards(RefreshAuthGuard)
	@Post('refresh-token')
	async RefreshToken(
		@Req() req: Request,
	
		@Res({passthrough: true}) res: Response
	){
		const payload = req['refresh-payload'] as RefreshJwtPayload;
		const refreshToken: string = req['refresh-token'];
		const result = await this.authService.RefreshToken(payload.id,payload.token_version, refreshToken);
		this.setAuthCookie(res, result.token, result.refreshToken);
		return {
			success: true,
			message: "lấy Token AT thành công",
			user: result.user
		}

	}
//api cài mã pin hội thoại
	@UseGuards(JwtAuthGuard)
	@Put('update-pin')
	async setConversationPin(
		@Req() req: Request,
		@Body() body: SetConversationPinDto,
		
	){
		const  payload = req['user'] as AuthUser;
		await this.authService.setConversationPin(payload.id, body.ma_pin_moi);
		return {
			success: true,
			message: "Đã thiết lập mã pin bảo vệ thành công",
		}
	}

	@UseGuards(JwtAuthGuard)
	@Post('2fa/setup')
	async setUptwoFactor(
		@Req() req: Request,
		@Body() body: setUpTwoFactorDto,
	){
		const userPayload = req['user'] as AuthUser;
		const result = await this.authService.setUpTwoFactor(userPayload.id, body.mat_khau);
		return {
			success: true,
			message: "Tạo mã đăng ký 2 FA thành công!",
			data: {
				ten_ma: result.ten_ma,
				qr_code: result.qr_code,
				secret_text: result.secret_text
			}
		}
	}
	@UseGuards(JwtAuthGuard)
	@Post('2fa/turn-on')
	async turnOntwoFactor(
		@Req() req: Request,
		@Body() body: TurnOnTwoFactorDto
	){
		const userPayload = req['user'] as AuthUser;
		await this.authService.turnOnTwoFactor(userPayload.id, body.ma_bao_ve);
		return {
			success: true,
			message: "Bạn đã bật tính năng  bảo mật 2 lớp thành công",
		}
	}
	@UseGuards(JwtAuthGuard)
	@Post('2fa/turn-off')
	async turnOffTwoFactor(
		@Req() req: Request,
		@Body() body: TurnOnTwoFactorDto,

	){
		const userpayload = req['user'] as AuthUser;
		await this.authService.turnOffTwoFactor(userpayload.id, body.ma_bao_ve);
		return {
			success: true,
			message: "Đã tắt tính năng xác thực  bước thành công, bạn nhớ xóa trên app google auth nữa nhá"
		}
	}

	@UseGuards(ThrottlerModule)
	@Throttle({default: AUTH_THROTTLE.DISABLE_2FA_EMAIL})
	@Post('2fa/disable/email')
	async turnOffTwoFactorByMail(
		@Body() body: ResendVerifyRegisterDto,
		@Res({passthrough: true}) res: Response
	){
		this.setEmailCookie(res, body.email);
		const result = await this.authService.disbleTwofactorByEmail(body.email);
		return {
			success: true,
			message: result.message
		}
	}

	@UseGuards(ThrottlerModule)
	@Throttle({default: AUTH_THROTTLE.VERIFY_2FA_EMAIL})
	@Post("2fa/disable/email/verify")
	async VerifyTwoFactorByEmail(
		@Req() req: Request,
		@Body() body: VerifyTwoFactoryDto,
		@Res() res: Response
	){
		const encryptEmail = req.cookies._userE as string;
		await this.authService.VerifyTwofactoryByEmail(body.otp, encryptEmail);
		this.CleanCookie('_usrE',res);
		return {
			success: true,
			message:"Tắt xác thực 2 bước thành công"
		}
	}

	@UseGuards(ThrottlerModule, CheckTempToken)
	@Throttle({default: AUTH_THROTTLE.VERIFY_2FA})
	@Post('2fa/verification')
	async VerifyTwoFactor(
		@Req() req: Request,
		@Body() body: TurnOnTwoFactorDto,
		@Res({passthrough: true}) res: Response
	){

		const userPayload = req['user'] as  AuthUser;
		const result = await this.authService.VerifyTwoFactor(userPayload.id, body.ma_bao_ve)
		this.setAuthCookie(res,result.token,result.refreshToken);
		
		return {
			message: "Đăng nhập thành công",
			token: result.token,
			user: result.user,
			success: true

		}
	}

	@Get('facebook')
	@UseGuards(FacebookAuthGuard)
	async facebookAuth(){
		//được chuyển hướng đến facebook để xác thực
	}
	@Get('facebook/callback')
	@UseGuards(ThrottlerGuard,FacebookAuthGuard)
	@Throttle({default: AUTH_THROTTLE.OAuth2_LOGIN})
	async facebookAuthRedirect(
		@Req() req: Request,
		@Res() res: Response
	){
		try {
			if (!req.user) {
				throw new UnauthorizedException('Không tìm thấy thông tin người dùng');
			}
			const user = req.user as User;
			const tokens = await  this.authService.issueTokenPair(user);
			this.setAuthCookie(res, tokens.token, tokens.refreshToken);
			const safeUserData : SafeUserData = {
				ho_ten: user.ho_ten, tai_khoan: user.tai_khoan, email: user.email, vai_tro: user.vai_tro, is_shop: user.is_shop, hinh:user.hinh
			}
			const safeData = this.authService.safeDataToSend(safeUserData);
			const dataTosend: dataToSendLogin = {
				success: true,
				message: "Đăng nhập bằng Facebook thành công",
				jsonData: safeData,
				clientUrl: this.HOME_URL,
				source: 'facebook-auth',
			}
			
			const html = this.templateService.compileTemplate('popup_login', dataTosend);
			return res.status(200).send(html);
		} catch (err) {
			const error = err as Error;
			this.logger.error(`[CRITICAL] Lỗi API callback Facebook: ${error.message}`, error.stack);

            const errorData: dataToSendLogin = {
				success: false,
                message: "Lỗi hệ thống khi đăng nhập Facebook. Vui lòng thử lại.",
                jsonData: JSON.stringify({ success: false }),
                source: 'facebook-auth',
                clientUrl: this.HOME_URL
            };
            
            const errorHtml = this.templateService.compileTemplate('popup_login', errorData);
            return res.status(401).send(errorHtml);
		}
			
		
		

	}
}
