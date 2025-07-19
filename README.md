# Socket.IO 學習專案

這是一個使用 NestJS (後端) 和 React (前端) 的 Turborepo Monorepo 專案，用於學習和實作 Socket.IO 即時通訊功能。

## 📚 目錄

### 🚀 快速開始
- [技術版本](#技術版本)
- [專案架構](#專案架構)

### 📖 學習路徑（建議按順序進行）
- [階段 1: 環境設定和專案初始化](#階段-1-環境設定和專案初始化)
- [階段 2: 後端設定 (NestJS + Socket.IO)](#階段-2-後端設定-nestjs--socketio)
- [階段 3: 資料庫設定 (TypeORM + MySQL)](#階段-3-資料庫設定-typeorm--mysql)
- [階段 4: 認證系統 (JWT)](#階段-4-認證系統-jwt)
- [階段 5: 前端設定 (React + Socket.IO Client)](#階段-5-前端設定-react--socketio-client)
- [階段 6: 權限控制系統](#階段-6-權限控制系統)
- [階段 7: 測試和除錯](#階段-7-測試和除錯)

### 🎯 進階內容
- [Socket.IO 事件系統詳解](#socketio-事件系統詳解)
- [Socket.IO 4.x TypeScript 最佳實踐](#socketio-4x-typescript-最佳實踐)
- [Socket.IO 4.x 完整特性總結](#socketio-4x-完整特性總結)

### 📚 參考資料
- [進階學習建議](#進階學習建議)
- [開發工具推薦](#開發工具推薦)
- [學習資源](#學習資源)
- [下一步](#下一步)

---

## 技術版本

- **Socket.IO**: 4.8.1 (最新穩定版)
- **NestJS**: 11.1.3
- **React**: 19.1.0
- **Node.js**: >=18
- **TypeScript**: 5.8.2

### Socket.IO 4.x 主要特性

- **改進的傳輸機制**: 支援 HTTP long-polling、WebSocket、WebTransport
- **更好的二進位資料支援**: 優化的二進位資料傳輸
- **增強的錯誤處理**: 更完善的錯誤處理機制
- **連接恢復**: 自動重連和連接狀態管理
- **TypeScript 支援**: 原生 TypeScript 支援和型別安全

## 專案架構

```
Socket/
├── apps/
│   ├── Backend/          # NestJS 後端
│   │   ├── src/
│   │   │   ├── events/   # Socket.IO Gateway
│   │   │   ├── auth/     # JWT 認證
│   │   │   ├── user/     # 用戶管理
│   │   │   ├── post/     # 文章管理
│   │   │   └── migrations/ # 資料庫遷移
│   │   └── package.json
│   └── Frontend/         # React 前端
│       ├── src/
│       │   ├── components/ # UI 元件
│       │   ├── pages/     # 頁面
│       │   ├── contexts/  # React Context
│       │   └── utility/   # 工具函數
│       └── package.json
├── package.json          # 根目錄設定
└── pnpm-workspace.yaml   # Workspace 設定
```

## 學習路徑

### 🎯 學習建議

本教學設計為循序漸進的學習路徑，建議按照以下順序進行：

**📚 核心學習路徑（必學）**：
- 階段 1 → 階段 2 → 階段 5 → 階段 7

**🚀 完整學習路徑（推薦）**：
- 階段 1 → 階段 2 → 階段 3 → 階段 4 → 階段 5 → 階段 6 → 階段 7

**⚡ 快速入門（僅學 Socket.IO）**：
- 階段 1 → 階段 2 → 階段 5（跳過其他階段）

每個階段都有明確的前置條件和學習目標，請確保完成前置條件再進入下一階段。

---

### 階段 1: 環境設定和專案初始化

> **學習目標**: 熟悉 Turborepo Monorepo 結構，確保開發環境正常運作

#### 1.1 安裝依賴
```bash
# 根目錄安裝所有依賴
pnpm install

# 檢查是否安裝成功
pnpm --filter Backend --version
pnpm --filter Frontend --version
```

#### 1.2 啟動開發環境
```bash
# 同時啟動前後端
pnpm dev

# 或分別啟動
pnpm --filter Backend dev  # 後端: http://localhost:3000
pnpm --filter Frontend dev # 前端: http://localhost:5173
```

### 階段 2: 後端設定 (NestJS + Socket.IO)

> **前置條件**: 完成階段 1 的環境設定，確保專案可以正常啟動
> 
> **學習目標**: 建立 Socket.IO 後端服務，理解事件監聽和廣播機制

#### 2.1 安裝 Socket.IO 相關套件
```bash
# 一次安裝所有 Socket.IO 相關套件
pnpm --filter Backend add @nestjs/websockets @nestjs/platform-socket.io socket.io

# 驗證安裝的版本
pnpm --filter Backend list socket.io
pnpm --filter Backend list @nestjs/platform-socket.io
```

> **套件說明**: 
> - `@nestjs/websockets` - 提供 NestJS 的 WebSocket 裝飾器（如 `@WebSocketGateway`、`@SubscribeMessage` 等）
> - `@nestjs/platform-socket.io` - NestJS 與 Socket.IO 的整合層
> - `socket.io` - Socket.IO 核心套件，提供 `Server` 和 `Socket` 類型定義

#### 2.2 建立 Events 模組
```bash
# 在 apps/Backend 目錄下執行
cd apps/Backend

# 建立 events 模組
npx nest g module events

# 建立 events gateway
npx nest g gateway events/events

# 建立 events service
npx nest g service events/events
```

#### 2.3 實作 EventsGateway
編輯 `apps/Backend/src/events/events.gateway.ts`，加入以下內容：

```typescript
// 從 NestJS WebSocket 套件匯入的裝飾器和介面
import {
  WebSocketGateway,      // 📡 標記這是一個 WebSocket 閘道類別，負責處理 WebSocket 連接
  WebSocketServer,       // 🌐 注入 Socket.IO 伺服器實例，用於管理所有客戶端連接
  SubscribeMessage,      // 📨 監聽特定事件的裝飾器，當客戶端發送該事件時會觸發
  MessageBody,           // 📦 提取客戶端發送的訊息內容
  ConnectedSocket,       // 🔌 注入當前連接的 Socket 客戶端實例
  OnGatewayConnection,   // 🚪 介面：當有新客戶端連接時會自動呼叫 handleConnection
  OnGatewayDisconnect,   // 👋 介面：當客戶端斷開連接時會自動呼叫 handleDisconnect
} from '@nestjs/websockets';

// 從 Socket.IO 套件匯入核心類型
import { Server, Socket } from 'socket.io';
// Server: Socket.IO 伺服器類型，管理所有連接和廣播
// Socket: 代表單一客戶端連接的物件，用於與特定客戶端通訊

import { EventsService } from './events.service';  // 自定義的事件處理服務
import { Logger } from '@nestjs/common';            // NestJS 內建的日誌記錄工具

// 🏠 @WebSocketGateway 裝飾器：將類別標記為 WebSocket 閘道
@WebSocketGateway({
  // 🌍 CORS (跨來源資源共享) 設定：允許前端連接到後端
  cors: {
    // 🎯 允許的來源：開發環境允許所有來源，生產環境只允許特定網址
    origin: process.env.NODE_ENV === 'development' ? '*' : 'http://localhost:5173',
    // 🍪 允許攜帶 Cookie 和認證資訊
    credentials: true,
  },
  // 🚗 Socket.IO 4.x 新特性：指定傳輸方式的優先順序
  // websocket: 最快的雙向通訊協議
  // polling: HTTP 長輪詢，作為 WebSocket 的備援方案
  transports: ['websocket', 'polling'],
})
// 📚 實作兩個介面：OnGatewayConnection（連接處理）和 OnGatewayDisconnect（斷開處理）
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  // 🌐 @WebSocketServer 裝飾器：注入 Socket.IO 伺服器實例
  // 這個 server 物件可以用來廣播訊息給所有客戶端或特定群組
  @WebSocketServer()
  server: Server;

  // 📝 建立日誌記錄器，用於記錄連接狀態和除錯資訊
  private logger = new Logger(EventsGateway.name);

  // 💉 依賴注入：注入 EventsService 以處理複雜的業務邏輯
  constructor(private readonly eventsService: EventsService) {}

  // 🚪 OnGatewayConnection 介面的方法：當有新客戶端連接時自動執行
  handleConnection(client: Socket) {
    // 📝 記錄客戶端連接，client.id 是 Socket.IO 自動產生的唯一識別碼
    this.logger.log(`Client connected: ${client.id}`);
    
    // 🔍 Socket.IO 4.x 特性：獲取連接的傳輸層資訊
    // client.conn.transport.name 會顯示使用的協議（websocket 或 polling）
    this.logger.log(`Transport: ${client.conn.transport.name}`);
    
    // 📤 使用 client.emit() 向這個特定客戶端發送歡迎訊息
    // emit(事件名稱, 資料) - 這是 Socket.IO 的核心通訊方法
    client.emit('welcome', {
      message: '歡迎連接到 Socket.IO 伺服器！',
      clientId: client.id,                    // 回傳客戶端自己的 ID
      timestamp: new Date().toISOString(),    // 加入時間戳記
    });
  }

  // 👋 OnGatewayDisconnect 介面的方法：當客戶端斷開連接時自動執行
  handleDisconnect(client: Socket) {
    // 📝 記錄客戶端斷開連接的資訊
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // 📨 @SubscribeMessage 裝飾器：監聽名為 'messageToServer' 的事件
  // 當任何客戶端發送這個事件時，這個方法就會被觸發
  @SubscribeMessage('messageToServer')
  handleMessage(
    @MessageBody() data: string,        // 📦 提取客戶端發送的訊息內容
    @ConnectedSocket() client: Socket,  // 🔌 注入發送訊息的客戶端 Socket 物件
  ): void {
    // 📝 記錄收到的訊息和發送者
    this.logger.log(`Message from ${client.id}: ${data}`);
    
    // 🗂️ Socket.IO 4.x 特性：建立結構化的資料物件，便於前端處理
    const messageData = {
      message: data,                        // 原始訊息內容
      from: client.id,                      // 發送者的 Socket ID
      timestamp: new Date().toISOString(),  // 伺服器收到訊息的時間
      type: 'broadcast',                    // 訊息類型標記
    };
    
    // 📢 使用 this.server.emit() 廣播給「所有」連接的客戶端
    // 這包含發送者本身，所有人都會收到這則訊息
    this.server.emit('messageToClient', messageData);
  }

  // 🔒 Socket.IO 4.x 特性：私人訊息功能
  @SubscribeMessage('privateMessage')
  handlePrivateMessage(
    // 📦 MessageBody 接收包含目標 ID 和訊息的物件
    @MessageBody() data: { targetId: string; message: string },
    @ConnectedSocket() client: Socket,
  ): void {
    // 📝 記錄私人訊息的發送者和接收者
    this.logger.log(`Private message from ${client.id} to ${data.targetId}`);
    
    // 🎯 使用 this.server.to(targetId) 發送給特定的客戶端
    // 只有指定的 targetId 客戶端會收到這則訊息，實現點對點通訊
    this.server.to(data.targetId).emit('privateMessageReceived', {
      message: data.message,                // 私人訊息內容
      from: client.id,                      // 發送者 ID
      timestamp: new Date().toISOString(),  // 發送時間
    });
  }

  // 🏠 Socket.IO 4.x 特性：房間管理系統
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() roomName: string,      // 📦 房間名稱
    @ConnectedSocket() client: Socket,    // 🔌 要加入房間的客戶端
  ): void {
    // 🚪 使用 client.join() 讓這個客戶端加入指定房間
    // 房間是 Socket.IO 的虛擬群組概念，同一房間的成員可以互相通訊
    client.join(roomName);
    this.logger.log(`Client ${client.id} joined room: ${roomName}`);
    
    // 📢 通知房間內「其他」成員有新用戶加入
    // client.to(roomName) 會發送給房間內除了自己以外的所有成員
    client.to(roomName).emit('userJoined', {
      userId: client.id,                    // 加入者的 ID
      roomName,                             // 房間名稱
      timestamp: new Date().toISOString(),  // 加入時間
    });
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() roomName: string,      // 📦 要離開的房間名稱
    @ConnectedSocket() client: Socket,    // 🔌 要離開房間的客戶端
  ): void {
    // 🚪 使用 client.leave() 讓這個客戶端離開指定房間
    client.leave(roomName);
    this.logger.log(`Client ${client.id} left room: ${roomName}`);
    
    // 📢 通知房間內其他成員有用戶離開
    // 由於已經離開房間，所以用 client.to(roomName) 不會發送給自己
    client.to(roomName).emit('userLeft', {
      userId: client.id,                    // 離開者的 ID
      roomName,                             // 房間名稱
      timestamp: new Date().toISOString(),  // 離開時間
    });
  }
}
```

#### Socket.IO 4.x 新特性解說

1. **改進的 CORS 設定**: 更安全的跨域設定
2. **傳輸方式指定**: 可以指定使用的傳輸協議
3. **連接資訊獲取**: 可以獲取客戶端的傳輸方式資訊
4. **結構化資料**: 更完善的資料結構
5. **房間管理**: 內建的房間功能，支援群組聊天
6. **私人訊息**: 點對點通訊支援

#### 2.4 註冊模組
1. 檢查 `events.module.ts` 是否正確匯入：
```typescript
import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { EventsService } from './events.service';

@Module({
  providers: [EventsGateway, EventsService],
})
export class EventsModule {}
```

2. 在 `app.module.ts` 中匯入 EventsModule：
```typescript
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    // ... 其他模組
    EventsModule,
  ],
  // ...
})
export class AppModule {}
```

### 階段 3: 資料庫設定 (TypeORM + MySQL)

> **前置條件**: 完成階段 2 的後端設定，Socket.IO Gateway 可以正常運作
> 
> **學習目標**: 設定資料庫連接，理解 Entity 關係和資料遷移
> 
> **注意**: 此階段可選，如果只想學習 Socket.IO 基礎功能可以跳過

#### 3.1 建立 .env 檔案
在 `apps/Backend` 目錄下建立 `.env` 檔案：

```env
# 資料庫設定
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_NAME=socket_learning

# JWT 設定
JWT_SECRET=your_jwt_secret_key
```

#### 3.2 資料庫遷移
```bash
# 執行現有遷移
pnpm --filter Backend migration:run

# 檢查遷移狀態
pnpm --filter Backend migration:show
```

#### 3.3 理解 Entity 結構
研究 `User` 和 `Post` Entity 的關係：

**User Entity (`src/user/entities/user.entity.ts`)**:
- UUID 主鍵
- 唯一 email 約束
- 密碼欄位預設不查詢
- 一對多關係到 Post

**Post Entity (`src/post/entities/post.entity.ts`)**:
- UUID 主鍵
- 多對一關係到 User
- CASCADE 刪除

### 階段 4: 認證系統 (JWT)

> **前置條件**: 完成階段 3 的資料庫設定（如果跳過階段 3，需要先完成資料庫設定）
> 
> **學習目標**: 理解 JWT 認證流程，為後續的權限控制做準備
> 
> **注意**: 此階段可選，純 Socket.IO 學習可以先跳過

#### 4.1 理解認證流程
1. 用戶註冊/登入
2. 後端驗證並產生 JWT Token
3. 前端儲存 Token
4. 後續請求攜帶 Token
5. 後端驗證 Token

#### 4.2 測試認證 API
使用 `apps/Backend/api/` 目錄下的 HTTP 檔案測試 API：

```bash
# 測試用戶註冊
POST http://localhost:3000/auth/register

# 測試用戶登入
POST http://localhost:3000/auth/login
```

### 階段 5: 前端設定 (React + Socket.IO Client)

> **前置條件**: 完成階段 2 的後端設定，後端 Socket.IO 服務正常運行
> 
> **學習重點**: 
> - 理解 Socket.IO 官方內建事件 vs 自訂事件
> - 學習前端與後端的即時通訊
> - TypeScript 型別安全的 Socket.IO 使用

#### 5.1 安裝 Socket.IO Client
```bash
# 安裝 Socket.IO 4.x 客戶端
pnpm --filter Frontend add socket.io-client@^4.8.1

# 驗證安裝版本
pnpm --filter Frontend list socket.io-client
```

> **版本說明**: Socket.IO 4.x 客戶端與伺服器端版本保持一致，確保最佳相容性。

#### 5.2 建立 Socket.IO 連接
在 `apps/Frontend/src` 目錄下建立 `socket.ts`：

```typescript
// 📦 從 Socket.IO 客戶端套件匯入 io 函數
// io 是建立與伺服器連接的核心函數
import { io } from 'socket.io-client';

// 🔧 Socket.IO 4.x 進階設定：建立與後端的連接
const socket = io('http://localhost:3000', {
  // 🎛️ 手動控制連接：設為 false 表示不會自動連接，需要手動呼叫 connect()
  autoConnect: false,
  
  // 🚗 Socket.IO 4.x 新特性：指定傳輸方式的優先順序
  // ['websocket', 'polling'] 表示優先使用 WebSocket，失敗時退回到 HTTP 長輪詢
  transports: ['websocket', 'polling'],
  
  // ⏰ 連接超時設定：20 秒後如果還沒連接成功就視為失敗
  timeout: 20000,
  
  // 🔄 重新連接設定
  reconnection: true,              // 是否啟用自動重連
  reconnectionAttempts: 5,         // 最多嘗試重連 5 次
  reconnectionDelay: 1000,         // 每次重連間隔 1 秒
  
  // 🆕 Socket.IO 4.x 特性：是否強制建立新連接
  // false 表示可以復用現有連接，提升效能
  forceNew: false,
  
  // 🍪 開發環境設定：允許跨域請求時攜帶 Cookie 和認證資訊
  withCredentials: true,
});

// 📡 Socket.IO 4.x 特性：監聽連接狀態相關事件
// 使用 socket.on(事件名稱, 回調函數) 來監聽伺服器或 Socket.IO 系統事件

// 🎯 重要概念：Socket.IO 事件分為兩類
// 1. 官方內建事件（系統自動觸發）：connect, disconnect, connect_error, reconnect 等
// 2. 自訂事件（開發者定義）：messageToServer, messageToClient, joinRoom 等
// 
// 內建事件由 Socket.IO 系統自動觸發，無需手動 emit
// 自訂事件需要使用 socket.emit() 手動觸發

// ✅ 'connect' 事件：【官方內建事件】當成功連接到伺服器時自動觸發
socket.on('connect', () => {
  // socket.id 是伺服器分配給這個連接的唯一識別碼
  console.log('✅ Connected to server:', socket.id);
});

// ❌ 'disconnect' 事件：【官方內建事件】當與伺服器斷開連接時自動觸發
socket.on('disconnect', (reason) => {
  // reason 參數說明斷開的原因（網路問題、伺服器關閉等）
  console.log('❌ Disconnected:', reason);
});

// 🔴 'connect_error' 事件：【官方內建事件】當連接失敗時自動觸發
socket.on('connect_error', (error) => {
  // error 物件包含錯誤的詳細資訊
  console.error('🔴 Connection error:', error.message);
});

// 🔄 'reconnect' 事件：【官方內建事件】當重新連接成功時自動觸發
socket.on('reconnect', (attemptNumber) => {
  // attemptNumber 表示這是第幾次重連嘗試
  console.log('🔄 Reconnected after', attemptNumber, 'attempts');
});

// 🔴 'reconnect_error' 事件：【官方內建事件】當重連失敗時自動觸發
socket.on('reconnect_error', (error) => {
  // 重連失敗的錯誤資訊
  console.error('🔴 Reconnection error:', error.message);
});

// 📤 匯出 socket 實例，讓其他元件可以使用
export default socket;
```

#### 5.3 建立型別定義檔案

首先建立 `apps/Frontend/src/types/socket.ts` 來統一管理型別：

```typescript
// src/types/socket.ts

// 🎯 職責分離的型別設計原則

// === 前端 State 專用型別 ===
export interface Message {
  type: 'system' | 'broadcast' | 'private' | 'room';
  message: string;
  timestamp: string;
  from?: string; // 系統訊息沒有發送者
}

export interface ConnectionInfo {
  id: string;
  transport: string;
  upgraded: boolean;
}

// === Socket.IO 事件型別（伺服器傳來的資料） ===
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

export interface RoomEventData {
  userId: string;
  roomName: string;
  timestamp: string;
}

// === 客戶端發送事件型別 ===
export interface PrivateMessagePayload {
  targetId: string;
  message: string;
}
```

#### 5.4 建立進階聊天元件

建立 `apps/Frontend/src/components/Chat.tsx`，使用統一的型別定義：

```tsx
// ⚛️ 匯入 React Hook 和 Socket 實例
import { useState, useEffect } from 'react';
import socket from '../socket';  // 匯入之前建立的 socket 連接

// 🎯 匯入統一的型別定義
import { 
  Message, 
  ConnectionInfo, 
  WelcomeData, 
  ChatMessageData, 
  RoomEventData 
} from '../types/socket';

export default function Chat() {
  // 🗂️ React State 管理各種資料狀態（使用 TypeScript 型別）
  const [messages, setMessages] = useState<Message[]>([]);          // 聊天訊息陣列
  const [inputMessage, setInputMessage] = useState<string>('');     // 輸入框的文字
  const [isConnected, setIsConnected] = useState<boolean>(false);   // 連接狀態
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);    // 連接詳細資訊
  const [currentRoom, setCurrentRoom] = useState<string>('');       // 當前房間名稱
  const [roomUsers, setRoomUsers] = useState<string[]>([]);         // 房間用戶列表
  const [privateMessageTarget, setPrivateMessageTarget] = useState<string>(''); // 私訊目標

  // 🔄 useEffect: 元件載入時設定 Socket 事件監聽器
  useEffect(() => {
    // ✅ 監聽 'connect' 事件：連接成功時更新狀態
    socket.on('connect', () => {
      setIsConnected(true);  // 更新連接狀態為已連接
      // 🔍 Socket.IO 4.x 特性：獲取連接的詳細資訊
      setConnectionInfo({
        id: socket.id || '',                                           // Socket ID (處理可能的 undefined)
        transport: socket.io.engine.transport.name,                   // 傳輸協議名稱
        upgraded: socket.io.engine.transport.name === 'websocket',    // 簡化升級判斷
      });
    });

    // 🔄 Socket.IO 4.x 特性：監聽傳輸升級事件
    // 當連接從 polling 升級到 websocket 時觸發
    (socket.io.engine as any).on('upgrade', () => {
      setConnectionInfo(prev => ({
        ...prev,
        transport: socket.io.engine.transport.name,  // 更新傳輸方式
        upgraded: true,                              // 標記為已升級
      }));
    });

    // ❌ 監聽 'disconnect' 事件：斷開連接時重置狀態
    socket.on('disconnect', () => {
      setIsConnected(false);    // 更新連接狀態為未連接
      setConnectionInfo(null);  // 清除連接資訊
    });

    // 🔔 監聽來自伺服器的 'welcome' 事件【自訂事件】（系統歡迎訊息）
    socket.on('welcome', (data: WelcomeData) => {
      // 使用函數式更新來避免狀態覆蓋問題
      setMessages(prev => [...prev, {
        type: 'system',           // 訊息類型：系統訊息
        message: data.message,    // 歡迎訊息內容
        timestamp: data.timestamp, // 時間戳記
      }]);
    });

    // 📢 監聽來自伺服器的 'messageToClient' 事件【自訂事件】（廣播訊息）
    socket.on('messageToClient', (data: ChatMessageData) => {
      setMessages(prev => [...prev, {
        type: 'broadcast',    // 訊息類型：廣播訊息
        message: data.message,
        from: data.from,
        timestamp: data.timestamp,
      }]);
    });

    // 🔒 Socket.IO 4.x 特性：監聽私人訊息【自訂事件】
    socket.on('privateMessageReceived', (data: ChatMessageData) => {
      setMessages(prev => [...prev, {
        type: 'private',      // 訊息類型：私人訊息
        message: data.message,
        from: data.from,
        timestamp: data.timestamp,
      }]);
    });

    // 🏠 Socket.IO 4.x 特性：監聽房間事件【自訂事件】
    // 當有用戶加入房間時
    socket.on('userJoined', (data: RoomEventData) => {
      setMessages(prev => [...prev, {
        type: 'room',     // 訊息類型：房間通知
        message: `用戶 ${data.userId} 加入了房間 ${data.roomName}`,
        timestamp: data.timestamp,
      }]);
    });

    // 當有用戶離開房間時【自訂事件】
    socket.on('userLeft', (data: RoomEventData) => {
      setMessages(prev => [...prev, {
        type: 'room',     // 訊息類型：房間通知
        message: `用戶 ${data.userId} 離開了房間 ${data.roomName}`,
        timestamp: data.timestamp,
      }]);
    });

    // 🔌 手動啟動連接（因為設定了 autoConnect: false）
    socket.connect();

    // 🧹 清理函數：元件卸載時斷開連接，避免記憶體洩漏
    return () => {
      socket.disconnect();
    };
  }, []); // 空的依賴陣列表示只在元件載入時執行一次

  // 📤 發送廣播訊息的函數
  const sendMessage = () => {
    // 檢查輸入的訊息是否不為空（去除空白字元）
    if (inputMessage.trim()) {
      // 🚀 使用 socket.emit() 向伺服器發送【自訂事件】
      // emit(事件名稱, 資料) - 對應到後端的 @SubscribeMessage('messageToServer')
      socket.emit('messageToServer', inputMessage);
      setInputMessage('');  // 清空輸入框
    }
  };

  // 🔒 發送私人訊息的函數
  const sendPrivateMessage = () => {
    // 檢查訊息和目標 ID 都不為空
    if (inputMessage.trim() && privateMessageTarget) {
      // 🎯 發送私人訊息【自訂事件】，包含目標用戶 ID 和訊息內容
      socket.emit('privateMessage', {
        targetId: privateMessageTarget,  // 接收者的 Socket ID
        message: inputMessage,           // 私人訊息內容
      });
      setInputMessage('');  // 清空輸入框
    }
  };

  // 🚪 加入房間的函數
  const joinRoom = () => {
    if (currentRoom.trim()) {
      // 🏠 發送加入房間【自訂事件】
      socket.emit('joinRoom', currentRoom);
    }
  };

  // 👋 離開房間的函數
  const leaveRoom = () => {
    if (currentRoom.trim()) {
      // 🚪 發送離開房間【自訂事件】
      socket.emit('leaveRoom', currentRoom);
    }
  };

  const getMessageStyle = (type: Message['type']): string => {
    switch (type) {
      case 'system':
        return 'text-blue-600 bg-blue-50 p-2 rounded';
      case 'private':
        return 'text-purple-600 bg-purple-50 p-2 rounded';
      case 'room':
        return 'text-green-600 bg-green-50 p-2 rounded';
      default:
        return '';
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* 連接狀態顯示 */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className={`inline-block px-3 py-1 rounded-full text-sm ${
          isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isConnected ? '已連接' : '未連接'}
        </div>
        {connectionInfo && (
          <div className="mt-2 text-sm text-gray-600">
            ID: {connectionInfo.id} | 
            傳輸: {connectionInfo.transport} | 
            升級: {connectionInfo.upgraded ? '是' : '否'}
          </div>
        )}
      </div>

      {/* 房間控制 */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">房間管理</h3>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={currentRoom}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentRoom(e.target.value)}
            placeholder="房間名稱"
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <button
            onClick={joinRoom}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            加入房間
          </button>
          <button
            onClick={leaveRoom}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            離開房間
          </button>
        </div>
      </div>

      {/* 訊息顯示區 */}
      <div className="border rounded-lg p-4 h-64 overflow-y-auto mb-4 bg-white">
        {messages.map((msg, index) => (
          <div key={index} className={`mb-2 ${getMessageStyle(msg.type)}`}>
            <div className="text-xs text-gray-500">
              {msg.type === 'private' && '🔒 私人訊息 '}
              {msg.type === 'room' && '🏠 房間 '}
              {msg.type === 'system' && '🔔 系統 '}
              {msg.timestamp && new Date(msg.timestamp).toLocaleTimeString()}
            </div>
            <div>
              {msg.from && <span className="font-semibold">{msg.from}: </span>}
              {msg.message}
            </div>
          </div>
        ))}
      </div>

      {/* 私人訊息設定 */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">私人訊息</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={privateMessageTarget}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrivateMessageTarget(e.target.value)}
            placeholder="目標用戶 ID"
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <button
            onClick={sendPrivateMessage}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            發送私人訊息
          </button>
        </div>
      </div>

      {/* 訊息輸入區 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputMessage(e.target.value)}
          onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && sendMessage()}
          placeholder="輸入訊息..."
          className="flex-1 px-3 py-2 border rounded-lg"
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          廣播訊息
        </button>
      </div>
    </div>
  );
}
```

#### Socket.IO 4.x 前端新特性

1. **連接狀態詳細資訊**: 顯示連接 ID、傳輸方式等
2. **房間管理**: 加入/離開房間功能
3. **私人訊息**: 點對點通訊
4. **訊息分類**: 系統、廣播、私人、房間訊息區分
5. **視覺化狀態**: 不同類型訊息的視覺區分
6. **即時更新**: 房間用戶進出的即時通知
7. **重連機制**: 自動重連和重連狀態顯示

#### 🔄 重連機制詳解

Socket.IO 4.x 內建了強大的重連機制，當連接斷開時會自動嘗試重連：

**重連相關的官方內建事件**：
- `disconnect`: 連接斷開時觸發
- `reconnect_attempt`: 每次嘗試重連時觸發
- `reconnect`: 重連成功時觸發
- `reconnect_error`: 重連失敗時觸發
- `reconnect_failed`: 達到最大重連次數時觸發

**實作範例**：
```typescript
// 重連設定
const socket = io('http://localhost:3000', {
  reconnection: true,           // 啟用自動重連
  reconnectionAttempts: 5,      // 最多嘗試 5 次
  reconnectionDelay: 1000,      // 每次重連間隔 1 秒
});

// 監聽重連事件
(socket as any).on('reconnect_attempt', (attemptNumber: number) => {
  console.log(`正在嘗試重連... (第 ${attemptNumber} 次)`);
});

(socket as any).on('reconnect', (attemptNumber: number) => {
  console.log(`重連成功！(嘗試了 ${attemptNumber} 次)`);
});
```

**UI 狀態顯示**：
- 🟢 **已連接**: 正常連接狀態
- 🟡 **重連中**: 顯示重連進度
- 🔴 **未連接**: 連接失敗或重連失敗

#### 🔍 連接監控功能詳解

**ConnectionInfo 狀態追蹤**：
```typescript
interface ConnectionInfo {
  id: string;        // Socket.IO 分配的唯一 ID (每次重連會改變)
  transport: string; // 當前使用的傳輸協議 ('polling' 或 'websocket')
  upgraded: boolean; // 是否已從 polling 升級到 websocket
}
```

**功能說明**：
- **Socket ID**: 伺服器分配的臨時識別碼，重連後會改變
- **傳輸協議**: 
  - `polling`: HTTP 長輪詢，相容性好但效率較低
  - `websocket`: 真正的雙向通訊，效率高但可能被防火牆阻擋
- **升級檢測**: 監控連接是否從 polling 成功升級到 websocket

**TypeScript 兼容性解決方案**：
```typescript
// 處理 socket.id 可能為 undefined 的情況
id: socket.id || '',

// 簡化升級檢測 (避免 TypeScript 錯誤)
upgraded: socket.io.engine.transport.name === 'websocket',

// 監聽升級事件 (使用類型斷言)
(socket.io.engine as any).on('upgrade', () => {
  // 更新連接資訊
});
```

**為什麼需要這些監控？**：
1. **診斷連接問題**: 查看是否成功使用 WebSocket
2. **效能監控**: WebSocket 比 polling 效率更高
3. **網路環境檢測**: 某些環境可能阻擋 WebSocket
4. **開發除錯**: 了解連接的實際狀態

### Socket.IO 4.x TypeScript 最佳實踐

> **前置條件**：完成階段 5.3 的型別定義和 5.4 的基本聊天元件
> 
> **學習目標**：進階的 TypeScript 型別安全技巧和設計模式

#### 2. Socket.IO 客戶端型別增強
在 `socket.ts` 中使用型別增強：

```typescript
// socket.ts
import { io, Socket } from 'socket.io-client';
import { 
  ChatMessageData, 
  WelcomeData, 
  RoomEventData, 
  PrivateMessagePayload 
} from './types/socket';

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

// 創建型別安全的 Socket
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io('http://localhost:3000', {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  timeout: 20000,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  forceNew: false,
  withCredentials: true,
});

export default socket;
```

#### 3. 型別安全的元件重構範例

以下是如何將 Chat.tsx 重構為更型別安全的版本：

```typescript
// Chat.tsx - 型別安全版本
import React, { useState, useEffect } from 'react';
import socket from '../socket';
import { 
  Message, 
  ConnectionInfo, 
  WelcomeData, 
  ChatMessageData, 
  RoomEventData 
} from '../types/socket';

export default function Chat(): JSX.Element {
  // 使用定義好的型別
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);

  // 型別安全的事件處理
  useEffect(() => {
    socket.on('welcome', (data: WelcomeData) => {
      setMessages(prev => [...prev, {
        type: 'system',
        message: data.message,
        timestamp: data.timestamp,
      }]);
    });

    // 職責分離：明確轉換伺服器資料到前端 State 格式
    socket.on('messageToClient', (data: ChatMessageData) => {
      setMessages(prev => [...prev, {
        type: 'broadcast',
        message: data.message,
        from: data.from,
        timestamp: data.timestamp,
      }]);
    });

    socket.on('privateMessageReceived', (data: ChatMessageData) => {
      setMessages(prev => [...prev, {
        type: 'private',
        message: data.message,
        from: data.from,
        timestamp: data.timestamp,
      }]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // 型別安全的函數
  const sendMessage = (): void => {
    if (inputMessage.trim()) {
      socket.emit('messageToServer', inputMessage);
      setInputMessage('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setInputMessage(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  // JSX 回傳（完整實作請參考上面的階段 5.4）
  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* 完整的 UI 實作請參考上面的階段 5.4 */}
    </div>
  );
}
```

> **重要提醒**：這個版本專注於展示 TypeScript 型別安全技巧，完整的 UI 實作請參考上面的階段 5.4。

#### 4. TypeScript 型別設計最佳實踐

##### 🎯 職責分離原則

**問題**：避免型別重複和混淆
```typescript
// ❌ 避免：混淆的型別設計
interface Message { /* 既用於 State 又用於 Socket 事件 */ }
interface MessageData { /* 幾乎和 Message 一樣，造成混淆 */ }
```

**解決方案**：根據使用場景分離型別
```typescript
// ✅ 推薦：職責分離的型別設計

// 前端 State 專用
interface Message {
  type: 'system' | 'broadcast' | 'private' | 'room';
  message: string;
  timestamp: string;
  from?: string;
}

// Socket.IO 事件專用（伺服器傳來）
interface ChatMessageData {
  message: string;
  from: string;
  timestamp: string;
  type?: string; // 可選，前端會重新設定
}

// 客戶端發送事件專用
interface PrivateMessagePayload {
  targetId: string;
  message: string;
}
```

##### 📋 型別命名規範

| 用途 | 命名模式 | 範例 |
|------|----------|------|
| 前端 State | 簡潔名詞 | `Message`, `User`, `ConnectionInfo` |
| Socket 接收事件 | `XxxData` | `ChatMessageData`, `WelcomeData` |
| Socket 發送事件 | `XxxPayload` | `PrivateMessagePayload`, `JoinRoomPayload` |
| API 回應 | `XxxResponse` | `LoginResponse`, `UserListResponse` |

##### 🔄 資料轉換最佳實踐

```typescript
// 明確的資料轉換，而非直接展開
socket.on('messageToClient', (data: ChatMessageData) => {
  setMessages(prev => [...prev, {
    type: 'broadcast',           // 前端決定的類型
    message: data.message,       // 明確對應
    from: data.from,
    timestamp: data.timestamp,
    // 不使用 ...data，避免意外的屬性混入
  }]);
});
```

##### 💡 進階技巧

**1. 使用聯合型別增強型別安全**
```typescript
type MessageType = 'system' | 'broadcast' | 'private' | 'room';

interface BaseMessage {
  message: string;
  timestamp: string;
}

interface SystemMessage extends BaseMessage {
  type: 'system';
  // 系統訊息沒有 from
}

interface UserMessage extends BaseMessage {
  type: 'broadcast' | 'private';
  from: string; // 用戶訊息必須有發送者
}

type Message = SystemMessage | UserMessage;
```

**2. 使用泛型提高重用性**
```typescript
interface SocketEvent<T = any> {
  event: string;
  data: T;
  timestamp: string;
}

type ChatEvent = SocketEvent<ChatMessageData>;
type WelcomeEvent = SocketEvent<WelcomeData>;
```

#### ✅ 階段 5 完成檢查

完成此階段後，你應該能夠：

- [ ] 前端可以成功連接到後端 Socket.IO 服務
- [ ] 在瀏覽器開發者工具中看到 "Connected to server" 訊息
- [ ] 可以發送和接收即時訊息
- [ ] 理解官方內建事件（connect, disconnect）和自訂事件（messageToServer）的差別
- [ ] 房間功能正常運作（加入/離開房間）
- [ ] 私人訊息功能正常運作
- [ ] 連接狀態監控正常顯示（ID、傳輸方式、升級狀態）

如果以上功能都正常運作，恭喜你已經掌握了 Socket.IO 的核心功能！

---

### 階段 6: 權限控制系統

> **前置條件**: 完成階段 4 的認證系統和階段 5 的前端設定
> 
> **學習目標**: 實作基於角色的權限控制，結合 Socket.IO 和認證系統

#### 6.1 理解 CASL 權限系統
專案使用 CASL 進行權限控制：

1. **定義能力** (`src/utility/defineAbilityFor.ts`)
2. **權限資料** (`src/mock/permission.ts`)
3. **權限元件** (`src/components/PermissionLink.tsx`)

#### 6.2 測試權限系統
1. 修改 `src/mock/permission.ts` 中的權限設定
2. 觀察導航選單的變化
3. 嘗試訪問受限頁面

### 階段 7: 測試和除錯

> **前置條件**: 完成前面所有學習階段，具備完整的 Socket.IO 應用
> 
> **學習目標**: 確保程式碼品質，學習除錯技巧和最佳實踐

#### 7.1 執行測試
```bash
# 後端測試
pnpm --filter Backend test          # 單元測試
pnpm --filter Backend test:e2e      # 端到端測試
pnpm --filter Backend test:cov      # 覆蓋率測試

# 前端測試
pnpm --filter Frontend test
```

#### 7.2 程式碼檢查
```bash
# 執行 ESLint
pnpm lint

# 格式化程式碼
pnpm format

# 型別檢查
pnpm check-types
```

#### 7.3 常見問題和解決方案

**問題 1: Socket.IO 連接失敗**
- 檢查後端是否正在運行
- 確認 CORS 設定正確
- 檢查防火牆設定

**問題 2: 資料庫連接錯誤**
- 確認 MySQL 服務正在運行
- 檢查 .env 檔案設定
- 確認資料庫存在

**問題 3: JWT Token 錯誤**
- 檢查 JWT_SECRET 設定
- 確認 Token 格式正確
- 檢查 Token 是否過期

## Socket.IO 4.x 完整特性總結

### 🚀 核心改進

1. **傳輸層優化**
   - WebSocket 優先，HTTP long-polling 備援
   - WebTransport 支援（Chrome 97+）
   - 更智能的傳輸選擇機制

2. **連接管理**
   - 改進的重連機制
   - 連接狀態詳細監控
   - 更好的錯誤處理和回報

3. **效能提升**
   - 優化的二進位資料傳輸
   - 更小的封包大小
   - 改進的記憶體使用效率

4. **開發者體驗**
   - 原生 TypeScript 支援
   - 更好的除錯工具
   - 詳細的連接診斷資訊

### 🔧 新功能實作

- ✅ **房間系統**: 群組聊天和頻道管理
- ✅ **私人訊息**: 點對點安全通訊
- ✅ **連接恢復**: 自動重連和狀態同步
- ✅ **事件命名空間**: 模組化的事件管理
- ✅ **中間件支援**: 認證和授權整合

## 進階學習建議

### 1. 擴展功能
- 檔案共享和上傳
- 語音/視訊通話 (WebRTC 整合)
- 訊息加密和安全性
- 訊息持久化和歷史記錄

### 2. 效能最佳化
- Redis 適配器用於擴展
- 訊息佇列和批次處理
- 連接池管理
- 負載平衡策略

### 3. 生產環境部署
- Docker 容器化
- Kubernetes 編排
- 監控和日誌分析
- 安全性強化

## 開發工具推薦

- **資料庫**: MySQL Workbench 或 phpMyAdmin
- **API 測試**: Postman 或 REST Client (VS Code)
- **WebSocket 測試**: Socket.IO Client Tool
- **除錯**: Chrome DevTools Network tab

## 學習資源

- [Socket.IO 官方文件](https://socket.io/docs/)
- [NestJS WebSocket 文件](https://docs.nestjs.com/websockets/gateways)
- [TypeORM 文件](https://typeorm.io/)
- [CASL 權限控制文件](https://casl.js.org/)

## 下一步

完成基本功能後，建議學習：
1. WebRTC 點對點通訊
2. 微服務架構
3. GraphQL 訂閱
4. 雲端部署 (AWS, Google Cloud)