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
      toast.success('Account created successfully! Please verify your email.');
      void navigate('/email-verification-sent');
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

export const useForgotPassword = () => {
  return trpc.auth.forgotPassword.useMutation({
    onSuccess: () => {
      toast.success('Check your email for reset instructions');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send reset email');
    },
  });
};

export const useResetPassword = () => {
  const navigate = useNavigate();
  
  return trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      toast.success('Password reset successfully');
      void navigate('/login');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reset password');
    },
  });
};

export const useVerifyEmail = () => {
  const utils = trpc.useContext();
  
  return trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      toast.success('Email verified successfully!');
      void utils.auth.profile.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to verify email');
    },
  });
};

export const useResendVerification = () => {
  return trpc.auth.resendVerification.useMutation({
    onSuccess: () => {
      toast.success('Verification email sent');
    },
    onError: (error) => {
      if (error.message.includes('rate limit')) {
        toast.error('Please wait before requesting another email');
      } else {
        toast.error(error.message || 'Failed to send verification email');
      }
    },
  });
};