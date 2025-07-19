import { createContext, useContext } from 'react';

export const AbilityContext = createContext(null);
export const useAbility = () => useContext(AbilityContext);

// 匯出認證相關
export { AuthProvider, useAuth } from './AuthContext';
