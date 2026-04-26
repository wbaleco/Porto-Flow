from pydantic import BaseModel, EmailStr
from typing import Optional, List

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str
    tenant_name: str
    name: Optional[str] = None
    document: Optional[str] = None
    linked_terminal_id: Optional[int] = None

class UserResponse(BaseModel):
    email: str
    role: str
    tenant_id: Optional[int] = None
    tenant_name: Optional[str] = None
    name: Optional[str] = None
    document: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Novos schemas para a gestão de motoristas
class DriverCreate(BaseModel):
    document: str  # CPF
    name: str
    email: Optional[EmailStr] = None
    cnh: str
    default_plate: str

class DriverAddRequest(BaseModel):
    document: str # Transportadora envia o CPF para buscar ou vincular

class DriverResponse(BaseModel):
    id: int
    name: str
    document: str
    cnh: Optional[str] = None
    default_plate: Optional[str] = None
    status: str # Status do vínculo

class CallDriverRequest(BaseModel):
    vehicle_id: str
    terminal_id: int

class StatusValidationRequest(BaseModel):
    vehicle_id: str

class TerminalResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class ApprovalRequest(BaseModel):
    transportadora_tenant_id: int
    action: str # "APPROVE" ou "REJECT"


# ── Agendamento ─────────────────────────────────────────────
class AgendamentoCreate(BaseModel):
    terminal_tenant_id: int
    driver_id: int
    vehicle_plate: str
    cargo_type: Optional[str] = None
    container_number: Optional[str] = None
    armador: Optional[str] = None
    container_type: Optional[str] = None
    scheduled_date: str
    notes: Optional[str] = None

class AgendamentoUpdate(BaseModel):
    terminal_tenant_id: Optional[int] = None
    driver_id: Optional[int] = None
    vehicle_plate: Optional[str] = None
    cargo_type: Optional[str] = None
    container_number: Optional[str] = None
    armador: Optional[str] = None
    container_type: Optional[str] = None
    scheduled_date: Optional[str] = None
    notes: Optional[str] = None

class AgendamentoStatusUpdate(BaseModel):
    status: str

class AgendamentoResponse(BaseModel):
    id: int
    transportadora_name: str
    terminal_name: str
    driver_name: str
    driver_document: str
    vehicle_plate: str
    cargo_type: Optional[str] = None
    container_number: Optional[str] = None
    armador: Optional[str] = None
    container_type: Optional[str] = None
    scheduled_date: str
    status: str
    notes: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True
