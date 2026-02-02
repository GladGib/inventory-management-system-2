'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { App } from 'antd';
import { useAuthStore } from '@/stores/auth-store';
import { authService } from '@/services/auth-service';
import { LoginRequest, ForgotPasswordRequest, ResetPasswordRequest } from '@/types';

export function useLogin() {
  const { message } = App.useApp();
  const login = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (data) => {
      login(data.user, data.accessToken);
      message.success('Login successful');
      // Use window.location for a full page reload to ensure state is properly hydrated
      window.location.href = '/dashboard';
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Login failed');
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const { message } = App.useApp();
  const logout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      logout();
      message.success('Logged out successfully');
      router.push('/login');
    },
    onError: () => {
      logout();
      router.push('/login');
    },
  });
}

export function useForgotPassword() {
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) => authService.forgotPassword(data),
    onSuccess: () => {
      message.success('Password reset link sent to your email');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to send reset link');
    },
  });
}

export function useResetPassword() {
  const router = useRouter();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => authService.resetPassword(data),
    onSuccess: () => {
      message.success('Password reset successful. Please login.');
      router.push('/login');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to reset password');
    },
  });
}
