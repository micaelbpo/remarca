import { useState } from 'react';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
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
  FormErrorMessage,
} from '@chakra-ui/react';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../config/api';

export function ConfirmEmail() {
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get('email') || '';
  
  const [email, setEmail] = useState(emailFromUrl);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; code?: string }>({});
  
  const navigate = useNavigate();
  const toast = useToast();

  const validate = () => {
    const newErrors: { email?: string; code?: string } = {};
    
    if (!email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!code) {
      newErrors.code = 'Código é obrigatório';
    } else if (code.length < 6) {
      newErrors.code = 'Código deve ter pelo menos 6 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    try {
      await api.post(API_ENDPOINTS.CONFIRM, { email, code });
      
      toast({
        title: 'Email confirmado com sucesso!',
        description: 'Você já pode fazer login.',
        status: 'success',
        duration: 5000,
      });
      
      navigate('/login');
    } catch (error: any) {
      toast({
        title: 'Erro ao confirmar email',
        description: error.response?.data?.message || error.response?.data?.error?.message || 'Código inválido ou expirado',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="md" py={12}>
      <VStack spacing={8}>
        <Heading>Remarca</Heading>
        <Box w="full" p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
          <VStack spacing={4} as="form" onSubmit={handleSubmit}>
            <Heading size="lg">Confirmar Email</Heading>
            
            <Text fontSize="sm" color="gray.600" textAlign="center">
              Digite o código de verificação que você recebeu no seu email
            </Text>
            
            <FormControl isInvalid={!!errors.email}>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
              />
              <FormErrorMessage>{errors.email}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.code}>
              <FormLabel>Código de Verificação</FormLabel>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                maxLength={10}
              />
              <FormErrorMessage>{errors.code}</FormErrorMessage>
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              width="full"
              isLoading={loading}
            >
              Confirmar Email
            </Button>

            <Text fontSize="sm">
              Já confirmou seu email?{' '}
              <Link as={RouterLink} to="/login" color="blue.500">
                Fazer login
              </Link>
            </Text>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}
