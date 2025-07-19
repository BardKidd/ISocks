import React, { useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { PermissionLink } from '@/components/PermissionLink';
import { useAuth } from '@/contexts';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * ProtectedLayout - 用於需要認證和權限的頁面
 * 特點：包含 navbar，需要登入才能訪問
 * 功能：檢查認證狀態，未登入時自動跳轉到登入頁面
 */
const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const navigate = useNavigate();

  // 檢查認證狀態，未登入時跳轉到登入頁面
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // 載入中顯示 Skeleton 載入畫面
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        {/* Navigation Bar Skeleton */}
        <nav className="flex gap-4 justify-center items-center py-4 bg-gray-950 shadow-xl px-4">
          <Skeleton className="h-10 w-32 rounded-full bg-gray-800" />
          <Skeleton className="h-10 w-32 rounded-full bg-gray-800" />
          <Skeleton className="h-10 w-32 rounded-full bg-gray-800" />
          <Skeleton className="h-10 w-32 rounded-full bg-gray-800" />
          <Skeleton className="h-10 w-32 rounded-full bg-gray-800" />
        </nav>
        
        {/* Main Content Skeleton */}
        <main className="flex-grow w-full p-8">
          <div className="max-w-4xl mx-auto space-y-4">
            <Skeleton className="h-8 w-3/4 bg-gray-300" />
            <Skeleton className="h-4 w-full bg-gray-300" />
            <Skeleton className="h-4 w-5/6 bg-gray-300" />
            <Skeleton className="h-32 w-full bg-gray-300 mt-6" />
          </div>
        </main>
      </div>
    );
  }

  // 未認證時不渲染內容（等待跳轉）
  if (!isAuthenticated) {
    return null;
  }

  // 登出處理
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation Bar */}
      <nav className="flex justify-between items-center py-4 bg-gray-950 shadow-xl px-4">
        {/* 導航連結區域 */}
        <div className="flex gap-4 justify-center items-center flex-grow">
          <PermissionLink
            to="/"
            subject="A01"
            className="px-6 py-2 rounded-full bg-gray-800 text-blue-300 hover:bg-gray-700 hover:text-blue-200 font-semibold transition duration-150 w-32 text-center cursor-pointer"
          >
            Main
          </PermissionLink>
          <PermissionLink
            to="/about"
            subject="B01"
            className="px-6 py-2 rounded-full bg-gray-800 text-purple-300 hover:bg-gray-700 hover:text-purple-200 font-semibold transition duration-150 w-32 text-center cursor-pointer"
          >
            About
          </PermissionLink>
          <Link
            to="/form"
            className="px-6 py-2 rounded-full bg-gray-800 text-cyan-300 hover:bg-gray-700 hover:text-cyan-200 font-semibold transition duration-150 w-32 text-center cursor-pointer"
          >
            Form
          </Link>
          <PermissionLink
            to="/gemini"
            subject="C01"
            className="px-6 py-2 rounded-full bg-gray-800 text-green-300 hover:bg-gray-700 hover:text-green-200 font-semibold transition duration-150 w-32 text-center cursor-pointer"
          >
            Gemini
          </PermissionLink>
          <PermissionLink
            to="/chatroom"
            subject="C01"
            className="px-6 py-2 rounded-full bg-gray-800 text-amber-300 hover:bg-gray-700 hover:text-amber-200 font-semibold transition duration-150 w-32 text-center cursor-pointer"
          >
            聊天室
          </PermissionLink>
        </div>

        {/* 用戶資訊與登出區域 */}
        <div className="flex items-center gap-4">
          {/* 用戶資訊 */}
          <div className="text-gray-300 text-sm">
            <span className="text-gray-500">歡迎, </span>
            <span className="text-blue-400 font-semibold">{user?.name}</span>
          </div>
          
          {/* 登出按鈕 */}
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 font-semibold transition duration-150 cursor-pointer"
          >
            登出
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedLayout;