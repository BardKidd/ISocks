import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 用戶介面定義
interface User {
  id: string;
  name: string;
  email: string;
}

// 認證上下文介面定義
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

// 創建認證上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider Props 介面
interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider 組件：提供認證狀態管理
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // JWT token 過期檢查函數
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      // 如果無法解析 token，視為過期
      return true;
    }
  };

  // 計算認證狀態（包含 token 過期檢查）
  const isAuthenticated = !!token && !!user && !isTokenExpired(token);

  // 初始化時從 localStorage 讀取認證資訊
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          // 檢查 token 是否過期
          if (isTokenExpired(storedToken)) {
            // Token 已過期，清除所有資料
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            console.log('Token 已過期，已自動登出');
          } else {
            // Token 仍有效，恢復認證狀態
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
          }
        }
      } catch (error) {
        console.error('初始化認證狀態時發生錯誤:', error);
        // 清除可能損壞的資料
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // 登出函數：清除所有認證資訊
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // 定期檢查 token 過期
  useEffect(() => {
    if (!token) return;

    const checkTokenExpiry = () => {
      if (isTokenExpired(token)) {
        console.log('Token 已過期，自動登出');
        logout();
      }
    };

    // 每分鐘檢查一次 token 是否過期
    const intervalId = setInterval(checkTokenExpiry, 60000);

    // 組件卸載時清除定時器
    return () => clearInterval(intervalId);
  }, [token]);

  // 登入函數：儲存 token 和用戶資訊
  const login = (newToken: string, newUser: User) => {
    try {
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
    } catch (error) {
      console.error('儲存認證資訊時發生錯誤:', error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth Hook：方便組件使用認證狀態
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth 必須在 AuthProvider 內部使用');
  }
  return context;
};