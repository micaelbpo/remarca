import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Link,
  useToast,
  Select,
  FormErrorMessage,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import type { UserType } from '../types';

export function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    userType: 'PATIENT' as UserType,
    tenantId: 'tenant-001', // Default tenant for MVP
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Senha deve ter no mínimo 8 caracteres';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Senha deve conter maiúsculas, minúsculas e números';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não conferem';
    }
    
    if (!formData.name) {
      newErrors.name = 'Nome é obrigatório';
    }
    
    if (formData.phone && !/^\+?\d{10,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = 'Telefone inválido (use formato: +5511987654321 ou 5511987654321)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    try {
      const { confirmPassword, ...registerData } = formData;
      
      // Remove phone if empty
      if (!registerData.phone || registerData.phone.trim() === '') {
        delete registerData.phone;
      } else {
        // Ensure phone has + prefix if provided
        if (!registerData.phone.startsWith('+')) {
          registerData.phone = '+' + registerData.phone.replace(/\D/g, '');
        }
      }
      
      await register(registerData);
      toast({
        title: 'Cadastro realizado com sucesso!',
        status: 'success',
        duration: 3000,
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Erro ao cadastrar',
        description: error.response?.data?.message || error.response?.data?.error?.message || 'Tente novamente',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Container maxW="md" py={12}>
      <VStack spacing={8}>
        <Heading>Remarca</Heading>
        <Box w="full" p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
          <VStack spacing={4} as="form" onSubmit={handleSubmit}>
            <Heading size="lg">Cadastro</Heading>
            
            <FormControl isInvalid={!!errors.name}>
              <FormLabel>Nome Completo</FormLabel>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="João Silva"
              />
              <FormErrorMessage>{errors.name}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.email}>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="seu@email.com"
              />
              <FormErrorMessage>{errors.email}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.phone}>
              <FormLabel>Telefone (opcional)</FormLabel>
              <Input
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+5511987654321 ou 5511987654321"
              />
              <FormErrorMessage>{errors.phone}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel>Tipo de Usuário</FormLabel>
              <Select
                value={formData.userType}
                onChange={(e) => handleChange('userType', e.target.value)}
              >
                <option value="PATIENT">Paciente</option>
                <option value="PROFESSIONAL">Profissional</option>
              </Select>
            </FormControl>

            <FormControl isInvalid={!!errors.password}>
              <FormLabel>Senha</FormLabel>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="********"
              />
              <FormErrorMessage>{errors.password}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.confirmPassword}>
              <FormLabel>Confirmar Senha</FormLabel>
              <Input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                placeholder="********"
              />
              <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              width="full"
              isLoading={loading}
            >
              Cadastrar
            </Button>

            <Text>
              Já tem uma conta?{' '}
              <Link as={RouterLink} to="/login" color="blue.500">
                Faça login
              </Link>
            </Text>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}
