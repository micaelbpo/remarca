import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Switch,
  Button,
  FormControl,
  FormLabel,
  Select,
  useToast,
  Divider,
} from '@chakra-ui/react';
import { professionalService } from '../services/professional.service';

interface TimeSlot {
  start: string;
  end: string;
}

interface DayAvailability {
  enabled: boolean;
  slots: TimeSlot[];
}

interface WeeklyAvailability {
  [key: string]: DayAvailability;
}

interface AvailabilityEditorProps {
  professionalId: string;
  tenantId: string;
}

const DAYS = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

export function AvailabilityEditor({ professionalId, tenantId }: AvailabilityEditorProps) {
  const [availability, setAvailability] = useState<WeeklyAvailability>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const data = await professionalService.getAvailability(professionalId, tenantId);
      
      if (data && data.weeklySchedule) {
        setAvailability(data.weeklySchedule);
      } else {
        // Initialize with default empty schedule
        const defaultSchedule: WeeklyAvailability = {};
        DAYS.forEach(day => {
          defaultSchedule[day.key] = {
            enabled: false,
            slots: [{ start: '09:00', end: '18:00' }],
          };
        });
        setAvailability(defaultSchedule);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        // No availability set yet, use defaults
        const defaultSchedule: WeeklyAvailability = {};
        DAYS.forEach(day => {
          defaultSchedule[day.key] = {
            enabled: false,
            slots: [{ start: '09:00', end: '18:00' }],
          };
        });
        setAvailability(defaultSchedule);
      } else {
        toast({
          title: 'Erro ao carregar disponibilidade',
          description: error.response?.data?.message || 'Tente novamente',
          status: 'error',
          duration: 5000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (dayKey: string) => {
    setAvailability(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        enabled: !prev[dayKey]?.enabled,
      },
    }));
  };

  const handleTimeChange = (dayKey: string, slotIndex: number, field: 'start' | 'end', value: string) => {
    setAvailability(prev => {
      const day = prev[dayKey] || { enabled: false, slots: [] };
      const newSlots = [...day.slots];
      newSlots[slotIndex] = { ...newSlots[slotIndex], [field]: value };
      
      return {
        ...prev,
        [dayKey]: {
          ...day,
          slots: newSlots,
        },
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await professionalService.setAvailability(professionalId, tenantId, {
        weeklySchedule: availability,
      });
      
      toast({
        title: 'Disponibilidade salva!',
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar disponibilidade',
        description: error.response?.data?.message || 'Tente novamente',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Text>Carregando...</Text>;
  }

  return (
    <VStack spacing={6} align="stretch">
      <Text fontSize="sm" color="gray.600">
        Configure seus horários de atendimento para cada dia da semana
      </Text>

      {DAYS.map((day) => {
        const dayData = availability[day.key] || { enabled: false, slots: [{ start: '09:00', end: '18:00' }] };
        
        return (
          <Box key={day.key} p={4} bg="white" borderRadius="lg" borderWidth={1}>
            <VStack spacing={3} align="stretch">
              <HStack justify="space-between">
                <Text fontWeight="bold">{day.label}</Text>
                <Switch
                  isChecked={dayData.enabled}
                  onChange={() => handleDayToggle(day.key)}
                  colorScheme="blue"
                />
              </HStack>

              {dayData.enabled && (
                <Box pl={4}>
                  {dayData.slots.map((slot, index) => (
                    <HStack key={index} spacing={3}>
                      <FormControl>
                        <FormLabel fontSize="sm">Início</FormLabel>
                        <Select
                          size="sm"
                          value={slot.start}
                          onChange={(e) => handleTimeChange(day.key, index, 'start', e.target.value)}
                        >
                          {TIME_OPTIONS.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm">Fim</FormLabel>
                        <Select
                          size="sm"
                          value={slot.end}
                          onChange={(e) => handleTimeChange(day.key, index, 'end', e.target.value)}
                        >
                          {TIME_OPTIONS.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </Select>
                      </FormControl>
                    </HStack>
                  ))}
                </Box>
              )}
            </VStack>
          </Box>
        );
      })}

      <Divider />

      <Button
        colorScheme="blue"
        onClick={handleSave}
        isLoading={saving}
        size="lg"
      >
        Salvar Disponibilidade
      </Button>
    </VStack>
  );
}
