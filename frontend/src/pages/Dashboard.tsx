import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Center, Spinner } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    // Redirect based on user type
    if (user.userType === 'PROFESSIONAL') {
      navigate('/professional/dashboard', { replace: true });
    } else if (user.userType === 'PATIENT') {
      navigate('/patient/dashboard', { replace: true });
    } else if (user.userType === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, navigate]);

  return (
    <Center h="100vh">
      <Spinner size="xl" />
    </Center>
  );
}
