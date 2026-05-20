import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from "@nestjs/websockets";
import { Socket } from "socket.io";

@WebSocketGateway({
    cors: {
        origin: process.env.CLIENT || "http://localhost:3000",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        credentials: true
    }
})

export class ChatGateway {
    @SubscribeMessage('joinchat')
    private chatRoom(id: number): string  {
        return `chat_room_${id}`;   
    }
    handleJoinChat(@MessageBody() payload: {id_hoi_thoai: number}, @ConnectedSocket() socket: Socket): void {
        socket.join(this.chatRoom(payload.id_hoi_thoai));
    }
    @SubscribeMessage('leavechat')
    handleLeaveChat(@MessageBody() payload: {id_hoi_thoai: number}, @ConnectedSocket() socket: Socket): void {
        socket.leave(this.chatRoom(payload.id_hoi_thoai));
    }
    @SubscribeMessage('typing')//khi người dùng sử dụng sự kiện typing
    handleTyping(@MessageBody() payload: {id_hoi_thoai: number, is_typing: boolean}, @ConnectedSocket() socket: Socket): void {
        socket.to(this.chatRoom(payload.id_hoi_thoai)).emit('user_typing',{
            id_user: socket.data.user.id,
            is_typing: payload.is_typing
        });
    }
}