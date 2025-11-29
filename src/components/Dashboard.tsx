import React, { useEffect, useRef } from 'react';
import { Device } from '../types';
import { Chart, registerables } from 'chart.js';
import { DEVICE_TYPES } from '../constants';

Chart.register(...registerables);

interface DashboardProps {
  devices: Device[];
}

export const Dashboard: React.FC<DashboardProps> = ({ devices }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Destruir gráfico anterior se existir
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Calcular dados para o gráfico
    const deviceTypeData = DEVICE_TYPES.map(deviceType => {
      const devicesByType = devices.filter(device => device.type === deviceType);
      if (devicesByType.length === 0) return null;

      const statusCounts = devicesByType.reduce((acc, device) => {
        const status = device.status || 'Não definido';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const labels = Object.keys(statusCounts);
      const data = Object.values(statusCounts);

      return { deviceType, labels, data };
    }).filter(data => data !== null);

    if (deviceTypeData.length === 0) return;

    // Criar novo gráfico
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: deviceTypeData[0].labels,
        datasets: deviceTypeData.map((data, index) => ({
          label: data.deviceType,
          data: data.data,
          backgroundColor: data.labels.map(status => {
            switch (status) {
              case 'Conforme':
                return 'rgba(34, 197, 94, 0.6)';
              case 'Sem Dispositivo':
              case 'Dispositivo danificado':
                return 'rgba(239, 68, 68, 0.6)';
              default:
                return `rgba(59, 130, 246, ${0.6 - (index * 0.1)})`;
            }
          }),
          borderColor: data.labels.map(status => {
            switch (status) {
              case 'Conforme':
                return 'rgb(34, 197, 94)';
              case 'Sem Dispositivo':
              case 'Dispositivo danificado':
                return 'rgb(239, 68, 68)';
              default:
                return `rgb(59, 130, 246)`;
            }
          }),
          borderWidth: 1,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top' as const,
          },
          title: {
            display: true,
            text: 'Distribuição por Status',
            font: {
              size: 16,
              weight: 'bold',
            },
            padding: {
              top: 10,
              bottom: 20,
            },
          },
          tooltip: {
            enabled: true,
          },
          // Plugin personalizado para mostrar números nas barras
          datalabels: {
            anchor: 'center',
            align: 'center',
            color: '#000000',
            font: {
              weight: 'bold',
            },
            formatter: (value: number) => value.toString(),
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
        animation: {
          duration: 500,
        },
      },
      plugins: [{
        id: 'chartBarLabels',
        afterDraw: (chart) => {
          const ctx = chart.ctx;
          chart.data.datasets.forEach((dataset, datasetIndex) => {
            const meta = chart.getDatasetMeta(datasetIndex);
            meta.data.forEach((bar, index) => {
              const value = dataset.data[index] as number;
              const { x, y } = bar.getCenterPoint();
              
              ctx.fillStyle = '#000000';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.font = 'bold 12px Arial';
              
              ctx.fillText(value.toString(), x, y);
            });
          });
        }
      }],
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [devices]);

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div style={{ height: '400px' }}>
        <canvas ref={chartRef} />
      </div>
    </div>
  );
};