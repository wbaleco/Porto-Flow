import { Truck, Metric } from './types';

export const MOCK_QUEUE: Truck[] = [
  {
    id: '1',
    plate: 'ABC-1234',
    driver: 'Ricardo Santos',
    company: 'Translog Sudeste',
    cargo: 'Granéis Sólidos',
    entryTime: '14:30',
    waitTime: '02:45h',
    status: 'no-patio',
    terminal: 'Norte G3'
  },
  {
    id: '2',
    plate: 'XYZ-8899',
    driver: 'Maria Oliveira',
    company: 'Rodoviário Santos',
    cargo: "Container 20'",
    entryTime: '15:15',
    waitTime: '01:12h',
    status: 'em-transito',
    priority: true,
    terminal: 'Sul B12'
  },
  {
    id: '3',
    plate: 'KJH-5421',
    driver: 'João Pereira',
    company: 'Expresso Alemoa',
    cargo: 'Bobinas Aço',
    entryTime: '16:00',
    waitTime: '03:20h',
    status: 'confirmado',
    terminal: 'Central C4'
  },
  {
    id: '4',
    plate: 'MOP-0012',
    driver: 'Lucas Lima',
    company: 'LogExpress',
    cargo: 'Líquidos Inf.',
    entryTime: '16:45',
    waitTime: '00:54h',
    status: 'atrasado',
    terminal: 'Norte G2'
  }
];

export const MOCK_HISTORY: Truck[] = [
  { id: 'h1', plate: 'JKL-9090', driver: 'Carlos Pol', company: 'Portaria 02', cargo: '', entryTime: '14:22:15', waitTime: '', status: 'concluido' },
  { id: 'h2', plate: 'RTY-4432', driver: 'Ana Silva', company: 'Portaria 01', cargo: '', entryTime: '14:18:02', waitTime: '', status: 'concluido' },
  { id: 'h3', plate: 'QWE-7761', driver: 'Marcos R.', company: 'Portaria 02', cargo: '', entryTime: '14:05:44', waitTime: '', status: 'concluido' },
];

export const MOCK_METRICS: Metric[] = [
  { label: 'Atendimentos', value: 142, trend: '+12% hoje' },
  { label: 'T. Médio Fila', value: '02:15h' },
  { label: 'Em Operação', value: 12, color: 'text-emerald' },
  { label: 'Atrasos Rota', value: 3, color: 'text-vibrant-orange' },
];
