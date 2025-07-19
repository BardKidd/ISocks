// 從 Socket.IO 客戶端套件匯入 io 函數
// io 是建立與伺服器連接的核心函數
import { io, Socket } from 'socket.io-client';
import {
  ChatMessageData,
  PrivateMessagePayload,
  RoomEventData,
  WelcomeData,
} from '@/types/socket';
// 定義客戶端到伺服器的事件
interface ClientToServerEvents {
  messageToServer: (message: string) => void;
  privateMessage: (data: PrivateMessagePayload) => void;
  joinRoom: (roomName: string) => void;
  leaveRoom: (roomName: string) => void;
}

// 定義伺服器到客戶端的事件
interface ServerToClientEvents {
  welcome: (data: WelcomeData) => void;
  messageToClient: (data: ChatMessageData) => void;
  privateMessageReceived: (data: ChatMessageData) => void;
  userJoined: (data: RoomEventData) => void;
  userLeft: (data: RoomEventData) => void;
}

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  'http://localhost:3000',
  {
    // false 表示不會自動連接，需要手動呼叫 connect
    autoConnect: false,
    transports: ['websocket', 'polling'],
    // 超過 20 秒還沒成功視為失敗
    timeout: 20000,
    reconnection: true,
    reconnectionAttempts: 5, // 嘗試重連線 5 次
    reconnectionDelay: 1000,

    // 是否強制建立新連線，false 表示可以復用現有連接
    forceNew: false,

    // 允許跨域請求時攜帶 Cookie 和認證資訊
    withCredentials: true,
  }
);

export default socket;
