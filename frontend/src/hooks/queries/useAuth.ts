import { trpc } from '@/lib/trpc';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const useCurrentUser = () => {
  return trpc.auth.profile.useQuery(undefined, {
    staleTime: Infinity,
    retry: false,
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  return trpc.auth.login.useMutation({
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
  
  return trpc.auth.signup.useMutation({
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
  
  return trpc.auth.logout.useMutation({
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['user'] });
      queryClient.removeQueries({ queryKey: ['cart'] });
      navigate('/login');
      toast.success('Logged out successfully');
    },
  });
};