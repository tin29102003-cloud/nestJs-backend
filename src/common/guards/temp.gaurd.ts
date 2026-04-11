import { CanActivate, ExecutionContext, ForbiddenException, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Observable } from "rxjs";
import { UserService } from "src/user/application/service/user.service";
import { TempJwtPayLoad } from "../constants/auth.constaint";

export class CheckTempToken implements CanActivate{
	private readonly logger = new Logger(CheckTempToken.name);
	private readonly tempSecret = process.env.TEMP_JWT_SECRET || 'co_cai_nit'

	constructor(
		private readonly jwtService: JwtService,
		private readonly userService: UserService
	){    }
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
         	const req = context.switchToHttp().getRequest<Request>();
		const tempHeader = req.headers['x-temp-token'] as string;
		if(!tempHeader){
			throw new  UnauthorizedException("Thiếu token xác thực 2 bước");
		}
		try {
			const payload = this.jwtService.verify(tempHeader, {secret: this.tempSecret}) as TempJwtPayLoad;
			const {is_temp_2fa, id} = payload;
			if(!is_temp_2fa){
				throw new ForbiddenException("Token không hợp lệ cho tác vụ này");
			}
			req['user'] = {id: id};
			return true;
		} catch (error) {
			this.logger.warn("Lỗi jwt trong temptoken", error);
			throw new UnauthorizedException("Token không hợp lệ hoặc đã hết hạn");
		}
    }
}