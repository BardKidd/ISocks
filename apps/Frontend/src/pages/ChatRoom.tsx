import { withPageAccess } from '@/components/PageAccess';
import Chat from '@/components/Chat';

const ChatRoom = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900 text-gray-100">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-gray-100">
              Socket.IO 聊天室
            </h1>
          </div>
          <p className="text-gray-400 text-sm">
            即時通訊 • 房間管理 • 私人訊息
          </p>
        </div>
        <Chat />
      </div>
    </div>
  );
};

const WrappedChatRoom = withPageAccess('C01')(ChatRoom);

export default WrappedChatRoom;
