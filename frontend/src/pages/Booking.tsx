import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Button,
  HStack,
  VStack,
  Text,
  Select,
  SimpleGrid,
  useToast,
  Spinner,
  Center,
  Badge,
  Textarea,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { professionalService } from '../services/professional.service';
import { productService } from '../services/product.service';
import { appointmentService } from '../services/appointment.service';
import type { Professional, Product } from '../types';

interface AvailableSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export function Booking() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<string>('');
  const [services, setServices] = useState<Product[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    loadProfessionals();
  }, []);

  useEffect(() => {
    if (selectedProfessional) {
      loadServices();
    }
  }, [selectedProfessional]);

  useEffect(() => {
    if (selectedProfessional && selectedService && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedProfessional, selectedService, selectedDate]);

  const loadProfessionals = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // For MVP, we'll list all professionals in the tenant
      // In production, you'd want pagination and search
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/professionals?tenantId=${user.tenantId}`
      );
      const data = await response.json();
      setProfessionals(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar profissionais',
        description: 'Tente novamente',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    if (!user) return;

    try {
      const data = await productService.list(user.tenantId, selectedProfessional, true);
      setServices(data);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar serviços',
        description: 'Tente novamente',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const loadAvailableSlots = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/availability?` +
        `tenantId=${user.tenantId}&` +
        `professionalId=${selectedProfessional}&` +
        `productId=${selectedService}&` +
        `date=${selectedDate}`
      );
      const data = await response.json();
      setAvailableSlots(data.slots || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar horários',
        description: 'Tente novamente',
        status: 'error',
        duration: 5000,
      });
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!user || !selectedProfessional || !selectedService || !selectedSlot) return;

    setBookingLoading(true);
    try {
      await appointmentService.create({
        tenantId: user.tenantId,
        patientId: user.id,
        professionalId: selectedProfessional,
        productId: selectedService,
        startTime: selectedSlot,
        notes: notes || undefined,
      });

      toast({
        title: 'Consulta agendada!',
        description: 'Você receberá uma confirmação em breve.',
        status: 'success',
        duration: 5000,
      });

      navigate('/patient/dashboard');
    } catch (error: any) {
      toast({
        title: 'Erro ao agendar consulta',
        description: error.response?.data?.message || 'Tente novamente',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setBookingLoading(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90); // 90 days ahead
    return maxDate.toISOString().split('T')[0];
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const selectedServiceData = services.find(s => s.id === selectedService);
  const selectedProfessionalData = professionals.find(p => p.id === selectedProfessional);

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" boxShadow="sm" py={4}>
        <Container maxW="container.xl">
          <HStack justify="space-between">
            <Heading size="md">Agendar Consulta</Heading>
            <Button onClick={() => navigate('/patient/dashboard')} variant="outline" size="sm">
              Voltar
            </Button>
          </HStack>
        </Container>
      </Box>

      {/* Content */}
      <Container maxW="container.lg" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Progress Steps */}
          <HStack spacing={4} justify="center">
            <Badge colorScheme={step >= 1 ? 'blue' : 'gray'} fontSize="md" px={3} py={1}>
              1. Profissional
            </Badge>
            <Badge colorScheme={step >= 2 ? 'blue' : 'gray'} fontSize="md" px={3} py={1}>
              2. Serviço
            </Badge>
            <Badge colorScheme={step >= 3 ? 'blue' : 'gray'} fontSize="md" px={3} py={1}>
              3. Data e Horário
            </Badge>
            <Badge colorScheme={step >= 4 ? 'blue' : 'gray'} fontSize="md" px={3} py={1}>
              4. Confirmação
            </Badge>
          </HStack>

          <Box p={8} bg="white" borderRadius="lg" boxShadow="sm">
            {/* Step 1: Select Professional */}
            {step === 1 && (
              <VStack spacing={4} align="stretch">
                <Heading size="md">Escolha o Profissional</Heading>
                
                {loading ? (
                  <Center py={8}>
                    <Spinner size="lg" />
                  </Center>
                ) : professionals.length === 0 ? (
                  <Text color="gray.500">Nenhum profissional disponível no momento</Text>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {professionals.map((prof) => (
                      <Box
                        key={prof.id}
                        p={4}
                        borderWidth={2}
                        borderRadius="lg"
                        borderColor={selectedProfessional === prof.id ? 'blue.500' : 'gray.200'}
                        cursor="pointer"
                        onClick={() => setSelectedProfessional(prof.id)}
                        _hover={{ borderColor: 'blue.300' }}
                      >
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="bold">{prof.name}</Text>
                          <Text fontSize="sm" color="gray.600">{prof.specialty}</Text>
                        </VStack>
                      </Box>
                    ))}
                  </SimpleGrid>
                )}

                <Button
                  colorScheme="blue"
                  onClick={() => setStep(2)}
                  isDisabled={!selectedProfessional}
                  size="lg"
                >
                  Próximo
                </Button>
              </VStack>
            )}

            {/* Step 2: Select Service */}
            {step === 2 && (
              <VStack spacing={4} align="stretch">
                <Heading size="md">Escolha o Serviço</Heading>
                <Text fontSize="sm" color="gray.600">
                  Profissional: <strong>{selectedProfessionalData?.name}</strong>
                </Text>

                {services.length === 0 ? (
                  <Text color="gray.500">Nenhum serviço disponível</Text>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {services.map((service) => (
                      <Box
                        key={service.id}
                        p={4}
                        borderWidth={2}
                        borderRadius="lg"
                        borderColor={selectedService === service.id ? 'blue.500' : 'gray.200'}
                        cursor="pointer"
                        onClick={() => setSelectedService(service.id)}
                        _hover={{ borderColor: 'blue.300' }}
                      >
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="bold">{service.name}</Text>
                          {service.description && (
                            <Text fontSize="sm" color="gray.600">{service.description}</Text>
                          )}
                          <HStack spacing={4} fontSize="sm">
                            <Text><strong>Duração:</strong> {service.durationMinutes} min</Text>
                            {service.price && (
                              <Text><strong>Preço:</strong> R$ {service.price.toFixed(2)}</Text>
                            )}
                          </HStack>
                        </VStack>
                      </Box>
                    ))}
                  </SimpleGrid>
                )}

                <HStack>
                  <Button onClick={() => setStep(1)} variant="outline">
                    Voltar
                  </Button>
                  <Button
                    colorScheme="blue"
                    onClick={() => setStep(3)}
                    isDisabled={!selectedService}
                    flex={1}
                  >
                    Próximo
                  </Button>
                </HStack>
              </VStack>
            )}

            {/* Step 3: Select Date and Time */}
            {step === 3 && (
              <VStack spacing={4} align="stretch">
                <Heading size="md">Escolha Data e Horário</Heading>
                <Text fontSize="sm" color="gray.600">
                  Profissional: <strong>{selectedProfessionalData?.name}</strong> | 
                  Serviço: <strong>{selectedServiceData?.name}</strong>
                </Text>

                <FormControl>
                  <FormLabel>Data</FormLabel>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={getMinDate()}
                    max={getMaxDate()}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #E2E8F0',
                    }}
                  />
                </FormControl>

                {selectedDate && (
                  <>
                    <Text fontWeight="bold" mt={4}>Horários Disponíveis:</Text>
                    {loading ? (
                      <Center py={8}>
                        <Spinner size="lg" />
                      </Center>
                    ) : availableSlots.length === 0 ? (
                      <Text color="gray.500">Nenhum horário disponível para esta data</Text>
                    ) : (
                      <SimpleGrid columns={{ base: 3, md: 4 }} spacing={3}>
                        {availableSlots
                          .filter(slot => slot.available)
                          .map((slot) => (
                            <Button
                              key={slot.startTime}
                              variant={selectedSlot === slot.startTime ? 'solid' : 'outline'}
                              colorScheme="blue"
                              onClick={() => setSelectedSlot(slot.startTime)}
                            >
                              {formatTime(slot.startTime)}
                            </Button>
                          ))}
                      </SimpleGrid>
                    )}
                  </>
                )}

                <HStack mt={4}>
                  <Button onClick={() => setStep(2)} variant="outline">
                    Voltar
                  </Button>
                  <Button
                    colorScheme="blue"
                    onClick={() => setStep(4)}
                    isDisabled={!selectedSlot}
                    flex={1}
                  >
                    Próximo
                  </Button>
                </HStack>
              </VStack>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 && (
              <VStack spacing={4} align="stretch">
                <Heading size="md">Confirmar Agendamento</Heading>

                <Box p={4} bg="blue.50" borderRadius="lg">
                  <VStack align="start" spacing={2}>
                    <Text><strong>Profissional:</strong> {selectedProfessionalData?.name}</Text>
                    <Text><strong>Especialidade:</strong> {selectedProfessionalData?.specialty}</Text>
                    <Text><strong>Serviço:</strong> {selectedServiceData?.name}</Text>
                    <Text><strong>Duração:</strong> {selectedServiceData?.durationMinutes} minutos</Text>
                    {selectedServiceData?.price && (
                      <Text><strong>Preço:</strong> R$ {selectedServiceData.price.toFixed(2)}</Text>
                    )}
                    <Text><strong>Data:</strong> {new Date(selectedDate).toLocaleDateString('pt-BR')}</Text>
                    <Text><strong>Horário:</strong> {formatTime(selectedSlot)}</Text>
                  </VStack>
                </Box>

                <FormControl>
                  <FormLabel>Observações (opcional)</FormLabel>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Adicione informações relevantes para a consulta..."
                    rows={4}
                  />
                </FormControl>

                <HStack>
                  <Button onClick={() => setStep(3)} variant="outline">
                    Voltar
                  </Button>
                  <Button
                    colorScheme="blue"
                    onClick={handleBooking}
                    isLoading={bookingLoading}
                    flex={1}
                    size="lg"
                  >
                    Confirmar Agendamento
                  </Button>
                </HStack>
              </VStack>
            )}
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
