import { ExecutionContext, Inject, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { TEMPLATE_INTERFACE, type TemplateServiceInterface } from "src/notification/domain/interface/template.inteface";
import { dataToSendLogin } from "../constants/auth.constaint";

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
    private readonly logger = new Logger(GoogleAuthGuard.name);
    constructor(
        @Inject(TEMPLATE_INTERFACE)
        private readonly templateService: TemplateServiceInterface,
    ){
        super();
    }
    handleRequest(err: any, user: any, info: any, context: ExecutionContext, status?: any) {
        if(err || !user){
            const res = context.switchToHttp().getResponse();
            this.logger.error('Google authentication failed:', {error: err?.message, info, hasUser: !!user});
            const errorData: dataToSendLogin = {
                success: false,
                message: 'Đăng nhập Google thất bại',
                jsonData: {
                    error: err?.message || info?.message || 'oauth_failed',
                },
                clientUrl: process.env.BASE_URL!,
                source: 'google-auth',
            };
            const html = this.templateService.compileTemplate('popup_login', errorData);
            res.status(401).send(html);
            throw  err || new UnauthorizedException({
                message: 'Xác thực Google thất bại',
                errorCode: 'GOOGLE_AUTH_FAILED',
                detail: info?.message
            })
        
        }
        return user;
    }
}