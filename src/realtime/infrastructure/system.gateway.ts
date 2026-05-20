import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { IRealtimeService } from "../domain/realtime.interface";
import { Server } from "socket.io";
import { Logger } from "@nestjs/common";
import { buildRoom, CustomSocket, RealTimeRoom } from "src/common/constants/realtime.constain";
import { log } from "node:console";

@WebSocketGateway({
    cors: {
        origin: process.env.CLIENT || "http://localhost:3000",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        credentials: true
    }
})
export class SystemGateway implements OnGatewayConnection, OnGatewayDisconnect, IRealtimeService {
    @WebSocketServer()
    server!: Server;
    private readonly logger = new Logger(SystemGateway.name);
    private 
    async handleConnection(client: CustomSocket) {
       try {
             const user = client.data.user;
            if(!user){
                client.disconnect();
                return;
            }
            this.logger.log(`[SOCKET CONNECT] User ${user.id} | is_shop: ${Boolean(user.is_shop)}`);
            client.join(buildRoom.user(user.id));
            if(Boolean(user.is_shop) === true){
                client.join(buildRoom.shop(user.id));
                this.logger.log(`User ${user.id} đã thêm vào phòng shop`);
            }
            if(user.vai_tro === 1){
                client.join(buildRoom.admin());
                this.logger.log(`Admin ${user.id} đã vào phòng điều hành`);
            }
       } catch (error) {
            this.logger.error(`[SOCKET CONNECT] Error occurred while handling connection for user ${error}`);
        client.disconnect();
        }
    }
    handleDisconnect(client: CustomSocket) {
        const user = client.data.user;
        if(user){
            this.logger.log(`User ${user.id} đã ngắt kết nối`);
        }
    }
    emitEvent(event: string, data: any): void {
        this.server.emit(event, data);
    }
    emitToUser( event: string, room_name: string, data: any): void {
        try {
            this.server.to(room_name).emit(event, data);

        } catch (error) {
            this.logger.error(`[SOCKET EMIT] Error occurred while emitting event ${event} to room ${room_name}: ${error}`);
        }
    }
    forceLogoutUser(userId: number, reason: string): void {
        try {
            //bị đá ở một user room thì cũng bị đá ở cả shop room nếu có
            const userRoom = buildRoom.user(userId);
            this.server.to(userRoom).emit("force_logout", { Notification: reason });
            this.server.to(userRoom).disconnectSockets();
            this.logger.log(`[SOCKET] Đã ngắt kết nối toàn bộ thiết bị của User ${userId}. Lý do: ${reason}`);
        } catch (error) {
            const err = error as Error;
            this.logger.error(`[SOCKET WARNING] Lỗi ngắt kết nối User ${userId}: ${err.message}`, err.stack);
        }
    }
    
}