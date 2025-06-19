import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { LoginInput} from '@/lib/validations';
import { loginSchema } from '@/lib/validations';
import { useLogin } from '@/hooks/auth/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const LoginForm: React.FC = () => {
  const login = useLogin();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginInput) => {
    login.mutate(data);
  };

  return (
    <form onSubmit={(...args) => void handleSubmit(onSubmit)(...args)} className="space-y-6" noValidate>
      <Input
        label="Email"
        type="email"
        {...register('email')}
        error={errors.email?.message}
      />
      
      <Input
        label="Password"
        type="password"
        {...register('password')}
        error={errors.password?.message}
      />
      
      <Button
        type="submit"
        className="w-full"
        isLoading={isSubmitting || login.isPending}
      >
        Sign In
      </Button>
    </form>
  );
};