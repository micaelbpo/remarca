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
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { Professional, Product } from '../types';
import { professionalService } from '../services/professional.service';
import { productService } from '../services/product.service';

export function ProfessionalDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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
                    <Button colorScheme="blue">Adicionar Serviço</Button>
                  </HStack>

                  {products.length === 0 ? (
                    <Box p={8} bg="white" borderRadius="lg" textAlign="center">
                      <Text color="gray.500">Nenhum serviço cadastrado ainda</Text>
                      <Button mt={4} colorScheme="blue">Criar Primeiro Serviço</Button>
                    </Box>
                  ) : (
                    products.map((product) => (
                      <Box key={product.id} p={4} bg="white" borderRadius="lg" boxShadow="sm">
                        <HStack justify="space-between">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold">{product.name}</Text>
                            <Text fontSize="sm" color="gray.600">{product.description}</Text>
                            <Text fontSize="sm">Duração: {product.durationMinutes} minutos</Text>
                          </VStack>
                          <HStack>
                            <Button size="sm" variant="outline">Editar</Button>
                            <Button size="sm" colorScheme="red" variant="outline">Desativar</Button>
                          </HStack>
                        </HStack>
                      </Box>
                    ))
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
    </Box>
  );
}
