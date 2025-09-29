import React from 'react';
import { Clock, MapPin, User, Wrench, Pencil, Trash2 } from 'lucide-react';
import { Schedule } from '../types/schedule';

interface ScheduleCardProps {
  schedule: Schedule;
  onClick?: () => void;
  onEdit?: (schedule: Schedule) => void;
  onDelete?: (schedule: Schedule) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'in_progress':
      return 'bg-orange-100 text-orange-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getServiceTypeColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'contrato':
      return 'border-l-8 border-blue-500 bg-blue-50/50';
    case 'emergencial':
      return 'border-l-8 border-red-500 bg-red-50/50';
    case 'avulso':
      return 'border-l-8 border-purple-500 bg-purple-50/50';
    default:
      return 'border-l-8 border-gray-300 bg-white';
  }
};

const getServiceTypeBadgeColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'contrato':
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    case 'emergencial':
      return 'bg-red-100 text-red-800 border border-red-200';
    case 'avulso':
      return 'bg-purple-100 text-purple-800 border border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'Confirmado';
    case 'pending':
      return 'Pendente';
    case 'in_progress':
      return 'Em Andamento';
    case 'completed':
      return 'Concluído';
    case 'cancelled':
      return 'Cancelado';
    default:
      return status;
  }
};

export const ScheduleCard: React.FC<ScheduleCardProps> = ({ schedule, onClick, onEdit, onDelete }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow ${getServiceTypeColor(schedule.serviceType)}`}>
      <div className="space-y-3">
        {/* Horário, Status e Tipo de Serviço */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium">{schedule.startTime} - {schedule.endTime}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(schedule.status)}`}>
              {getStatusText(schedule.status)}
            </span>
            <div className="flex space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(schedule);
                }}
                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(schedule);
                }}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Excluir"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tipo de Serviço */}
        <div className="flex items-center justify-between" onClick={onClick}>
          <span className={`px-3 py-1 rounded-md text-xs font-medium ${getServiceTypeBadgeColor(schedule.serviceType)}`}>
            {schedule.serviceType}
          </span>
        </div>

        {/* Cliente e Endereço */}
        <div className="space-y-2" onClick={onClick}>
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium">{schedule.clientName}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{schedule.clientAddress}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
