import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Center, Spinner, Text, VStack, Button, Box } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

export function Dashboard() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    console.log('User data:', user); // Debug

    // Check if user has required fields
    if (!user.userType || !user.tenantId) {
      console.error('User missing required fields:', user);
      return; // Don't navigate, show error message
    }

    // Redirect based on user type
    if (user.userType === 'PROFESSIONAL') {
      navigate('/professional/dashboard', { replace: true });
    } else if (user.userType === 'PATIENT') {
      navigate('/patient/dashboard', { replace: true });
    } else if (user.userType === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  // Show error if user data is incomplete
  if (user && (!user.userType || !user.tenantId)) {
    return (
      <Center h="100vh">
        <Box textAlign="center">
          <VStack spacing={4}>
            <Text fontSize="xl" color="red.500">
              Dados do usuário incompletos
            </Text>
            <Text color="gray.600">
              Por favor, faça logout e login novamente
            </Text>
            <Button
              colorScheme="blue"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              Fazer Logout e Login Novamente
            </Button>
          </VStack>
        </Box>
      </Center>
    );
  }

  return (
    <Center h="100vh">
      <VStack>
        <Spinner size="xl" />
        <Text mt={4}>Carregando...</Text>
      </VStack>
    </Center>
  );
}
