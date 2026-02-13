import {
  Box,
  Container,
  Heading,
  Button,
  HStack,
  VStack,
  Text,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box minH="100vh" bg="gray.50">
      <Box bg="white" boxShadow="sm" py={4}>
        <Container maxW="container.xl">
          <HStack justify="space-between">
            <Heading size="md">Remarca</Heading>
            <HStack>
              <Text>{user?.name}</Text>
              <Button onClick={handleLogout} variant="outline" size="sm">
                Sair
              </Button>
            </HStack>
          </HStack>
        </Container>
      </Box>

      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Heading>
            Bem-vindo, {user?.name}!
          </Heading>
          
          <Box p={6} bg="white" borderRadius="lg" boxShadow="sm">
            <VStack align="start" spacing={2}>
              <Text><strong>Email:</strong> {user?.email}</Text>
              <Text><strong>Tipo:</strong> {user?.userType}</Text>
              <Text><strong>Tenant ID:</strong> {user?.tenantId}</Text>
            </VStack>
          </Box>

          {user?.userType === 'PROFESSIONAL' && (
            <Box p={6} bg="blue.50" borderRadius="lg">
              <Heading size="md" mb={4}>Área do Profissional</Heading>
              <Text>Em breve: Gerenciar disponibilidade, serviços e consultas</Text>
            </Box>
          )}

          {user?.userType === 'PATIENT' && (
            <Box p={6} bg="green.50" borderRadius="lg">
              <Heading size="md" mb={4}>Área do Paciente</Heading>
              <Text>Em breve: Agendar consultas e visualizar histórico</Text>
            </Box>
          )}
        </VStack>
      </Container>
    </Box>
  );
}
