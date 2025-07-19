import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// 登入表單驗證 schema
const loginSchema = z.object({
  email: z.string().email('請輸入有效的電子郵件格式'),
  password: z.string().min(1, '密碼為必填欄位'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // 已登入用戶重導向到主頁面
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // 處理登入失敗錯誤
        if (response.status === 401) {
          setErrorMessage('帳號或密碼錯誤，請重新輸入');
        } else {
          setErrorMessage(errorData.message || '登入失敗，請稍後再試');
        }
        return;
      }

      const result = await response.json();
      
      // 檢查 API 回應格式
      if (result.data && result.data.access_token && result.data.user) {
        // 儲存 JWT Token 和用戶資訊到 AuthContext
        login(result.data.access_token, result.data.user);
        
        // 登入成功，顯示 toast 並跳轉到主頁面
        toast.success('登入成功！歡迎回來', {
          duration: 2000,
        });
        
        // 跳轉到主頁面
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        // API 回應格式不正確
        setErrorMessage('伺服器回應格式錯誤，請聯絡系統管理員');
        console.error('Invalid API response format:', result);
      }

    } catch (error) {
      console.error('登入錯誤:', error);
      setErrorMessage('網路錯誤，請檢查您的網路連線');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-coffee-dark via-coffee-dark to-coffee-medium">
      {/* 背景裝飾效果 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-40 h-40 rounded-full opacity-20 bg-warm-yellow blur-xl" />
        <div className="absolute bottom-20 right-20 w-56 h-56 rounded-full opacity-15 bg-muted-orange blur-2xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-5 bg-coffee-light blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* 主要登入卡片 */}
        <div className="rounded-2xl p-8 shadow-2xl backdrop-blur-md border bg-coffee-medium/80 border-coffee-light/30">
          {/* 標題區塊 */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl bg-gradient-to-br from-muted-orange to-warm-yellow shadow-lg">
                ☕
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-3 text-warm-yellow">
              登入帳號
            </h1>
            <p className="text-base text-coffee-text/80">
              輸入您的帳號資訊開始聊天
            </p>
          </div>

          {/* 錯誤訊息 */}
          {errorMessage && (
            <div 
              className="mb-6 p-3 rounded-lg text-sm text-center border"
              style={{ 
                backgroundColor: '#dc2626', 
                color: '#fef2f2',
                borderColor: '#fca5a5'
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* 登入表單 */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 電子郵件欄位 */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-warm-yellow">
                      電子郵件
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="請輸入您的電子郵件"
                        disabled={isLoading}
                        className="h-12 bg-coffee-light/30 border-coffee-light/50 text-coffee-text placeholder:text-coffee-text-muted focus:border-warm-yellow focus:ring-warm-yellow/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              {/* 密碼欄位 */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-warm-yellow">
                      密碼
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="請輸入您的密碼"
                        disabled={isLoading}
                        className="h-12 bg-coffee-light/30 border-coffee-light/50 text-coffee-text placeholder:text-coffee-text-muted focus:border-warm-yellow focus:ring-warm-yellow/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              {/* 登入按鈕 */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 font-semibold text-lg transition-all duration-300 hover:shadow-xl bg-gradient-to-r from-muted-orange to-warm-yellow text-coffee-dark border-none hover:from-muted-orange/90 hover:to-warm-yellow/90 transform hover:scale-[1.02]"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-coffee-dark border-t-transparent rounded-full animate-spin mr-3" />
                    登入中...
                  </div>
                ) : (
                  '登入'
                )}
              </Button>
            </form>
          </Form>

          {/* 註冊連結 */}
          <div className="mt-8 text-center">
            <p className="text-base text-coffee-text/70">
              還沒有帳號？{' '}
              <Link
                to="/register"
                className="font-semibold hover:underline transition-all duration-200 text-warm-yellow hover:text-muted-orange"
              >
                立即註冊
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;