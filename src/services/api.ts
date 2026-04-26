const API_URL = 'http://localhost:8000';

export const loginUser = async (data: { email: string; password: string; role: string }) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Falha na autenticação');
  }
  return response.json();
};

export const registerUser = async (data: { email: string; password: string; role: string; tenant_name: string; name?: string; document?: string; linked_terminal_id?: number }) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Falha no cadastro');
  }
  return response.json();
};

export const getTerminals = async () => {
  const response = await fetch(`${API_URL}/terminals`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Falha ao buscar terminais');
  return response.json();
};

export const getTerminalApprovals = async (token: string) => {
  const response = await fetch(`${API_URL}/terminal/approvals`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Falha ao buscar solicitações');
  return response.json();
};

export const processTerminalApproval = async (token: string, transportadora_tenant_id: number, action: 'APPROVED' | 'REJECTED') => {
  const response = await fetch(`${API_URL}/terminal/approvals`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({ transportadora_tenant_id, action })
  });
  if (!response.ok) throw new Error('Falha ao processar solicitação');
  return response.json();
};

export const registerGlobalDriver = async (data: { document: string; name: string; email?: string; cnh: string; default_plate: string }) => {
  const response = await fetch(`${API_URL}/drivers/register_global`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Falha ao cadastrar motorista global');
  }
  return response.json();
};

export const addFleetDriver = async (document: string, token: string) => {
  const response = await fetch(`${API_URL}/drivers`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ document })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Falha ao vincular motorista');
  }
  return response.json();
};

export const getFleetDrivers = async (token: string) => {
  const response = await fetch(`${API_URL}/drivers`, {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Falha ao buscar frota');
  }
  return response.json();
};

export const callDriver = async (vehicleId: string, terminalId: number) => {
  const response = await fetch(`${API_URL}/queue/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vehicle_id: vehicleId, terminal_id: terminalId })
  });
  return response.json();
};

export const validateStatus = async (vehicleId: string) => {
  const response = await fetch(`${API_URL}/queue/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vehicle_id: vehicleId })
  });
  return response.json();
};

// ── Agendamento ─────────────────────────────────────────────
export const createAgendamento = async (data: {
  terminal_tenant_id: number;
  driver_id: number;
  vehicle_plate: string;
  cargo_type?: string;
  scheduled_date: string;
  notes?: string;
}, token: string) => {
  const response = await fetch(`${API_URL}/agendamentos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Falha ao criar agendamento');
  }
  return response.json();
};

export const listAgendamentos = async (token: string) => {
  const response = await fetch(`${API_URL}/agendamentos`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Falha ao buscar agendamentos');
  return response.json();
};

export const updateAgendamento = async (id: number, data: Record<string, any>, token: string) => {
  const response = await fetch(`${API_URL}/agendamentos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Falha ao atualizar agendamento');
  }
  return response.json();
};

export const updateAgendamentoStatus = async (id: number, status: string, token: string) => {
  const response = await fetch(`${API_URL}/agendamentos/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ status })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Falha ao atualizar status');
  }
  return response.json();
};

export const getTerminalQueue = async (token: string) => {
  const response = await fetch(`${API_URL}/queue/terminal`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Falha ao buscar fila');
  return response.json();
};
