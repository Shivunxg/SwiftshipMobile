import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from './api';
import type { AuthResponse } from './types';

interface AuthState extends Omit<AuthResponse, 'token'> {
  token: string | null;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  token: null,
  role: '',
  userId: 0,
  tenantId: 0,
  name: '',
  companyName: '',
  walletBalance: 0,
  hydrated: false,

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync('swiftship_token');
      const meta  = await SecureStore.getItemAsync('swiftship_meta');
      if (token && meta) {
        set({ token, ...JSON.parse(meta), hydrated: true });
        return;
      }
    } catch (e) {}
    set({ hydrated: true });
  },

  login: async (email, password) => {
    const { data } = await api.post<AuthResponse>('/api/auth/login', { email, password });
    await SecureStore.setItemAsync('swiftship_token', data.token);
    const meta = { role: data.role, userId: data.userId, tenantId: data.tenantId, name: data.name, companyName: data.companyName, walletBalance: data.walletBalance };
    await SecureStore.setItemAsync('swiftship_meta', JSON.stringify(meta));
    set({ token: data.token, ...meta });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('swiftship_token');
    await SecureStore.deleteItemAsync('swiftship_meta');
    set({ token: null, userId: 0, tenantId: 0, name: '', companyName: '', walletBalance: 0 });
  },
}));
