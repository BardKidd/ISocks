import {
  WebSocketGateway, // 標記這是一個 WebSocket 閘道類別，負責處理 WebSocket 連接
  WebSocketServer, // 注入 Socket.IO 伺服器 Instance，用於管理所有客戶端連接
  SubscribeMessage, // 監聽特定事件的裝飾器，當客戶端發送事件時會觸發
  MessageBody, // 提取客戶端發送的訊息內容
  ConnectedSocket, // 注入當前連結的 Socket 客戶端 Instance
  OnGatewayConnection, // 當有新客戶端連接時自動呼叫 handleConnection
  OnGatewayDisconnect, // 當客戶端斷開連結時自動呼叫 handleDIsconnect
} from '@nestjs/websockets';

// 從 Socket.IO 套件匯入核心類型
import { Server, Socket } from 'socket.io';

import { EventsService } from './events.service';
import { Logger } from '@nestjs/common';

// 將類別標記為 WebSocket 閘道
@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
    // 允許攜帶 cookie
    credentials: true,
  },
  // Socket.IO 4.x 新特性：指定傳輸方式的優先順序
  // Websocket: 最快的雙向溝通協定
  // polling: HTTP 長輪詢，作為 WebSocket 的備援方案。
  transports: ['websocket', 'polling'],
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger(EventsGateway.name);

  constructor(private readonly eventsService: EventsService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.logger.log(`Transport: ${client.conn.transport.name}`);

    // 使用 client.emit() 像這個特定客戶端發送歡迎訊息
    // emit(事件名稱, 資料) 這是 Socket.IO 的核心通訊方法
    client.emit('welcome', {
      message: '歡迎連接到 Socket.IO 伺服器！',
      clientId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // 監聽名為 'messageToServer' 的事件
  // 當任何客戶端發送這個事件時，這個方法就會被觸發
  @SubscribeMessage('messageToServer')
  handleMessage(
    @MessageBody() data: string, // 提取客戶端發送的訊息內容
    @ConnectedSocket() client: Socket, // 注入發送訊息的客戶端 Socket 物件
  ): void {
    this.logger.log(`Message from ${client.id}: ${data}`);

    // Socket.IO 4.x 特性：建立結構化的資料物件，便於前端處理
    const messageData = {
      message: data,
      from: client.id,
      timestamp: new Date().toISOString(),
      type: 'broadcast',
    };

    // 使用 this.server.emit() 廣播給所有連接的客戶端
    // 這包含發送者本身，所有人都會收到這則訊息
    this.server.emit('messageToClient', messageData);
  }

  @SubscribeMessage('privateMessage')
  handlePrivateMessage(
    @MessageBody() data: { targetId: string; message: string },
    @ConnectedSocket() client: Socket,
  ): void {
    this.logger.log(`Private message from ${client.id} to ${data.targetId}`);

    const messageData = {
      message: data.message,
      from: client.id,
      timestamp: new Date().toISOString(),
    };

    // 發送給目標用戶
    this.server.to(data.targetId).emit('privateMessageReceived', messageData);
    
    // 也發送給發送者自己，這樣發送者也能看到自己發送的私人訊息
    client.emit('privateMessageReceived', messageData);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() roomName: string,
    @ConnectedSocket() client: Socket,
  ): void {
    client.join(roomName);
    this.logger.log(`Client ${client.id} joined room: ${roomName}`);

    // 通知房間內其他成員有新用戶加入
    // client.to(roomName) 會發送給房間內除了自己以外的所有成員
    client.to(roomName).emit('userJoined', {
      userId: client.id,
      roomName,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() roomName: string,
    @ConnectedSocket() client: Socket,
  ): void {
    client.leave(roomName);
    this.logger.log(`Client ${client.id} left room: ${roomName}`);

    client.to(roomName).emit('userLeft', {
      userId: client.id,
      roomName,
      timestamp: new Date().toISOString(),
    });
  }
}
