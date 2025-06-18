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
  const navigate = useNavigate();
  const utils = trpc.useContext();
  
  return trpc.auth.login.useMutation({
    onSuccess: () => {
      // Invalidate and refetch the profile query to update the navbar
      utils.auth.profile.invalidate();
      toast.success('Welcome back!');
      navigate('/');
    },
  });
};

export const useSignup = () => {
  const navigate = useNavigate();
  const utils = trpc.useContext();
  
  return trpc.auth.signup.useMutation({
    onSuccess: () => {
      // Invalidate and refetch the profile query to update the navbar
      utils.auth.profile.invalidate();
      toast.success('Account created successfully!');
      navigate('/');
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
      utils.auth.profile.reset();
      queryClient.removeQueries({ queryKey: ['cart'] });
      navigate('/login');
      toast.success('Logged out successfully');
    },
  });
};