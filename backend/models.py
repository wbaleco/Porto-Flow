from sqlalchemy import Column, Integer, String, ForeignKey, Enum as SQLEnum, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base

class RoleEnum(str, enum.Enum):
    MOTORISTA = "motorista"
    TERMINAL = "terminal"
    TRANSPORTADORA = "transportadora"

class QueueStatusEnum(str, enum.Enum):
    WAITING = "WAITING"
    CALLED = "CALLED"
    EXPIRED = "EXPIRED"
    COMPLETED = "COMPLETED"

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(SQLEnum(RoleEnum), nullable=False)

    users = relationship("User", back_populates="tenant")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True) # Null for independent drivers
    email = Column(String, unique=True, index=True, nullable=False)
    document = Column(String, unique=True, index=True, nullable=True) # CPF or CNPJ
    name = Column(String, nullable=True) # Nome completo ou Razão Social
    password_hash = Column(String, nullable=False)
    role = Column(SQLEnum(RoleEnum), nullable=False)

    tenant = relationship("Tenant", back_populates="users")
    driver_profile = relationship("DriverProfile", back_populates="user", uselist=False)

class DriverProfile(Base):
    __tablename__ = "driver_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    cnh = Column(String, nullable=True)
    default_plate = Column(String, nullable=True)

    user = relationship("User", back_populates="driver_profile")

class FleetDriver(Base):
    """
    Associação (N:N) entre Transportadora (Tenant) e Motoristas (User).
    Indica que o motorista faz parte da 'frota' daquela transportadora.
    """
    __tablename__ = "fleet_drivers"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False) # A Transportadora
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=False) # O Motorista
    
    # Pode incluir status de aprovação, etc.
    status = Column(String, default="ACTIVE")

class TerminalTransportadora(Base):
    """
    Vínculo entre um Terminal (Tenant) e uma Transportadora (Tenant).
    Necessita aprovação do Terminal.
    """
    __tablename__ = "terminal_transportadoras"
    
    id = Column(Integer, primary_key=True, index=True)
    terminal_tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    transportadora_tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    status = Column(String, default="PENDING") # PENDING, APPROVED, REJECTED

class Terminal(Base):
    __tablename__ = "terminals"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True)
    name = Column(String, nullable=False)
    capacity = Column(Integer, nullable=False)
    current_occupancy = Column(Integer, default=0)

class QueueEntry(Base):
    __tablename__ = "queue_entries"

    id = Column(Integer, primary_key=True, index=True)
    terminal_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    transportadora_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plate = Column(String, nullable=False)
    
    status = Column(SQLEnum(QueueStatusEnum), default=QueueStatusEnum.WAITING, nullable=False)
    called_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)


class AgendamentoStatusEnum(str, enum.Enum):
    AGENDADO = "AGENDADO"
    CONFIRMADO = "CONFIRMADO"
    NA_FILA = "NA_FILA"
    CHAMADO = "CHAMADO"
    CONCLUIDO = "CONCLUIDO"
    CANCELADO = "CANCELADO"


class Agendamento(Base):
    """
    Representa um agendamento feito por uma Transportadora para um Terminal.
    Liga Transportadora → Terminal → Motorista → Veículo.
    """
    __tablename__ = "agendamentos"

    id = Column(Integer, primary_key=True, index=True)
    transportadora_tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    terminal_tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vehicle_plate = Column(String, nullable=False)
    cargo_type = Column(String, nullable=True)
    container_number = Column(String, nullable=True)
    armador = Column(String, nullable=True)
    container_type = Column(String, nullable=True)
    scheduled_date = Column(DateTime, nullable=False)
    notes = Column(Text, nullable=True)
    status = Column(String, default="AGENDADO")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    transportadora = relationship("Tenant", foreign_keys=[transportadora_tenant_id])
    terminal = relationship("Tenant", foreign_keys=[terminal_tenant_id])
    driver = relationship("User", foreign_keys=[driver_id])
