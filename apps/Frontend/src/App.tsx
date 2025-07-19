import React, { useState } from 'react';
import { AbilityContext, AuthProvider } from './contexts';
import defineAbilityFor from './utility/defineAbilityFor';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import UserPermissions from './mock/permission';
import { Toaster } from '@/components/ui/sonner';

const App: React.FC = () => {
  const [userPermissions] = useState(UserPermissions);
  return (
    <BrowserRouter>
      <AuthProvider>
        <AbilityContext.Provider value={defineAbilityFor(userPermissions)}>
          <AppRoutes />
          <Toaster />
        </AbilityContext.Provider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;