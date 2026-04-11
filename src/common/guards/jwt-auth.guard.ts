import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from '@nestjs/jwt';
import { Request } from "express";
import { UserService } from "src/user/application/service/user.service";
import { CustomJwtPayload, TempJwtPayLoad } from "../constants/auth.constaint";

@Injectable()
export class JwtAuthGuard implements CanActivate{
	private readonly logger = new Logger(JwtAuthGuard.name);
	private readonly jwtKey = process.env.JWT_SECRET || 'co_cai_nit'
	constructor(
		private readonly jwtService: JwtService,
		private readonly userService: UserService
	){}
	async canActivate(context: ExecutionContext):  Promise<boolean>  {
		const req = context.switchToHttp().getRequest<Request>();
		const token = req.cookies._atkn;
		if(!token){
			throw new UnauthorizedException("Không tìm thấy token xác thực.");
		}
		try {
			const payload = this.jwtService.verify(token, {secret: this.jwtKey}) as CustomJwtPayload;
			const user = await this.userService.FindFirstBy({id: payload.id});
			if(!user){
				throw new UnauthorizedException("Người dùng không tồn tại hoặc bị xóa");
			}
			if(user.token_version !== payload.token_version){
				throw new UnauthorizedException("Phiên làm việc đã hết hạn, vui lòng đăng nhập lại");
			}
			req['user'] = user;
			return true;
		} catch (error) {
			this.logger.warn('lỗi jwt trong jwtAuthguard', error);
			throw new UnauthorizedException("Token không hợp lệ hoặc đã hết hạn")
		}
	}
}
