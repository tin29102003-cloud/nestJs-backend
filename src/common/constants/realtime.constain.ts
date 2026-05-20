import { Socket } from "socket.io";
enum RealTimeRoom{
    USER = "room_user",
    SHOP = "room_shop",
    ADMIN = "room_admin"
}
const buildRoom = {
    user:(id: number)=> `${RealTimeRoom.USER}_${id}`,
    shop:(id:number)=> `${RealTimeRoom.SHOP}_${id}`,
    admin:()=> RealTimeRoom.ADMIN 
};
export {buildRoom, RealTimeRoom};


export interface SocketAuthUser {
    id: number;
    tai_khoan: string;
    vai_tro: number;
    ho_ten: string | null;
    token_version: string | number;
    is_shop: number;
}
export interface CustomSocket extends Socket{
    data: {
        user: SocketAuthUser
    }
}