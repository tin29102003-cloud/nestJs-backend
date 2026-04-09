import { BadRequestException, ConflictException, ForbiddenException, HttpException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'node_modules/bcryptjs';
import { UserService } from 'src/user/user.service';
import jwt from 'jsonwebtoken'
import { User } from 'src/user/user.model';
import type { StringValue } from "ms";
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { AUTH_PROVIDER, AuthLoginResult, CustomJwtPayload, LOCK_DURATION, LOGIN_FAIL_MAX, PERM_LOCK_MAX, RefreshJwtPayload, ROLE, SafeUserData, TempJwtPayLoad, TOKEN_EXPIRE_IN, VerifyRegiterResult } from 'src/common/constants/auth.constaint';
import { Notification_Interface, type NotificationInterface } from 'src/notification/interface/notification.interface';
import { RegisterEmailpayLoad, ResultVerifyEmail, VerifyEmailPayload } from 'src/common/constants/notification.constant';
import { Op } from 'sequelize';
@Injectable()
export class AuthService {
	constructor(
		private readonly userService: UserService,
		@Inject(Notification_Interface)
		private  notificationServiceSend:  NotificationInterface,
		
	){}
	
	//hàm privaate sinh token
	private async issueTokenPair(user: User){
		const accessTokenPayLoad: CustomJwtPayload = {
			id: user.id, tai_khoan: user.tai_khoan, vai_tro: user.vai_tro, ho_ten: user.ho_ten, token_version: user.token_version
		}
		
		const refreshTokenPayLoad: RefreshJwtPayload = {
			id: user.id, token_version: user.token_version
		}
		const jwtExpiresIn  =  process.env.ACCESS_TOKEN_EXPIRES_IN ?? `15m`;
		const refreshJwtExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN ?? "7d";
		// console.log(jwtExpiresIn, refreshJwtExpiresIn);
		const token = jwt.sign(
			accessTokenPayLoad,
			process.env.JWT_SECRET ||'Your-secret-pass',
			{expiresIn: jwtExpiresIn as StringValue}
		);
		// console.log(token);
		const refreshToken = jwt.sign(
			refreshTokenPayLoad,
			process.env.REFRESH_JWT_SECRET ||'Your-secret-pass',
			{expiresIn: refreshJwtExpiresIn as StringValue}
		)
		// console.log(refreshToken);
		const  salt =  bcrypt.genSaltSync(10);
		const hasedRefreshToken =  bcrypt.hashSync(refreshToken, salt);
		this.userService.UpdateUser({id: user.id}, {
			refresh_token: hasedRefreshToken
		});
		return {token, refreshToken};
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
			const tempToken = jwt.sign(
				tempPayLoad,
				process.env.TEMP_JWT_SECRET!,
				{expiresIn: tempJwtExpiresIn as StringValue }
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
		console.log(existingUser);
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
		const salt = bcrypt.genSaltSync(10);
		const hashedPassword =  bcrypt.hashSync(mat_khau, salt);
		const token = crypto.randomBytes(32).toString('hex');
		const tokenExpired = new Date(now.getTime() + TOKEN_EXPIRE_IN);
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
		this.notificationServiceSend.send('regiter_email', email, payload);
		// const noi
	}
	async VerifyService(email?: string, token?: string): Promise<VerifyRegiterResult>{
		// console.log(email, token);
		
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
}
