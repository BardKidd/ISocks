// 🎯 TypeScript 型別定義

// 基礎訊息型別（前端 State 使用）
export interface Message {
  type: 'system' | 'broadcast' | 'private' | 'room';
  message: string;
  timestamp: string;
  from?: string; // 系統訊息沒有發送者
}

// 連接資訊
export interface ConnectionInfo {
  id: string;
  transport: string;
  upgraded: boolean;
}

// === Socket.IO 事件型別（伺服器傳來的資料） ===

// 歡迎訊息事件
export interface WelcomeData {
  message: string;
  clientId: string;
  timestamp: string;
}

// 聊天訊息事件（廣播和私人訊息共用）
export interface ChatMessageData {
  message: string;
  from: string;
  timestamp: string;
  type?: string; // 伺服器可能會傳送，但前端會重新設定
}

// 房間事件
export interface RoomEventData {
  userId: string;
  roomName: string;
  timestamp: string;
}

// 私人訊息發送事件
export interface PrivateMessagePayload {
  targetId: string;
  message: string;
}
