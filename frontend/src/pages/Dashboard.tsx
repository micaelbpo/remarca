import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Center, Spinner, Text, VStack } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

export function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    console.log('User data:', user); // Debug

    // Redirect based on user type
    if (user.userType === 'PROFESSIONAL') {
      navigate('/professional/dashboard', { replace: true });
    } else if (user.userType === 'PATIENT') {
      navigate('/patient/dashboard', { replace: true });
    } else if (user.userType === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    } else {
      // If userType is missing, show error
      console.error('User type not found:', user);
    }
  }, [user, loading, navigate]);

  return (
    <Center h="100vh">
      <VStack>
        <Spinner size="xl" />
        <Text mt={4}>Carregando...</Text>
      </VStack>
    </Center>
  );
}
