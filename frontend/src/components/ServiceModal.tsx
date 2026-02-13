import { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  VStack,
  FormErrorMessage,
  useToast,
} from '@chakra-ui/react';
import type { Product } from '../types';
import { productService } from '../services/product.service';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  service?: Product | null;
  professionalId: string;
  tenantId: string;
}

export function ServiceModal({
  isOpen,
  onClose,
  onSuccess,
  service,
  professionalId,
  tenantId,
}: ServiceModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    durationMinutes: 30,
    price: 0,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description || '',
        durationMinutes: service.durationMinutes,
        price: service.price || 0,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        durationMinutes: 30,
        price: 0,
      });
    }
    setErrors({});
  }, [service, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (formData.durationMinutes < 15) {
      newErrors.durationMinutes = 'Duração mínima é 15 minutos';
    }

    if (formData.price < 0) {
      newErrors.price = 'Preço não pode ser negativo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      if (service) {
        // Update existing service
        await productService.update(service.id, tenantId, {
          ...formData,
          professionalId,
          tenantId,
        });
        toast({
          title: 'Serviço atualizado!',
          status: 'success',
          duration: 3000,
        });
      } else {
        // Create new service
        await productService.create({
          ...formData,
          professionalId,
          tenantId,
        });
        toast({
          title: 'Serviço criado!',
          status: 'success',
          duration: 3000,
        });
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar serviço',
        description: error.response?.data?.message || 'Tente novamente',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {service ? 'Editar Serviço' : 'Novo Serviço'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isInvalid={!!errors.name}>
              <FormLabel>Nome do Serviço</FormLabel>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Consulta Geral"
              />
              <FormErrorMessage>{errors.name}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel>Descrição</FormLabel>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descreva o serviço..."
                rows={3}
              />
            </FormControl>

            <FormControl isInvalid={!!errors.durationMinutes}>
              <FormLabel>Duração (minutos)</FormLabel>
              <NumberInput
                value={formData.durationMinutes}
                onChange={(_, value) =>
                  setFormData({ ...formData, durationMinutes: value })
                }
                min={15}
                step={15}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <FormErrorMessage>{errors.durationMinutes}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.price}>
              <FormLabel>Preço (R$)</FormLabel>
              <NumberInput
                value={formData.price}
                onChange={(_, value) =>
                  setFormData({ ...formData, price: value })
                }
                min={0}
                precision={2}
                step={10}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <FormErrorMessage>{errors.price}</FormErrorMessage>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={loading}
          >
            {service ? 'Salvar' : 'Criar'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
