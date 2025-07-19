import { useState, useEffect } from 'react';
import socket from '@/socket';
import {
  Message,
  ConnectionInfo,
  WelcomeData,
  ChatMessageData,
  RoomEventData,
} from '@/types/socket';

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [currentRoom, setCurrentRoom] = useState<string>('');
  const [privateMessageTarget, setPrivateMessageTarget] = useState<string>('');
  const [reconnectAttempts] = useState<number>(0);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);

  useEffect(() => {
    const handleWelcome = (data: WelcomeData) => {
      setMessages(prev => [...prev, {
        type: 'system',
        message: data.message,
        timestamp: data.timestamp,
      }]);
    };

    const handleConnect = () => {
      setIsConnected(true);
      setIsReconnecting(false);
      setConnectionInfo({
        id: socket.id || '',
        transport: socket.io.engine.transport.name,
        upgraded: socket.io.engine.transport.name === 'websocket',
      });
    };

    const handleDisconnect = (reason: string) => {
      setIsConnected(false);
      setConnectionInfo(null);
      setIsReconnecting(true);
      setMessages((prev) => [
        ...prev,
        {
          type: 'system',
          message: `連接斷開：${reason}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    const handleMessageToClient = (data: ChatMessageData) => {
      setMessages((prev) => [
        ...prev,
        {
          type: 'broadcast',
          message: data.message,
          from: data.from,
          timestamp: data.timestamp,
        },
      ]);
    };

    const handlePrivateMessage = (data: ChatMessageData) => {
      setMessages(prev => [...prev, {
        type: 'private',
        message: data.message,
        from: data.from,
        timestamp: data.timestamp,
      }]);
    };

    const handleUserJoined = (data: RoomEventData) => {
      setMessages(prev => [...prev, {
        type: 'room',
        message: `${data.userId} 加入了房間 ${data.roomName}`,
        timestamp: data.timestamp,
      }]);
    };

    const handleUserLeft = (data: RoomEventData) => {
      setMessages(prev => [...prev, {
        type: 'room',
        message: `${data.userId} 離開了房間 ${data.roomName}`,
        timestamp: data.timestamp,
      }]);
    };

    // 註冊事件監聽器
    socket.on('welcome', handleWelcome);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('messageToClient', handleMessageToClient);
    socket.on('privateMessageReceived', handlePrivateMessage);
    socket.on('userJoined', handleUserJoined);
    socket.on('userLeft', handleUserLeft);

    socket.connect();

    // 清理函數：移除所有事件監聽器
    return () => {
      socket.off('welcome', handleWelcome);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('messageToClient', handleMessageToClient);
      socket.off('privateMessageReceived', handlePrivateMessage);
      socket.off('userJoined', handleUserJoined);
      socket.off('userLeft', handleUserLeft);
      socket.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (inputMessage.trim()) {
      // 只發送到伺服器，不在前端預先顯示
      // 等伺服器廣播回來再統一顯示，避免重複
      socket.emit('messageToServer', inputMessage);
      setInputMessage('');
    }
  };

  const sendPrivateMessage = () => {
    if (inputMessage.trim() && privateMessageTarget) {
      // 發送私人訊息，等伺服器處理後再顯示
      socket.emit('privateMessage', {
        targetId: privateMessageTarget,
        message: inputMessage,
      });
      setInputMessage('');
    }
  };

  const joinRoom = () => {
    if (currentRoom.trim()) {
      socket.emit('joinRoom', currentRoom);
    }
  };

  const leaveRoom = () => {
    if (currentRoom.trim()) {
      socket.emit('leaveRoom', currentRoom);
    }
  };

  const getMessageStyle = (type: Message['type']): string => {
    switch (type) {
      case 'system':
        return 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 border-l-4 border-orange-400 text-orange-200 backdrop-blur-sm';
      case 'private':
        return 'bg-gradient-to-r from-purple-500/20 to-violet-500/20 border-l-4 border-purple-400 text-purple-200 backdrop-blur-sm';
      case 'room':
        return 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-l-4 border-green-400 text-green-200 backdrop-blur-sm';
      default:
        return 'bg-gray-800/60 backdrop-blur-sm border border-gray-700/60 text-gray-200';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 左側：連接狀態和控制 */}
      <div className="lg:col-span-1 space-y-6">
        {/* 連接狀態 */}
        <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-100">連接狀態</h3>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              isConnected 
                ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                : isReconnecting
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-400' : isReconnecting ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'
              }`}></div>
              {isConnected ? '已連接' : isReconnecting ? `重連中... (${reconnectAttempts})` : '未連接'}
            </div>
          </div>
          
          {connectionInfo && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">ID</span>
                <code className="text-gray-200 bg-gray-700/50 px-2 py-1 rounded text-xs font-mono">
                  {connectionInfo.id.slice(0, 8)}...
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">傳輸</span>
                <span className="text-gray-200 font-medium">{connectionInfo.transport}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">WebSocket</span>
                <span className={connectionInfo.upgraded ? 'text-green-400' : 'text-orange-400'}>
                  {connectionInfo.upgraded ? '已升級' : '未升級'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 房間管理 */}
        <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 shadow-lg">
          <h3 className="text-lg font-medium text-gray-100 mb-4">房間管理</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={currentRoom}
              onChange={(e) => setCurrentRoom(e.target.value)}
              placeholder="房間名稱"
              className="w-full px-3 py-2 bg-gray-700/80 backdrop-blur-sm border border-gray-600/50 rounded-lg text-sm text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 shadow-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={joinRoom}
                disabled={!currentRoom.trim()}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
              >
                加入
              </button>
              <button
                onClick={leaveRoom}
                disabled={!currentRoom.trim()}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm font-medium rounded-lg hover:from-gray-700 hover:to-gray-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
              >
                離開
              </button>
            </div>
          </div>
        </div>

        {/* 私人訊息 */}
        <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 shadow-lg">
          <h3 className="text-lg font-medium text-gray-100 mb-4">私人訊息</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={privateMessageTarget}
              onChange={(e) => setPrivateMessageTarget(e.target.value)}
              placeholder="目標用戶 ID"
              className="w-full px-3 py-2 bg-gray-700/80 backdrop-blur-sm border border-gray-600/50 rounded-lg text-sm text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 shadow-sm"
            />
            <button
              onClick={sendPrivateMessage}
              disabled={!privateMessageTarget.trim() || !inputMessage.trim()}
              className="w-full px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-purple-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
            >
              發送私人訊息
            </button>
          </div>
        </div>
      </div>

      {/* 右側：聊天區域 */}
      <div className="lg:col-span-2 bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-lg flex flex-col h-[600px]">
        {/* 聊天標題 */}
        <div className="p-5 border-b border-gray-700/50">
          <h3 className="text-lg font-medium text-gray-100">聊天訊息</h3>
        </div>
        
        {/* 訊息區域 */}
        <div className="flex-1 overflow-y-auto p-5">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-gray-700/50 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-400">尚無訊息</p>
                <p className="text-xs text-gray-500 mt-1">開始與其他用戶聊天吧！</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, index) => (
                <div key={index} className={`p-3 rounded-lg ${getMessageStyle(msg.type)}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-xs">
                      {msg.type === 'private' && <span>🔒</span>}
                      {msg.type === 'room' && <span>🏠</span>}
                      {msg.type === 'system' && <span>ℹ️</span>}
                      {msg.type === 'broadcast' && <span>📢</span>}
                      {msg.from && <span className="font-medium">{msg.from}</span>}
                    </div>
                    <span className="text-xs opacity-60">
                      {msg.timestamp && new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{msg.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* 輸入區域 */}
        <div className="p-5 border-t border-gray-700/50">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="輸入訊息..."
              className="flex-1 px-4 py-2.5 bg-gray-700/90 backdrop-blur-sm border border-gray-600/50 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 shadow-sm"
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
            >
              發送
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}