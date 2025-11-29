import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Calendar, Clock } from 'lucide-react';

interface RetroactiveServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    date: string;
    startTime: string;
    endTime: string;
    duration: string;
  }) => void;
}

const RetroactiveServiceModal: React.FC<RetroactiveServiceModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [duration, setDuration] = useState<string>('');

  // Gera as opções de horário de 30 em 30 minutos
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        options.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Calcula a duração quando o horário de início ou fim mudar
  useEffect(() => {
    if (startTime && endTime) {
      try {
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);

        let durationMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
        
        // Se a duração for negativa, assume que o serviço terminou no dia seguinte
        if (durationMinutes < 0) {
          durationMinutes += 24 * 60;
        }

        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;

        setDuration(`${hours}h ${minutes}min`);
      } catch (error) {
        console.error('Erro ao calcular duração:', error);
        setDuration('');
      }
    } else {
      setDuration('');
    }
  }, [startTime, endTime]);

  // Verifica se o horário de fim é posterior ao de início
  const isEndTimeValid = () => {
    if (!startTime || !endTime) return true;
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    // Permite que o serviço termine no dia seguinte
    return endTotalMinutes !== startTotalMinutes;
  };

  const handleSave = () => {
    if (!isEndTimeValid()) {
      alert('O horário de fim deve ser diferente do horário de início');
      return;
    }

    onSave({
      date,
      startTime,
      endTime,
      duration,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center border-b border-gray-200 p-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span>Ordem de Serviço Retroativa</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data do Serviço
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora de Início
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {timeOptions.map((time) => (
                  <option key={`start-${time}`} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora de Fim
              </label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${!isEndTimeValid() ? 'border-red-500' : 'border-gray-300'}`}
                required
              >
                {timeOptions.map((time) => (
                  <option key={`end-${time}`} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              {!isEndTimeValid() && (
                <p className="text-red-500 text-xs mt-1">
                  O horário de fim deve ser diferente do horário de início
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duração Calculada
            </label>
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>{duration || 'Calculando...'}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-3 sm:py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="w-full sm:w-auto px-4 py-3 sm:py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetroactiveServiceModal;