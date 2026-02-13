import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Button,
  HStack,
  VStack,
  Text,
  useToast,
  Spinner,
  Center,
  Badge,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { Appointment } from '../types';
import { appointmentService } from '../services/appointment.service';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function PatientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await appointmentService.list({
        patientId: user.id,
        tenantId: user.tenantId,
      });
      setAppointments(data);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar consultas',
        description: error.response?.data?.message || 'Tente novamente',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'green';
      case 'CANCELLED':
        return 'red';
      case 'COMPLETED':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'Agendada';
      case 'CANCELLED':
        return 'Cancelada';
      case 'COMPLETED':
        return 'Concluída';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" boxShadow="sm" py={4}>
        <Container maxW="container.xl">
          <HStack justify="space-between">
            <Heading size="md">Remarca - Paciente</Heading>
            <HStack>
              <Text>{user?.name}</Text>
              <Button onClick={handleLogout} variant="outline" size="sm">
                Sair
              </Button>
            </HStack>
          </HStack>
        </Container>
      </Box>

      {/* Content */}
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <HStack justify="space-between">
            <Heading size="lg">Minhas Consultas</Heading>
            <Button colorScheme="blue" size="lg">
              Agendar Nova Consulta
            </Button>
          </HStack>

          {appointments.length === 0 ? (
            <Box p={12} bg="white" borderRadius="lg" textAlign="center">
              <Text fontSize="lg" color="gray.500" mb={4}>
                Você ainda não tem consultas agendadas
              </Text>
              <Button colorScheme="blue" size="lg">
                Agendar Primeira Consulta
              </Button>
            </Box>
          ) : (
            <VStack spacing={4} align="stretch">
              {appointments.map((appointment) => (
                <Box key={appointment.id} p={6} bg="white" borderRadius="lg" boxShadow="sm">
                  <HStack justify="space-between" mb={4}>
                    <VStack align="start" spacing={1}>
                      <HStack>
                        <Heading size="md">
                          {format(new Date(appointment.dateTime), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </Heading>
                        <Badge colorScheme={getStatusColor(appointment.status)}>
                          {getStatusText(appointment.status)}
                        </Badge>
                      </HStack>
                      <Text fontSize="lg" color="gray.600">
                        {format(new Date(appointment.dateTime), 'HH:mm')}
                      </Text>
                    </VStack>
                    {appointment.status === 'SCHEDULED' && (
                      <HStack>
                        <Button size="sm" variant="outline">
                          Reagendar
                        </Button>
                        <Button size="sm" colorScheme="red" variant="outline">
                          Cancelar
                        </Button>
                      </HStack>
                    )}
                  </HStack>
                  
                  <VStack align="start" spacing={2}>
                    <Text><strong>Profissional:</strong> {appointment.professionalId}</Text>
                    <Text><strong>Serviço:</strong> {appointment.productId}</Text>
                  </VStack>
                </Box>
              ))}
            </VStack>
          )}
        </VStack>
      </Container>
    </Box>
  );
}
