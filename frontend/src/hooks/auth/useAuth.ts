import { trpc } from '@/lib/trpc';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const useCurrentUser = () => {
  return trpc.auth.profile.useQuery(undefined, {
    staleTime: Infinity,
    retry: false,
  });
};

export const useLogin = () => {
  const navigate = useNavigate();
  const utils = trpc.useContext();
  
  return trpc.auth.login.useMutation({
    onSuccess: () => {
      // Invalidate and refetch the profile query to update the navbar
      void utils.auth.profile.invalidate();
      toast.success('Welcome back!');
      void navigate('/');
    },
  });
};

export const useSignup = () => {
  const navigate = useNavigate();
  const utils = trpc.useContext();
  
  return trpc.auth.signup.useMutation({
    onSuccess: () => {
      // Invalidate and refetch the profile query to update the navbar
      void utils.auth.profile.invalidate();
      toast.success('Account created successfully!');
      void navigate('/');
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const utils = trpc.useContext();
  
  return trpc.auth.logout.useMutation({
    onSuccess: () => {
      // Clear all auth-related queries
      void utils.auth.profile.reset();
      void queryClient.removeQueries({ queryKey: ['cart'] });
      void navigate('/login');
      toast.success('Logged out successfully');
    },
  });
};