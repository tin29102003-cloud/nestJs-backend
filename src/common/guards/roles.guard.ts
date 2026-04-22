import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { ROLE } from "../constants/auth.constaint";
import { User } from "src/user/domain/entities/user.entity";

@Injectable()
export class RolesGuard implements CanActivate{
    constructor(
        private reflector: Reflector
    ){

    }
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        //lấy danh sách các quyên role mà api  yêu cầu
        const requiredRoles = this.reflector.getAllAndOverride<number[]>('roles',[
            context.getHandler(),
            context.getClass()
        ]
        );
        //nếu ko có yêu cầu gì chỉ đang nhập thì cho qua luôn
        if(!requiredRoles){
            return true
        }
        const req = context.switchToHttp().getRequest();
        const user = req.user as  User;
        if(!user){
            throw new ForbiddenException("Không có thông tin người dùng");
        }
        if(requiredRoles.includes(ROLE.ADMIN) && user.vai_tro){
            return true;
        }
        if(requiredRoles.includes('is_shop' as any) &&  Boolean(user.is_shop) === true){
            return true
        }
        throw new ForbiddenException("Bạn không có quyền để truy cập");
    }
    
}
