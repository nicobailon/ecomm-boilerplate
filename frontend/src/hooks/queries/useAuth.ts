import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { User } from '@/types';
import { LoginInput, SignupInput } from '@/lib/validations';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get<User>('/auth/profile');
        return data;
      } catch (error: any) {
        if (error.response?.status === 401) {
          return null;
        }
        throw error;
      }
    },
    staleTime: Infinity, // User data doesn't go stale
    retry: false, // Don't retry 401 errors
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (credentials: LoginInput) => {
      const { data } = await apiClient.post<User>('/auth/login', credentials);
      return data;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['user'], user);
      toast.success('Welcome back!');
      navigate('/');
    },
  });
};

export const useSignup = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (userData: SignupInput) => {
      const { data } = await apiClient.post<User>('/auth/signup', userData);
      return data;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['user'], user);
      toast.success('Account created successfully!');
      navigate('/');
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout');
    },
    onSuccess: () => {
      // Remove only user-specific data, keep public data like products
      queryClient.removeQueries({ queryKey: ['user'] });
      queryClient.removeQueries({ queryKey: ['cart'] });
      navigate('/login');
      toast.success('Logged out successfully');
    },
  });
};