import { apiClient, ApiResponse, ApiListResponse } from '@/lib/api-client';

export interface UserRole {
  id: string;
  name: string;
  permissions: string[];
}

export interface UserRecord {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone?: string;
  roleId: string;
  isActive?: boolean;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  roleId?: string;
  isActive?: boolean;
}

export interface UsersListParams {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: string;
  isActive?: boolean;
}

export const usersService = {
  getUsers: async (params?: UsersListParams): Promise<ApiListResponse<UserRecord>> => {
    const response = await apiClient.get<ApiListResponse<UserRecord>>('/users', { params });
    return response.data;
  },

  getUser: async (id: string): Promise<UserRecord> => {
    const response = await apiClient.get<ApiResponse<UserRecord>>(`/users/${id}`);
    return response.data.data;
  },

  createUser: async (data: CreateUserRequest): Promise<UserRecord> => {
    const response = await apiClient.post<ApiResponse<UserRecord>>('/users', data);
    return response.data.data;
  },

  updateUser: async (id: string, data: UpdateUserRequest): Promise<UserRecord> => {
    const response = await apiClient.put<ApiResponse<UserRecord>>(`/users/${id}`, data);
    return response.data.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },

  getRoles: async (): Promise<UserRole[]> => {
    const response = await apiClient.get<ApiResponse<UserRole[]>>('/users/roles');
    return response.data.data;
  },
};
