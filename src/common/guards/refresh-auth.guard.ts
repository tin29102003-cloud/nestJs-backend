import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";

import { UserService } from "src/user/application/service/user.service";
import {  RefreshJwtPayload } from "../constants/auth.constaint";
@Injectable()
export class RefreshAuthGuard implements CanActivate{
    private readonly logger = new Logger(RefreshAuthGuard.name);
    private readonly RefreshKey = process.env.REFRESH_JWT_SECRET ?? 'co-cai-nit'
    constructor(

        private readonly jwtService: JwtService
    ){}
    async canActivate(context: ExecutionContext): Promise<boolean> {
            const req = context.switchToHttp().getRequest<Request>();
            const refreshToken: string = req.cookies._rtkn;
            if(!refreshToken){
                throw new UnauthorizedException("Không có refresh token");
            }
            let payload:RefreshJwtPayload
            try {
                payload = this.jwtService.verify(refreshToken, {secret: this.RefreshKey}) as RefreshJwtPayload;
                req['refresh-payload'] = payload;
                req['refresh-token'] = refreshToken
                return true;
            } catch (error) {
                this.logger.warn("Co lỗi trong guard refreshauth");
                throw new UnauthorizedException("Refresh token không hợp lệ hoặc đã hết hạn")
            }
    }
}