import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport/dist/passport/passport.strategy";
import { Profile, Strategy } from "passport-google-oauth20";
import { User } from "src/user/domain/entities/user.entity";
import { AuthService } from "../application/service/auth.service";
import { AUTH_PROVIDER } from "src/common/constants/auth.constaint";

@Injectable()
export class GoogleStrategy  extends PassportStrategy(Strategy, 'google'){
    constructor(
        private authService: AuthService    
    ){
        super({
            clientID: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            callbackURL: process.env.GOOGLE_CALLBACK_URL!,
            scope: ['email', 'profile']
        })
    }
    async validate(accessToken: string, refreshToken: string, profile: Profile): Promise<User> {
        return this.authService.validateOAuthUser(profile, AUTH_PROVIDER.GOOGLE);
    }
}