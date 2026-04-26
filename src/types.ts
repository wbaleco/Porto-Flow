export interface Truck {
  id: string;
  plate: string;
  driver: string;
  company: string;
  cargo: string;
  entryTime: string;
  waitTime: string;
  status: 'no-patio' | 'em-transito' | 'confirmado' | 'atrasado' | 'concluido';
  priority?: boolean;
  terminal?: string;
  estimatedArrival?: string;
}

export interface Metric {
  label: string;
  value: string | number;
  trend?: string;
  color?: string;
}

export type View = 'login' | 'dashboard' | 'queue' | 'driver' | 'fleet' | 'terminal-approvals';

export interface User {
  email: string;
  role: string;
  tenant_id: number;
  tenant_name: string;
}

export interface Driver {
  id: number;
  name: string;
  document: string;
  cnh: string | null;
  default_plate: string | null;
  status: string;
}
