import React from 'react';
import { Routes, Route } from 'react-router-dom';
import About from './pages/About';
import Main from './pages/Main';
import MyFormStudy from './pages/Form';
import Unauthorized from './pages/Unauthorized';
import GeminiPage from './pages/GeminiPage';
import ChatRoom from './pages/ChatRoom';
import Register from './pages/Register';
import Login from './pages/Login';
import ProtectedLayout from './layouts/ProtectedLayout';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 認證頁面 - 直接路由，無 navbar */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      
      {/* 受保護的頁面 - 包在 ProtectedLayout 中，有 navbar */}
      <Route path="/" element={<ProtectedLayout />}>
        <Route index element={<Main />} />
        <Route path="about" element={<About />} />
        <Route path="form" element={<MyFormStudy />} />
        <Route path="gemini" element={<GeminiPage />} />
        <Route path="chatroom" element={<ChatRoom />} />
        <Route path="unauthorized" element={<Unauthorized />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;