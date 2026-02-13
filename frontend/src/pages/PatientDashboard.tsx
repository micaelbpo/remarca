import { useState } from 'react';
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
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AppointmentList } from '../components/AppointmentList';

export function PatientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNewAppointment = () => {
    navigate('/booking');
  };

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
            <Heading size="lg">Bem-vindo, {user?.name}!</Heading>
            <Button colorScheme="blue" onClick={handleNewAppointment}>
              Agendar Consulta
            </Button>
          </HStack>

          <Tabs colorScheme="blue">
            <TabList>
              <Tab>Minhas Consultas</Tab>
              <Tab>Histórico</Tab>
            </TabList>

            <TabPanels>
              {/* Appointments Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  {user && (
                    <AppointmentList
                      tenantId={user.tenantId}
                      userId={user.id}
                      userType="PATIENT"
                    />
                  )}
                </VStack>
              </TabPanel>

              {/* History Tab */}
              <TabPanel>
                <Box p={6} bg="white" borderRadius="lg">
                  <Text color="gray.600">
                    Histórico de consultas anteriores
                  </Text>
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Container>
    </Box>
  );
}
