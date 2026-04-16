import { BadRequestException, ConflictException, ForbiddenException, HttpException, HttpStatus, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'node_modules/bcryptjs';

import type { StringValue } from "ms";
import crypto from 'crypto';
import {  APP_NAME, AUTH_PROVIDER, AuthLoginResult, BOOLEAN, CustomJwtPayload, LOCK_DURATION, LOGIN_FAIL_MAX, OAuthProfile, OTP_EXPIRE, PERM_LOCK_MAX, RefreshJwtPayload, ROLE, SafeUserData, SECRET_TIME_2FA, TempJwtPayLoad, TOKEN_EXPIRE_IN, VerifyRegiterResult } from 'src/common/constants/auth.constaint';
import { Notification_Interface, type NotificationInterface } from 'src/notification/domain/interface/notification.interface';
import { ForgotPassPayload, LoginFastPayLoad, RegisterEmailpayLoad, ResultVerifyEmail, VerifyEmailPayload } from 'src/common/constants/notification.constant';
import { UserService } from 'src/user/application/service/user.service';
import { User } from 'src/user/domain/entities/user.entity';
import { CrytoUlti } from 'src/config/ultis/crypto.util';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import {generateSecret, generateURI, verify } from 'otplib';
import qrcode from 'qrcode';
@Injectable()
export class AuthService {
	private readonly logger = new Logger(AuthService.name);

	constructor(
		private readonly jwtService: JwtService,
		private readonly userService: UserService,
		
		@Inject(Notification_Interface)
		private  notificationServiceSend:  NotificationInterface,
		
	){}
	private generateToken(byte: number): string{
		return crypto.randomBytes(byte).toString('hex');
	}
	// private async hasUserAndTwoFactor(options: {email?: string, id?: number}){
	// 	const where: Partial<User> = {
	// 		provider: AUTH_PROVIDER.LOCAL,
	// 	};

	// 	if (options.id) {
	// 		where.id = options.id;
	// 	}

	// 	if (options.email) {
	// 		where.email = options.email;
	// 	}

	// 	const user = await this.userService.FindFirstBy(where);

	// 	if (!user) {
	// 		throw new NotFoundException("Thông tin xác thực không chính xác");
	// 	}
		
	// 	return user;
	// }
	private generateExpireTime(now,lockTime: number): Date{
		return new Date(now.getTime() +  lockTime);
	}
	// private errorHandle(error: unknown, logMessage: string, clientMesage: string ): never{
	// 	if (error instanceof HttpException) {
	// 		throw error; 
	// 	}
	// 	const err = error as Error;
	// 	this.logger.error(`[CRITICAL] ${logMessage}: ${err.message}`, err.stack);
    //   	throw new InternalServerErrorException(clientMesage);
	// }
	//hàm privaate sinh token
	public  safeDataToSend(data: object){
		return JSON.stringify(data)
			.replace(/</g, '\\u003c')
			.replace(/>/g, '\\u003e')
			.replace(/&/g, '\\u0026')
			.replace(/'/g, '\\u0027');
	}
	public async issueTokenPair(user: User){
		const accessTokenPayLoad: CustomJwtPayload = {
			id: user.id, tai_khoan: user.tai_khoan, vai_tro: user.vai_tro, ho_ten: user.ho_ten, token_version: user.token_version
		}
		
		const refreshTokenPayLoad: RefreshJwtPayload = {
			id: user.id, token_version: user.token_version
		}
		const jwtExpiresIn  =  process.env.ACCESS_TOKEN_EXPIRES_IN ?? `15m`;
		const refreshJwtExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN ?? "7d";
		const optionAT: JwtSignOptions = {
			secret: process.env.JWT_SECRET ||'Your-secret-pass',
			expiresIn:jwtExpiresIn  as StringValue
		}
		const optionRT: JwtSignOptions = {
			secret:process.env.REFRESH_JWT_SECRET ||'Your-secret-pass',
			expiresIn: refreshJwtExpiresIn as StringValue
		}
		const token = this.jwtService.sign(
			accessTokenPayLoad,
			optionAT
		);
		
		const refreshToken = this.jwtService.sign(
			refreshTokenPayLoad,
			optionRT
		)
		
		const  salt = await  bcrypt.genSalt(10);
		const hasedRefreshToken =  await bcrypt.hash(refreshToken, salt);
		this.userService.UpdateUser({id: user.id}, {
			refresh_token: hasedRefreshToken
		});
		return {token, refreshToken};
	}
	
	private async createOtpAndUpdate(id_user: number,minNumber: number, maxNumber: number, saltNumber: number, currentTime: Date,){
		const otp = crypto.randomInt(minNumber, maxNumber).toString();////min là 100000 và max là 999999
		const salt = await bcrypt.genSalt(saltNumber);
		const  otpHash = await bcrypt.hash(otp, salt);
		const updateData: Partial<User> = {
			otp : otpHash,
			otp_expire: this.generateExpireTime(currentTime,TOKEN_EXPIRE_IN)
		}
		await this.userService.UpdateUser({id: id_user}, updateData);
		return otp;
	}

	private async handleLoginFail(user: User) {
		const now = new Date();
		const failCount = user.login_failed_count + 1 ;
		
		const updatedata: Partial<User> = {
			login_failed_count: failCount,
			last_login_fail: now
		};
		const remaining = PERM_LOCK_MAX - failCount;
		if(failCount > PERM_LOCK_MAX){
			updatedata.khoa = 1;
			updatedata.locked_until = null;
			this.userService.UpdateUser({id: user.id}, updatedata);
			
			throw new HttpException("Bạn nhập sai mật khẩu quá số lần cho phép tài khoản đã bị khóa liên hệ quản trị viên để biết thêm chi tiết", 423);
		}else if(failCount >= LOGIN_FAIL_MAX){
			updatedata.locked_until = new Date(now.getTime() + LOCK_DURATION);
			this.userService.UpdateUser({id: user.id}, updatedata);
			const minutes = LOCK_DURATION / 60_000;
			throw  new HttpException(`Bạn nhập sai mật khẩu quá nhiều, còn ${remaining} lần nũa sẽ khóa tài khoản, vui  lòng thử lại sau ${minutes} phút`, 423);
		}else{
			await this.userService.UpdateUser({id: user.id}, updatedata);
			throw new UnauthorizedException(`Mật khẩu không đúng, còn ${remaining} lần nũa sẽ khóa tài khoản`);
		}
	}

	private validateUserStatus(user: User) {
	
		const now = new Date();
		
		if(!user.xac_thuc_email_luc || user.xac_thuc_email_luc > now){
			throw new HttpException("Bạn cần phải xác thực tài khoản qua mail trước khi đăng nhập",423);
		}
		if(user.khoa === 1){
			throw new HttpException("Tài khoản đã bị khóa vui lòng liên hệ với bản quản trị để xử lý",423);
		}

		if(user.locked_until && user.locked_until > now){
			throw  new HttpException("Tài khoản của bạn đã bị khóa do đăng nhập sai quá nhiều lần, vui thử lại sau ít phút",423);
		}
	}
	
	private async checkUserAndVerifyTwoFactor(id_user: number, ma_bao_ve: string){
		const currentUser = await this.userService.FindFirstBy({id: id_user});
		if(!currentUser || currentUser.provider !== AUTH_PROVIDER.LOCAL || !currentUser.mat_khau){
			throw new NotFoundException("Tài khoản không tồn tại hoặc đăng ký bằng facebook và google nên không dùng đc chức năng  này");
		}
		if(currentUser.is_2fa_enable){
			throw  new BadRequestException("Tài khoản của bạn đã bậc chức năng xác thực 2 bước");
		}
		if(!currentUser.two_fa_secret){
			throw new BadRequestException("Bạn chưa  quét mã QR, vui lòng thực hiên bước cài đặt 2 bước trước");
		}
		const secret = CrytoUlti.decrypt(currentUser.two_fa_secret);
		const isValid = await verify({token: ma_bao_ve, secret: secret, epochTolerance: SECRET_TIME_2FA});
		if(!isValid.valid){
			throw  new BadRequestException("Mã xác thực không chính xác hoặc đã hết hạn, nếu bạn chưa quét qr vui lòng quét lại mã qr để đăng  ký lại");
		}
	}

	private createSafeUser(username: string){
		return  username
		.toLowerCase()
		.replace(/[^a-z0-9]/g, '')
		.substring(0,10);
	}
   
	private generateRandomString(length: number): string {
		const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
		let result = '';	
		const charactersLength = characters.length;	
		for(let i = 0; i < length; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength));
		}
		return result;
	}
	async LoginService(tai_khoan: string, mat_khau: string,
		extraTrack?: (user: User)=> void//tao ra hàm kiem tra điều kiên thêm
	): Promise<AuthLoginResult>{
		const user = await this.userService.FindFirstByOr([{tai_khoan: tai_khoan}, {email: tai_khoan}]);
		if(!user){
			throw new  UnauthorizedException("email hoặc tài khoản không tồn tại");
		}
		this.validateUserStatus(user);
		
		if(extraTrack){
			extraTrack(user);
		}
		
		if(!user.mat_khau){
			throw new UnauthorizedException("Tài khoản không hợp lệ");
		}
		const isMatch = await bcrypt.compare(mat_khau, user.mat_khau);
		
		if(!isMatch){
			await this.handleLoginFail(user);
		}
		this.userService.UpdateUser({id: user.id}, {
			login_failed_count: 0,
			last_login_fail: null,
			locked_until: null
		});
		if(user.is_2fa_enable){
			const tempPayLoad: TempJwtPayLoad = {
				id: user.id, is_temp_2fa: true
			};
			const tempJwtExpiresIn = process.env.TEMP_TOKEN_EXPIRES_IN ?? "5m";
			const OptionTemp: JwtSignOptions ={
				secret: process.env.TEMP_JWT_SECRET ?? "co cai nit",
				expiresIn: tempJwtExpiresIn as StringValue 
			}
			const tempToken = this.jwtService.sign(
				tempPayLoad,OptionTemp
			);
			return {
				require_2fa: true, 
				temp_token: tempToken,
			}
		}
			const tokens = await this.issueTokenPair(user); 
			const safeUserData: SafeUserData = {
				ho_ten: user.ho_ten, tai_khoan: user.tai_khoan, vai_tro: user.vai_tro, email: user.email, is_shop: user.is_shop, hinh: user.hinh
			};
			return {require_2fa: false, ...tokens, user: safeUserData}
	}
	async LoginAdminService (tai_khoan: string, mat_khau: string){
		return this.LoginService(tai_khoan, mat_khau, (user)=>{
			if(user.vai_tro !== ROLE.ADMIN){
				throw new ForbiddenException("Bạn không có quyền để vào");
			}
		})
		
	}
	async RegisterService(tai_khoan: string, email: string, mat_khau: string, mat_khau_nhap_lai: string, dien_thoai: string){
		const existingUser = await this.userService.FindFirstByOr([{tai_khoan},{email}]);
		if(existingUser){
			if(existingUser.tai_khoan === tai_khoan){
				throw new ConflictException("Tài khoản đã tồn tại , vui lòng nhập tài khoản khác");
			}else if(existingUser.email === email){
				throw new ConflictException("Email đã tồn tại , vui lòng nhập email khác");
			}
		}
		if(mat_khau !== mat_khau_nhap_lai){
			throw new BadRequestException("Mật khẩu không trùng mật khẩu nhập lại");
		}
		
		const now = new Date();
		const salt = await bcrypt.genSalt(10);
		const hashedPassword =  await bcrypt.hash(mat_khau, salt);
		const token = this.generateToken(32);
		const tokenExpired = this.generateExpireTime(now,LOCK_DURATION);
		await this.userService.createUser({
			tai_khoan,
			email,
			mat_khau: hashedPassword,
			dien_thoai,
			token,
			token_expire: tokenExpired
		});
		const verifyLink = `${process.env.SERVER}/api/auth/xac-thuc-dang-ky?email=${email}&token=${token}`;
		const payload: RegisterEmailpayLoad = {
			tai_khoan: tai_khoan,
			verifyLink: verifyLink
		}
		this.notificationServiceSend.send('regiter_email', email, "Thư xác định tài khoản của  tmdt  KADU",payload);
		// const noi
	}
	async VerifyService(email?: string, token?: string): Promise<VerifyRegiterResult>{
		
		if(!email || !token){
			return {
				type: ResultVerifyEmail.invalid_request
			}
		}
		const user = await this.userService.findValidTokenUser(email, token, new Date());
		if(!user){
			return {
				type: ResultVerifyEmail.invalid_token
			}
		}
		
		const updatedata: Partial<User> = {
			xac_thuc_email_luc: new Date(),
			token : null
		};
		await  this.userService.UpdateUser({id: user.id}, updatedata);
		return {
			type: ResultVerifyEmail.success,
			user: user
		}
	}
	async resendRegistrationService(email: string){
		const user = await this.userService.FindFirstByOr([{tai_khoan: email}, {email: email}]);
		const now = new Date();
		if(!user){
			throw new UnauthorizedException("Nếu email này tồn tại, một thư xác thực sẽ được gửi");
		}
		if(user.xac_thuc_email_luc){
			throw new UnauthorizedException("Tài khoản này đã được xác  thực từ trước");
		}
		const token = this.generateToken(32)
		const tokenExpired = this.generateExpireTime(now,LOCK_DURATION);
		const updateData: Partial<User> = {
			token_expire: tokenExpired,
			token: token
		};
		await this.userService.UpdateUser({id: user.id}, updateData);
		const verifyLink = `${process.env.SERVER}/api/auth/xac-thuc-dang-ky?email=${email}&token=${token}`;
		const payload: RegisterEmailpayLoad = {
			tai_khoan: user.tai_khoan,
			verifyLink: verifyLink
		};
		this.notificationServiceSend.send('regiter_email', email,"Thư xác định tài khoản của  tmdt  KADU", payload);
	}
	async forgotPassService(email: string){
		const user = await this.userService.FindFirstBy({email: email});
		if(!user){
			this.logger.warn("Email không tồn tại");
			return {
				message: "Đã gửi mã OTP qua gmail, vui lòng kiểm tra mail để thực hiện việc đổi mật khẩu"
			}
		}
		if(user.provider !== AUTH_PROVIDER.LOCAL || !user.mat_khau){
			this.logger.warn("Không thể đổi  mật khẩu trong cục bộ vì tài khoản đã đăng ký bằng facebook hoặc google")
			return {
				message: "Đã gửi mã OTP qua gmail, vui lòng kiểm tra mail để thực hiện việc đổi mật khẩu"
			}
		}
		const now = new Date();
		if(!user.xac_thuc_email_luc || user.xac_thuc_email_luc > now){
			this.logger.warn("Email chưa được xác thực hoặc thời hạn không chính xác");
			return {
				message: "Đã gửi mã OTP qua gmail, vui lòng kiểm tra mail để thực hiện việc đổi mật khẩu"
			}
		}
		const otp = await this.createOtpAndUpdate(user.id, 10_000, 100_000, 10, now);
		
		const payload: ForgotPassPayload = {
			tai_khoan: user.tai_khoan,
			otp: otp
		}
		this.notificationServiceSend.send('forget_pass_email', "Mã OTP khôi phục mật khẩu",email, payload);
		return {
			message: "Đã gửi mã OTP qua gmail, vui lòng kiểm tra mail để thực hiện việc đổi mật khẩu"
		}
	}
	async VerifyOtpForgotPass(otp: string, mat_khau_moi: string, mat_khau_nhap_lai: string, cookie: string){
		if(!cookie){
			throw new BadRequestException("Phiên làm việc đã hết hạn");
		}
		const email = CrytoUlti.decrypt(cookie)
		
		console.log(email);
		if(!email){
			throw new NotFoundException("Không thể xác định người dùng từ phiên làm việc");
		}
		if(mat_khau_moi !== mat_khau_nhap_lai){
			throw new BadRequestException("Mật khẩu không trùng mật khẩu nhập lại");
		}
		const user = await this.userService.FindFirstBy({email: email, provider: AUTH_PROVIDER.LOCAL});
		if(!user){
			throw  new UnauthorizedException("Thông tin xác thực không chính xác")
		}
		const now = new Date();
		if(!user.otp_expire || user.otp_expire < now || !user.otp){
			throw new BadRequestException("OTP đã hết hạn vui lòng gửi lại mã otp để tiến hành đổi mật khẩu")
		}
		const isValid = await bcrypt.compare(otp, user.otp);
		if(!isValid){
			throw new BadRequestException("Mã otp  không chính xác  vui long nhập lại");
		}
		if(!user.mat_khau){
			throw new ForbiddenException("Tài khoản này không thể thay đổi mật khẩu bằng phương thức cục bộ")
		}
		const isMatch  = await bcrypt.compare(mat_khau_moi, user.mat_khau);
		if(isMatch){
			throw new BadRequestException("Vì lý do bảo mật nên mật khẩu mới không được trùng với mật khẩu củ");
		}
		const salt = await bcrypt.genSalt(10);
		const updateData: Partial<User> = {
			mat_khau: await bcrypt.hash(mat_khau_moi, salt),
			otp : null,
			otp_expire: null,
			token_version: user.token_version + 1
		}
		await this.userService.UpdateUser({id: user.id}, updateData);
		
	}
	async ChangPass(id: number,tai_khoan: string, mat_khau_cu: string, mat_khau_moi: string, mat_khau_nhap_lai: string){
		if(mat_khau_cu === mat_khau_moi){
			throw  new BadRequestException("Mật khẩu mới không được trùng mật khẩu cũ")
		}
		if(mat_khau_moi !== mat_khau_nhap_lai){
			throw new BadRequestException("Mật khẩu nhập lại không khớp mật khẩu mới");
		}

		const user = await this.userService.FindFirstBy({id: id,provider: AUTH_PROVIDER.LOCAL });
		if(!user || user.tai_khoan !== tai_khoan){
			throw new NotFoundException("tài khoản không tồn tại hoặc không đúng");
		}
		if(!user.mat_khau){
			throw new ForbiddenException("Tài khoản này không thể thay đổi mật khẩu bằng phương thức cục bộ");
		}
		const  isMatch = await bcrypt.compare(mat_khau_cu, user.mat_khau);
		if(!isMatch){
			throw new UnauthorizedException("Mật khẩu cũ không đúng vui lòng kiểm tra lại");
		}
		const salt = await bcrypt.genSalt(10);
		const updateData: Partial<User> = {
			mat_khau: await bcrypt.hash(mat_khau_moi, salt),
			token_version: user.token_version + 1
		};
		await this.userService.UpdateUser({id: id}, updateData);
		const token = await this.issueTokenPair(user);
		return token;
	}
	async LoginFast(email: string){
		const user = await this.userService.FindFirstBy({
			email: email
		});
		if(!user){
			this.logger.warn("Gửi mail thất bại do user ko tồn tại");
			return {
				message: "Đã gửi link xác thực qua mail vui lòng kiểm tra mail để đăng nhập"
			}
		}
		const now = new Date();
		if(!user.xac_thuc_email_luc || user.xac_thuc_email_luc > now){
			throw new HttpException(
			{    message: 'Bạn cần phải xác thực tài khoản qua mail để được sử dụng chức năng này'},
			HttpStatus.LOCKED
			)
		}
		if(user.khoa === BOOLEAN.true){
			throw  new HttpException(
				{
					message: "Tài khoản đã bị khóa vui lòng liên hệ với ban quản trị viên để được hỗ trợ"
				},
				HttpStatus.LOCKED
			)
		}
		if(user.locked_until && user.locked_until > now){
			throw  new HttpException(
				{
					message: "Tài khoản của bạn đã bị khóa do đăng nhập sai quá nhiều lần vui lòng thử lại sau ít phút"
				},
				HttpStatus.LOCKED
			)
		}
		const token = this.generateToken(32);
		const tokenExpire = this.generateExpireTime(now, TOKEN_EXPIRE_IN);
		const updateData: Partial<User> = {
			token: token,
			token_expire: tokenExpire
		};
		await this.userService.UpdateUser({id: user.id}, updateData);
		const magicLink = `${process.env.SERVER}/api/auth/xac-thuc-dang-nhap-nhanh?email=${email}&token=${token}`;
		const payload: LoginFastPayLoad = {
			tai_khoan: user.tai_khoan,
			magicLink: magicLink
		}
		await this.notificationServiceSend.send('login_fast_email',email,"Thư đăng nhập nhanh của sàn tmdt KADU ",payload);
		return {
			message: "Đã gửi link xác thực qua mail vui lòng kiểm tra mail để đăng nhập"
		}
	}
	async verifyLoginFast(email?: string, token?: string){
		if(!email || !token){
			throw new BadRequestException("Thiếu dữ liệu đầu vào");
		}
		const user = await this.userService.findValidTokenUser(email, token, new Date());
		if(!user){
			throw new NotFoundException("Liên kết đăng nhập không hợp lê hoặc đã  hết hạn, vui lòng thử lại");
		}
		const updateData: Partial<User> = {
			token: null,
			token_expire: null,
			login_failed_count: 0,
			locked_until: null
		}
		await this.userService.UpdateUser({id: user.id}, updateData);
		const tokenJwt = await this.issueTokenPair(user);
		
		return tokenJwt;
	}
	async GetProfile(id: number){
		const user = await this.userService.FindFirstBy({id: id});
		if(!user){
			throw new NotFoundException("Người dùng không tồn tại");
		}
		const safeUserData: SafeUserData = {
			ho_ten: user.ho_ten, tai_khoan: user.tai_khoan, vai_tro: user.vai_tro, email: user.email,is_shop: user.is_shop, hinh: user.hinh
		}
		return {safeUserData}
	}
	async logoutAccount(id: number){
		if(id){
			await this.userService.UpdateUser({id: id}, {
				refresh_token: null,
			})
		}
	}
	async RefreshToken(id: number, token_version: number, refreshToken: string){
		const user = await this.userService.FindFirstBy({id: id});
		if(!user){
			throw new UnauthorizedException("Người dùng không tồn tại");
		}
		if(user.token_version !== token_version){
			throw  new UnauthorizedException("Refresh token đã hết hạn hoặc bị thu hồi");
		}
		if(user.khoa === BOOLEAN.true){
			throw  new HttpException(
				{
					message: "Tài khoản đã bị khóa vui lòng liên hệ với ban quản trị viên để được hỗ trợ"
				},
				HttpStatus.LOCKED
			);
		}
		if(!user.refresh_token){
			throw  new UnauthorizedException("Không thể xác thực do user chưa có refresh token")
		}
		const match = await bcrypt.compare(refreshToken, user.refresh_token);
		if(!match){
			throw new UnauthorizedException("Refresh token không hợp lệ")
		}
		const token = await this.issueTokenPair(user);
		
		return {...token, user}
	}
	async setConversationPin(id_user: number,ma_pin_moi: string){
	
			const salt = await bcrypt.genSalt(10);
			const hashedPin = await bcrypt.hash(ma_pin_moi, salt);
			await this.userService.UpdateUser({id: id_user},{
				message_protection_code: hashedPin
			});
	

		
	}
	async setUpTwoFactor(id_user: number, mat_khau: string){

			const currentUser = await this.userService.FindFirstBy({id: id_user});
			if(!currentUser || currentUser.provider !== AUTH_PROVIDER.LOCAL || !currentUser.mat_khau){
				throw new ForbiddenException("Tài khoản không tồn tại hoặc đăng ký bằng facebook và google nên không dùng đc chức năng  này");
			}
			const isMatch = await bcrypt.compare(mat_khau, currentUser.mat_khau);
			if(!isMatch){
				throw new ForbiddenException("Mật khẩu không chính xác");
			}
			if(currentUser.is_2fa_enable){
				throw new BadRequestException("Tài khoản của bạn đã bật xác  thực 2 bước rồi");
			}
			const secret = generateSecret();
			const encryptedSecret = CrytoUlti.encrypt(secret);
			await this.userService.UpdateUser({id: id_user}, {
				two_fa_secret: encryptedSecret
			});
			const userName = currentUser.email || currentUser.tai_khoan;
			const otpPathUrl = generateURI({
				secret: secret,
				issuer: APP_NAME,
				label: userName
			});
			const qrCodeDataUrl = await qrcode.toDataURL(otpPathUrl);
			return {
				ten_ma: `${APP_NAME}: ${userName}`,
				qr_code: qrCodeDataUrl,
				secret_text: secret
			}
	}
	async turnOnTwoFactor(id_user: number, ma_bao_ve: string){
		await this.checkUserAndVerifyTwoFactor(id_user, ma_bao_ve);
		await this.userService.UpdateUser({id:id_user},{
			is_2fa_enable: true
		});
	}
	async turnOffTwoFactor(id_user: number, ma_bao_ve: string){
		await this.checkUserAndVerifyTwoFactor(id_user, ma_bao_ve);
		await this.userService.UpdateUser({id: id_user}, {
			is_2fa_enable: false,
			two_fa_secret: null
		})
	}
	async disbleTwofactorByEmail(email: string){
		const user = await this.userService.FindFirstBy({email: email});
		if(!user){
			this.logger.warn("Email không tồn tại");
			return {
				message: "Đã gửi mã OTP qua gmail, vui lòng kiểm tra mail để thực hiện việc xóa xác thực 2 bước"
			}
		}
		if(user.provider !== AUTH_PROVIDER.LOCAL || !user.mat_khau){
			this.logger.warn("Không thể xóa xác thực 2 bước  vì tài khoản đã đăng ký bằng facebook hoặc google");
			return {
				message: "Đã gửi mã OTP qua gmail, vui lòng kiểm tra mail để thực hiện việc xóa xác thực 2 bước"
			}
		}
		const now = new Date();
		if(!user.xac_thuc_email_luc || user.xac_thuc_email_luc > now){
			this.logger.warn("Email chưa được xác thực hoặc thời hạn không chính xác");
			return {
				message: "Đã gửi mã OTP qua gmail, vui lòng kiểm tra mail để thực hiện việc xóa xác thực 2 bước"
			}
		}
		if(!user.is_2fa_enable || !user.two_fa_secret){
			this.logger.warn("Không thể đổi xóa xác thực 2 bước vì tài khoản chưa đăng ký xác thực 2 bước");
			return {
				message: "Đã gửi mã OTP qua gmail, vui lòng kiểm tra mail để thực hiện việc xóa xác thực 2 bước"
			}
		}
		const otp = await this.createOtpAndUpdate(user.id, 10_000, 100_000, 10, now);
		const payload: ForgotPassPayload = {
			tai_khoan: user.tai_khoan,
			otp: otp
		}
		this.notificationServiceSend.send('forget_pass_email', "Mã OTP khôi phục mật khẩu",email, payload);
		return {
				message: "Đã gửi mã OTP qua gmail, vui lòng kiểm tra mail để thực hiện việc xóa xác thực 2 bước"
		}
	}	
	async VerifyTwofactoryByEmail(otp: string, encryptEmail: string ){
		const  email = CrytoUlti.decrypt(encryptEmail);
		const user = await this.userService.FindFirstBy({email: email, provider: AUTH_PROVIDER.LOCAL});
		if(!user){
			throw new NotFoundException("Thông tin xác thực không chính xác");
		}
		if(!user.is_2fa_enable || !user.two_fa_secret){
			throw  new BadRequestException("Tài khoản của bạn ko bật xác thực 2 bước nên ko thể xóa");
		}
		const now = new Date();
		if(!user.otp_expire || user.otp_expire < now || !user.otp){
			throw new BadRequestException("OTP đã hết hạn vui lòng gửi lại mã otp để tiến hành xóa xác thực 2 bước")
		}
		const isValid = await bcrypt.compare(otp, user.otp);
		if(!isValid){
			throw new BadRequestException("OTP không đúng vui lòng kiểm tra lại");
		}
		await this.userService.UpdateUser({id: user.id},{
			otp: null,
			otp_expire: null,
			is_2fa_enable: false,
			two_fa_secret: null
		})
		
	}
	async VerifyTwoFactor(id_user: number, ma_bao_ve: string){
		const currentUser = await this.userService.FindFirstBy({id: id_user});
		if(!currentUser ){
			throw new NotFoundException("Dữ liệu 2FA không hợp lệ")
		}
		if(!currentUser.is_2fa_enable || !currentUser.two_fa_secret){
			throw  new BadRequestException("Tài khoản của bạn ko bật xác thực 2 bước nên ko thể xóa");
		}
		const secret = CrytoUlti.decrypt(currentUser.two_fa_secret);
		const isValid = await verify({
			token: ma_bao_ve, secret: secret, epochTolerance: SECRET_TIME_2FA
		})
		if(!isValid.valid){
			throw new BadRequestException("Mã xác thực không chính xác");
		}
		await this.issueTokenPair(currentUser);
		const tokens = await this.issueTokenPair(currentUser); 
			const safeUserData: SafeUserData = {
				ho_ten: currentUser.ho_ten, tai_khoan: currentUser.tai_khoan, vai_tro: currentUser.vai_tro, email: currentUser.email, is_shop: currentUser.is_shop, hinh: currentUser.hinh
			};
			return {require_2fa: true, ...tokens, user: safeUserData}
	}
	async validateOAuthUser(profile: OAuthProfile, provider: string){
		
		const providerId = profile.id
		const email = profile.email?.[0]?.value.toLowerCase();
		const name = profile.displayName;
		const hinh = profile.photos?.[0]?.value;
		if(!providerId){
			throw new HttpException("Không thể xác thực tài khoản vì id không được cung cấp từ nhà cung cấp OAuth", HttpStatus.BAD_REQUEST);
		}
		if(!email){
			throw new HttpException("Không thể xác thực tài khoản vì email không được cung cấp từ nhà cung cấp OAuth", HttpStatus.BAD_REQUEST);
		}
		let user = await this.userService.FindFirstBy({provider_id: providerId, provider: provider});
		
		if(user){
			if(user.khoa === BOOLEAN.true){
				throw new HttpException("Tài khoản đã bị khóa vui lòng liên hệ với ban quản trị viên để được hỗ trợ", HttpStatus.LOCKED);
			}
			return user;
		}
		user = await this.userService.FindFirstBy({email: email});
		if(user){
			if(user.khoa === BOOLEAN.true){
				throw new HttpException("Tài khoản đã bị khóa vui lòng liên hệ với ban quản trị viên để được hỗ trợ", HttpStatus.LOCKED);
			}
			if(user.provider !== AUTH_PROVIDER.LOCAL){
				throw new HttpException("Tài khoản đã tồn tại với email này nhưng được tạo bởi nhà cung cấp OAuth khác", HttpStatus.CONFLICT);
			}
			user.provider_id = providerId;
			await this.userService.UpdateUser({id: user.id}, {provider_id: providerId});
			return user;
		}
		let rawUserName = email.split('@')[0] || 'user';
		const safeusername = this.createSafeUser(rawUserName);
		let newAccount: string | undefined;
		let suffixLength = 6;
		for(let i = 0; i < 5; i++){
			const randomSuffix = this.generateRandomString(suffixLength);
			newAccount = `${safeusername}${randomSuffix}`;
			const existingUser = await this.userService.FindFirstBy({tai_khoan: newAccount});
			if(!existingUser){
				break;
			}
		}
		if(!newAccount){
			throw new HttpException("Không thể tạo tài khoản người dùng mới do trùng tên tài khoản", HttpStatus.INTERNAL_SERVER_ERROR);
		}
		const newUser = await this.userService.createUser({
			provider_id: providerId,
			provider: provider,
			email: email,
			tai_khoan: newAccount,
			ho_ten: name,
			hinh: hinh,
			xac_thuc_email_luc: new Date()
		})
		if(!newUser){
			throw new HttpException("Không thể tạo tài khoản người dùng mới", HttpStatus.INTERNAL_SERVER_ERROR);
		}
		return newUser;
	}
}
