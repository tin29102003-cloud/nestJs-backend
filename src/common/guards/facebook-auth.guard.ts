import { ExecutionContext, Inject, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { User } from "src/user/domain/entities/user.entity";
import { AuthGuard } from "@nestjs/passport";
import { TEMPLATE_INTERFACE, type TemplateServiceInterface } from "src/notification/domain/interface/template.inteface";
import { dataToSendLogin } from "../constants/auth.constaint";
@Injectable()
export class FacebookAuthGuard extends AuthGuard('facebook'){
    private readonly logger = new Logger(FacebookAuthGuard.name);
    constructor(
        @Inject(TEMPLATE_INTERFACE)
        private readonly templateService: TemplateServiceInterface){
        super();
    }
    handleRequest(err: any, user: any, info: any, context: ExecutionContext, status?: any) {
       if(err || !user){
       
        const res = context.switchToHttp().getResponse();
        this.logger.error('Facebook authentication failed:', {error: err?.message, info, hasUser: !!user});
           
         const errorData: dataToSendLogin = {
            success: false,
            message: "Đăng nhập Facebook thất bại",
            jsonData: JSON.stringify({
            error: err?.message || info?.message || 'oauth_failed',
            }),
            clientUrl: process.env.BASE_URL!,
            source: 'facebook-auth',
        };
            const html = this.templateService.compileTemplate('popup_login', errorData) 
            res.status(200).send(html); 
            throw err || new UnauthorizedException({
                message: 'Xác thực Facebook thất bại',
                errorCode: 'FACEBOOK_AUTH_FAILED',
                detail: info?.message
            })
       }
       return user;
    }
}