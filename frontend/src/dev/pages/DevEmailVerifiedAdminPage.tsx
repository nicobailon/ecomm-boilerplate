import { useNavigate } from 'react-router-dom';
import EmailVerifiedSuccess from '@/components/auth/EmailVerifiedSuccess';

const DevEmailVerifiedAdminPage: React.FC = () => {
  const navigate = useNavigate();
  
  const handleRedirect = () => {
    void navigate('/secret-dashboard');
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800">Development Mode</h3>
        <p className="text-sm text-yellow-700">
          This is a development-only preview of the email verification success page for admins.
        </p>
      </div>
      
      <EmailVerifiedSuccess
        role="admin"
        onCountdownFinish={handleRedirect}
        showCountdown={false}
      />
    </div>
  );
};

export default DevEmailVerifiedAdminPage;