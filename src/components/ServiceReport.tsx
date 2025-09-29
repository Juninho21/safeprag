import React from 'react';
import { Device } from '../types';

interface ServiceReportProps {
  devices: Device[];
  serviceData: {
    clientName: string;
    clientCode: string;
    serviceType: string;
    date: string;
    time: string;
    status: string;
    productsUsed: string;
  };
}

export const ServiceReport: React.FC<ServiceReportProps> = ({ devices, serviceData }) => {
  return (
    <div className="p-8 bg-white">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">Ordem de Serviço</h1>
        <p className="text-gray-600">Sulpest</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p><strong>Cliente:</strong> {serviceData.clientName}</p>
          <p><strong>Código:</strong> {serviceData.clientCode}</p>
          <p><strong>Tipo de Serviço:</strong> {serviceData.serviceType}</p>
        </div>
        <div>
          <p><strong>Data:</strong> {serviceData.date}</p>
          <p><strong>Hora:</strong> {serviceData.time}</p>
          <p><strong>Status:</strong> {serviceData.status}</p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Dispositivos</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Dispositivo</th>
              <th className="border p-2 text-left">Status</th>
              <th className="border p-2 text-left">Quantidade</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device, index) => (
              <tr key={index}>
                <td className="border p-2">{device.name}</td>
                <td className="border p-2">{device.status}</td>
                <td className="border p-2">{device.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {serviceData.productsUsed && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Produtos Utilizados</h2>
          <p>{serviceData.productsUsed}</p>
        </div>
      )}

      <div className="mt-12 pt-8 border-t">
        <div className="w-64 mx-auto text-center">
          <div className="border-t border-black pt-2">
            <p>Assinatura do Responsável</p>
          </div>
        </div>
      </div>
    </div>
  );
};
