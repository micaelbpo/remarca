import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Button,
  HStack,
  VStack,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  Spinner,
  Center,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Badge,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import type { Professional, Product } from '../types';
import { professionalService } from '../services/professional.service';
import { productService } from '../services/product.service';
import { ServiceModal } from '../components/ServiceModal';

export function ProfessionalDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const cancelRef = useRef<HTMLButtonElement>(null);
  
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Product | null>(null);
  const [serviceToDeactivate, setServiceToDeactivate] = useState<Product | null>(null);
  
  const { isOpen: isServiceModalOpen, onOpen: onServiceModalOpen, onClose: onServiceModalClose } = useDisclosure();
  const { isOpen: isDeleteAlertOpen, onOpen: onDeleteAlertOpen, onClose: onDeleteAlertClose } = useDisclosure();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Try to get professional profile
      // For now, we'll create one if it doesn't exist
      try {
        const prof = await professionalService.get(user.id, user.tenantId);
        setProfessional(prof);
      } catch (error: any) {
        if (error.response?.status === 404) {
          // Create professional profile
          const newProf = await professionalService.create({
            name: user.name,
            email: user.email,
            specialty: 'Geral',
            tenantId: user.tenantId,
          });
          setProfessional(newProf);
        }
      }

      // Load products
      const prods = await productService.list(user.tenantId, user.id, true);
      setProducts(prods);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar dados',
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

  const handleCreateService = () => {
    setSelectedService(null);
    onServiceModalOpen();
  };

  const handleEditService = (service: Product) => {
    setSelectedService(service);
    onServiceModalOpen();
  };

  const handleDeactivateService = (service: Product) => {
    setServiceToDeactivate(service);
    onDeleteAlertOpen();
  };

  const confirmDeactivate = async () => {
    if (!serviceToDeactivate || !user) return;

    try {
      await productService.deactivate(serviceToDeactivate.id, user.tenantId);
      toast({
        title: 'Serviço desativado',
        status: 'success',
        duration: 3000,
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro ao desativar serviço',
        description: error.response?.data?.message || 'Tente novamente',
        status: 'error',
        duration: 5000,
      });
    } finally {
      onDeleteAlertClose();
      setServiceToDeactivate(null);
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
            <Heading size="md">Remarca - Profissional</Heading>
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
          <Heading size="lg">
            Bem-vindo, {professional?.name || user?.name}!
          </Heading>

          <Tabs colorScheme="blue">
            <TabList>
              <Tab>Visão Geral</Tab>
              <Tab>Serviços</Tab>
              <Tab>Disponibilidade</Tab>
              <Tab>Consultas</Tab>
            </TabList>

            <TabPanels>
              {/* Overview Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Box p={6} bg="white" borderRadius="lg" boxShadow="sm">
                    <Heading size="md" mb={4}>Informações do Perfil</Heading>
                    <VStack align="start" spacing={2}>
                      <Text><strong>Nome:</strong> {professional?.name}</Text>
                      <Text><strong>Email:</strong> {professional?.email}</Text>
                      <Text><strong>Especialidade:</strong> {professional?.specialty}</Text>
                      <Text><strong>Serviços ativos:</strong> {products.length}</Text>
                    </VStack>
                  </Box>

                  <Box p={6} bg="blue.50" borderRadius="lg">
                    <Heading size="md" mb={2}>Próximos Passos</Heading>
                    <VStack align="start" spacing={2}>
                      <Text>1. Configure seus serviços na aba "Serviços"</Text>
                      <Text>2. Defina sua disponibilidade na aba "Disponibilidade"</Text>
                      <Text>3. Gerencie suas consultas na aba "Consultas"</Text>
                    </VStack>
                  </Box>
                </VStack>
              </TabPanel>

              {/* Services Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <Heading size="md">Meus Serviços</Heading>
                    <Button colorScheme="blue" onClick={handleCreateService}>
                      Adicionar Serviço
                    </Button>
                  </HStack>

                  {products.length === 0 ? (
                    <Box p={8} bg="white" borderRadius="lg" textAlign="center">
                      <Text color="gray.500" mb={4}>
                        Nenhum serviço cadastrado ainda
                      </Text>
                      <Button colorScheme="blue" onClick={handleCreateService}>
                        Criar Primeiro Serviço
                      </Button>
                    </Box>
                  ) : (
                    <VStack spacing={3} align="stretch">
                      {products.map((product) => (
                        <Box
                          key={product.id}
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
                                  {product.name}
                                </Text>
                                {!product.isActive && (
                                  <Badge colorScheme="red">Inativo</Badge>
                                )}
                              </HStack>
                              {product.description && (
                                <Text fontSize="sm" color="gray.600">
                                  {product.description}
                                </Text>
                              )}
                              <HStack spacing={4} fontSize="sm">
                                <Text>
                                  <strong>Duração:</strong> {product.durationMinutes} min
                                </Text>
                                {product.price && (
                                  <Text>
                                    <strong>Preço:</strong> R$ {product.price.toFixed(2)}
                                  </Text>
                                )}
                              </HStack>
                            </VStack>
                            <HStack>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditService(product)}
                              >
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                colorScheme="red"
                                variant="outline"
                                onClick={() => handleDeactivateService(product)}
                              >
                                Desativar
                              </Button>
                            </HStack>
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                  )}
                </VStack>
              </TabPanel>

              {/* Availability Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Heading size="md">Configurar Disponibilidade</Heading>
                  <Box p={6} bg="white" borderRadius="lg">
                    <Text color="gray.600">
                      Em breve: Configure seus horários de atendimento por dia da semana
                    </Text>
                  </Box>
                </VStack>
              </TabPanel>

              {/* Appointments Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Heading size="md">Minhas Consultas</Heading>
                  <Box p={6} bg="white" borderRadius="lg">
                    <Text color="gray.600">
                      Em breve: Visualize e gerencie suas consultas agendadas
                    </Text>
                  </Box>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Container>

      {/* Service Modal */}
      {user && professional && (
        <ServiceModal
          isOpen={isServiceModalOpen}
          onClose={onServiceModalClose}
          onSuccess={loadData}
          service={selectedService}
          professionalId={user.id}
          tenantId={user.tenantId}
        />
      )}

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Desativar Serviço
            </AlertDialogHeader>

            <AlertDialogBody>
              Tem certeza que deseja desativar o serviço "{serviceToDeactivate?.name}"?
              Ele não ficará mais disponível para agendamentos.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteAlertClose}>
                Cancelar
              </Button>
              <Button colorScheme="red" onClick={confirmDeactivate} ml={3}>
                Desativar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
