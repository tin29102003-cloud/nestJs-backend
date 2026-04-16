import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy } from "passport-facebook";
import { User } from "src/user/domain/entities/user.entity";
import { AuthService } from "../application/service/auth.service";
import { AUTH_PROVIDER, FACEBOOK_CALLBACK_PATH } from "src/common/constants/auth.constaint";
@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook'){
    constructor(private authService: AuthService){
        super({
            clientID: process.env.FACEBOOK_CLIENT_ID!,
            clientSecret: process.env.FACEBOOK_SECRET_KEY!,
            callbackURL: process.env.FACEBOOK_CALLBACK_URL!,
            profileFields: ['id','displayName','photos','email']
        })
    }
    async validate(accessToken: string, refreshToken: string, profile: Profile): Promise<User>{
        return  this.authService.validateOAuthUser(profile, AUTH_PROVIDER.FACEBOOK); 
    }
}
