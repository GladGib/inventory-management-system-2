import { apiClient, ApiResponse } from '@/lib/api-client';
import {
  LoginRequest,
  LoginResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '@/types';

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data);
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  refreshToken: async (): Promise<{ accessToken: string }> => {
    const response = await apiClient.post<ApiResponse<{ accessToken: string }>>('/auth/refresh');
    return response.data.data;
  },

  forgotPassword: async (data: ForgotPasswordRequest): Promise<void> => {
    await apiClient.post('/auth/forgot-password', data);
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<void> => {
    await apiClient.post('/auth/reset-password', data);
  },
};
