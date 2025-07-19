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

// 註冊表單驗證 schema
const registerSchema = z.object({
  name: z.string().min(1, '姓名為必填欄位'),
  email: z.string().email('請輸入有效的電子郵件格式'),
  password: z.string().min(8, '密碼至少需要8個字元'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: '密碼確認不符',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // 已登入用戶重導向到主頁面
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // 處理 email 重複錯誤 (後端回傳 401 但訊息為 "Email already exists")
        if (response.status === 401 && errorData.message === 'Email already exists') {
          setErrorMessage('此電子郵件已被註冊，請使用其他電子郵件');
        } else {
          setErrorMessage(errorData.message || '註冊失敗，請稍後再試');
        }
        return;
      }

      // 註冊成功，顯示 toast 並跳轉到登入頁面
      toast.success('註冊成功！即將跳轉到登入頁面', {
        duration: 3000,
      });
      
      // 延遲跳轉讓用戶看到成功訊息
      setTimeout(() => {
        navigate('/login');
      }, 1500);

    } catch (error) {
      console.error('註冊錯誤:', error);
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
        {/* 主要註冊卡片 */}
        <div className="rounded-2xl p-8 shadow-2xl backdrop-blur-md border bg-coffee-medium/80 border-coffee-light/30">
          {/* 標題區塊 */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl bg-gradient-to-br from-muted-orange to-warm-yellow shadow-lg">
                ☕
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-3 text-warm-yellow">
              加入我們
            </h1>
            <p className="text-base text-coffee-text/80">
              建立新帳號開始聊天
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

          {/* 註冊表單 */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 姓名欄位 */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-warm-yellow">
                      姓名
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="請輸入您的姓名"
                        disabled={isLoading}
                        className="h-12 bg-coffee-light/30 border-coffee-light/50 text-coffee-text placeholder:text-coffee-text-muted focus:border-warm-yellow focus:ring-warm-yellow/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

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
                        placeholder="請輸入密碼 (至少8個字元)"
                        disabled={isLoading}
                        className="h-12 bg-coffee-light/30 border-coffee-light/50 text-coffee-text placeholder:text-coffee-text-muted focus:border-warm-yellow focus:ring-warm-yellow/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              {/* 確認密碼欄位 */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-warm-yellow">
                      確認密碼
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="請再次輸入密碼"
                        disabled={isLoading}
                        className="h-12 bg-coffee-light/30 border-coffee-light/50 text-coffee-text placeholder:text-coffee-text-muted focus:border-warm-yellow focus:ring-warm-yellow/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              {/* 註冊按鈕 */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 font-semibold text-lg transition-all duration-300 hover:shadow-xl bg-gradient-to-r from-muted-orange to-warm-yellow text-coffee-dark border-none hover:from-muted-orange/90 hover:to-warm-yellow/90 transform hover:scale-[1.02]"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-coffee-dark border-t-transparent rounded-full animate-spin mr-3" />
                    註冊中...
                  </div>
                ) : (
                  '建立帳號'
                )}
              </Button>
            </form>
          </Form>

          {/* 登入連結 */}
          <div className="mt-8 text-center">
            <p className="text-base text-coffee-text/70">
              已經有帳號了？{' '}
              <Link
                to="/login"
                className="font-semibold hover:underline transition-all duration-200 text-warm-yellow hover:text-muted-orange"
              >
                立即登入
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;