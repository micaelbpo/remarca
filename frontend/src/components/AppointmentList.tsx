import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  useToast,
  Spinner,
  Center,
  Select,
} from '@chakra-ui/react';
import { appointmentService } from '../services/appointment.service';
import type { Appointment } from '../types';

interface AppointmentListProps {
  tenantId: string;
  userId: string;
  userType: 'PROFESSIONAL' | 'PATIENT';
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'blue',
  CONFIRMED: 'green',
  CANCELLED: 'red',
  COMPLETED: 'gray',
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Agendada',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Concluída',
};

export function AppointmentList({ tenantId, userId, userType }: AppointmentListProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const toast = useToast();

  useEffect(() => {
    loadAppointments();
  }, [statusFilter]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const filters: any = { tenantId };
      
      if (userType === 'PROFESSIONAL') {
        filters.professionalId = userId;
      } else {
        filters.patientId = userId;
      }
      
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      const data = await appointmentService.list(filters);
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

  const handleCancel = async (appointmentId: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta consulta?')) return;

    try {
      await appointmentService.cancel(appointmentId, tenantId);
      toast({
        title: 'Consulta cancelada',
        status: 'success',
        duration: 3000,
      });
      loadAppointments();
    } catch (error: any) {
      toast({
        title: 'Erro ao cancelar consulta',
        description: error.response?.data?.message || 'Tente novamente',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Center py={8}>
        <Spinner size="lg" />
      </Center>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <HStack>
        <Text fontWeight="bold">Filtrar por status:</Text>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          maxW="200px"
          size="sm"
        >
          <option value="all">Todos</option>
          <option value="SCHEDULED">Agendadas</option>
          <option value="CONFIRMED">Confirmadas</option>
          <option value="CANCELLED">Canceladas</option>
          <option value="COMPLETED">Concluídas</option>
        </Select>
      </HStack>

      {appointments.length === 0 ? (
        <Box p={8} bg="white" borderRadius="lg" textAlign="center">
          <Text color="gray.500">Nenhuma consulta encontrada</Text>
        </Box>
      ) : (
        <VStack spacing={3} align="stretch">
          {appointments.map((appointment) => (
            <Box
              key={appointment.id}
              p={4}
              bg="white"
              borderRadius="lg"
              boxShadow="sm"
              borderWidth={1}
              borderColor="gray.200"
            >
              <HStack justify="space-between" align="start">
                <VStack align="start" spacing={2} flex={1}>
                  <HStack>
                    <Text fontWeight="bold" fontSize="lg">
                      {formatDate(appointment.startTime || appointment.dateTime)} às {formatTime(appointment.startTime || appointment.dateTime)}
                    </Text>
                    <Badge colorScheme={STATUS_COLORS[appointment.status]}>
                      {STATUS_LABELS[appointment.status]}
                    </Badge>
                  </HStack>

                  <Text fontSize="sm" color="gray.600">
                    <strong>Serviço:</strong> {appointment.productName || appointment.productId}
                  </Text>

                  {userType === 'PROFESSIONAL' ? (
                    <Text fontSize="sm" color="gray.600">
                      <strong>Paciente:</strong> {appointment.patientName || appointment.patientId}
                    </Text>
                  ) : (
                    <Text fontSize="sm" color="gray.600">
                      <strong>Profissional:</strong> {appointment.professionalName || appointment.professionalId}
                    </Text>
                  )}

                  {appointment.durationMinutes && (
                    <Text fontSize="sm" color="gray.600">
                      <strong>Duração:</strong> {appointment.durationMinutes} minutos
                    </Text>
                  )}

                  {appointment.notes && (
                    <Text fontSize="sm" color="gray.600">
                      <strong>Observações:</strong> {appointment.notes}
                    </Text>
                  )}
                </VStack>

                {appointment.status === 'SCHEDULED' && (
                  <VStack>
                    <Button
                      size="sm"
                      colorScheme="red"
                      variant="outline"
                      onClick={() => handleCancel(appointment.id)}
                    >
                      Cancelar
                    </Button>
                  </VStack>
                )}
              </HStack>
            </Box>
          ))}
        </VStack>
      )}
    </VStack>
  );
}
