export const REALTIME_SERVICE = Symbol("REALTIME_SERVICE");
export interface IRealtimeService {
    emitEvent(event: string, payload: any): void;
    emitToUser( event: string, room_name: string, payload: any): void;
    forceLogoutUser(userId: number, reason: string): void;
}