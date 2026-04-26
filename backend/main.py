from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
import jwt
from sqlalchemy.orm import Session
import bcrypt
from fastapi.security import OAuth2PasswordBearer

import models
import schemas
from database import engine, get_db

# Cria as tabelas do banco de dados SQLite (se não existirem)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Porto-Flow API", description="Fila Virtual Alemoa API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "super_secret_key_for_jwt_token"
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user_token(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

@app.post("/auth/register", response_model=schemas.Token)
async def register(request: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(models.User).filter(models.User.email == request.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")

    # Find or create tenant
    db_tenant = db.query(models.Tenant).filter(models.Tenant.name == request.tenant_name, models.Tenant.type == request.role).first()
    if not db_tenant:
        db_tenant = models.Tenant(name=request.tenant_name, type=request.role)
        db.add(db_tenant)
        db.commit()
        db.refresh(db_tenant)

    # Create user
    new_user = models.User(
        email=request.email,
        password_hash=get_password_hash(request.password),
        role=request.role,
        tenant_id=db_tenant.id,
        name=request.name,
        document=request.document
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # If terminal, create Terminal entry
    if request.role == "terminal":
        terminal_entry = db.query(models.Terminal).filter(models.Terminal.tenant_id == db_tenant.id).first()
        if not terminal_entry:
            new_terminal = models.Terminal(
                tenant_id=db_tenant.id,
                name=db_tenant.name,
                capacity=100, # default capacity
                current_occupancy=0
            )
            db.add(new_terminal)
            db.commit()

    # If transportadora and linked_terminal_id provided, create pending link
    if request.role == "transportadora" and request.linked_terminal_id:
        # Check if terminal exists
        term = db.query(models.Tenant).filter(models.Tenant.id == request.linked_terminal_id, models.Tenant.type == "terminal").first()
        if term:
            link = models.TerminalTransportadora(
                terminal_tenant_id=term.id,
                transportadora_tenant_id=db_tenant.id,
                status="PENDING"
            )
            db.add(link)
            db.commit()

    # Generate JWT
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode = {
        "sub": new_user.email, 
        "role": new_user.role, 
        "tenant_id": db_tenant.id,
        "tenant_name": db_tenant.name,
        "exp": expire
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return {
        "access_token": encoded_jwt, 
        "token_type": "bearer",
        "user": {
            "email": new_user.email,
            "role": new_user.role,
            "tenant_id": db_tenant.id,
            "tenant_name": db_tenant.name
        }
    }

@app.post("/auth/login", response_model=schemas.Token)
async def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == request.email).first()
    if not db_user or not verify_password(request.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    if db_user.role != request.role:
        raise HTTPException(status_code=401, detail="Perfil incorreto")

    db_tenant = db.query(models.Tenant).filter(models.Tenant.id == db_user.tenant_id).first()
    tenant_name = db_tenant.name if db_tenant else "Porto Flow"

    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode = {
        "sub": db_user.email, 
        "role": db_user.role, 
        "tenant_id": db_user.tenant_id,
        "tenant_name": tenant_name,
        "exp": expire
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return {
        "access_token": encoded_jwt, 
        "token_type": "bearer",
        "user": {
            "email": db_user.email,
            "role": db_user.role,
            "tenant_id": db_user.tenant_id,
            "tenant_name": tenant_name
        }
    }

@app.get("/terminals", response_model=list[schemas.TerminalResponse])
async def list_terminals(db: Session = Depends(get_db)):
    terminals = db.query(models.Tenant).filter(models.Tenant.type == "terminal").all()
    return [{"id": t.id, "name": t.name} for t in terminals]

@app.get("/terminal/approvals")
async def get_terminal_approvals(token_payload: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    if token_payload.get("role") != "terminal":
        raise HTTPException(status_code=403, detail="Apenas terminais")
        
    tenant_id = token_payload.get("tenant_id")
    
    approvals = db.query(models.TerminalTransportadora).filter(
        models.TerminalTransportadora.terminal_tenant_id == tenant_id,
        models.TerminalTransportadora.status == "PENDING"
    ).all()
    
    result = []
    for app in approvals:
        transp = db.query(models.Tenant).filter(models.Tenant.id == app.transportadora_tenant_id).first()
        if transp:
            result.append({
                "id": app.id,
                "transportadora_tenant_id": transp.id,
                "transportadora_name": transp.name,
                "status": app.status
            })
            
    return result

@app.post("/terminal/approvals")
async def process_approval(request: schemas.ApprovalRequest, token_payload: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    if token_payload.get("role") != "terminal":
        raise HTTPException(status_code=403, detail="Apenas terminais")
        
    tenant_id = token_payload.get("tenant_id")
    
    link = db.query(models.TerminalTransportadora).filter(
        models.TerminalTransportadora.terminal_tenant_id == tenant_id,
        models.TerminalTransportadora.transportadora_tenant_id == request.transportadora_tenant_id,
        models.TerminalTransportadora.status == "PENDING"
    ).first()
    
    if not link:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
        
    link.status = request.action # "APPROVED" or "REJECTED"
    db.commit()
    
    return {"message": f"Transportadora {link.status.lower()}"}

@app.post("/drivers/register_global", response_model=schemas.DriverResponse)
async def register_global_driver(request: schemas.DriverCreate, db: Session = Depends(get_db)):
    # Rota para cadastrar um motorista novo na base global
    db_user = db.query(models.User).filter(models.User.document == request.document).first()
    if db_user:
        raise HTTPException(status_code=400, detail="CPF já cadastrado")
        
    email = request.email or f"{request.document}@motorista.portoflow"
    
    new_user = models.User(
        email=email,
        password_hash=get_password_hash(request.document), # Senha inicial é o CPF
        document=request.document,
        name=request.name,
        role="motorista",
        tenant_id=None
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    new_profile = models.DriverProfile(
        user_id=new_user.id,
        cnh=request.cnh,
        default_plate=request.default_plate
    )
    db.add(new_profile)
    db.commit()
    
    return {
        "id": new_user.id,
        "name": new_user.name,
        "document": new_user.document,
        "cnh": new_profile.cnh,
        "default_plate": new_profile.default_plate,
        "status": "CRIADO"
    }

@app.post("/drivers", response_model=schemas.DriverResponse)
async def add_fleet_driver(request: schemas.DriverAddRequest, token_payload: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    if token_payload.get("role") != "transportadora":
        raise HTTPException(status_code=403, detail="Apenas transportadoras")
        
    tenant_id = token_payload.get("tenant_id")
    
    db_user = db.query(models.User).filter(models.User.document == request.document, models.User.role == "motorista").first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Motorista não encontrado na base. Cadastre-o primeiro.")
        
    db_fleet = db.query(models.FleetDriver).filter(
        models.FleetDriver.tenant_id == tenant_id,
        models.FleetDriver.driver_id == db_user.id
    ).first()
    
    if db_fleet:
        raise HTTPException(status_code=400, detail="Motorista já está na sua frota")
        
    new_fleet_link = models.FleetDriver(tenant_id=tenant_id, driver_id=db_user.id)
    db.add(new_fleet_link)
    db.commit()
    
    profile = db_user.driver_profile
    return {
        "id": db_user.id,
        "name": db_user.name or db_user.email,
        "document": db_user.document,
        "cnh": profile.cnh if profile else None,
        "default_plate": profile.default_plate if profile else None,
        "status": "VINCULADO"
    }

@app.get("/drivers", response_model=list[schemas.DriverResponse])
async def list_fleet_drivers(token_payload: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    if token_payload.get("role") != "transportadora":
        raise HTTPException(status_code=403, detail="Apenas transportadoras")
        
    tenant_id = token_payload.get("tenant_id")
    
    fleet_links = db.query(models.FleetDriver).filter(models.FleetDriver.tenant_id == tenant_id).all()
    
    drivers = []
    for link in fleet_links:
        user = db.query(models.User).filter(models.User.id == link.driver_id).first()
        profile = user.driver_profile if user else None
        if user:
            drivers.append({
                "id": user.id,
                "name": user.name or user.email,
                "document": user.document or "Sem Documento",
                "cnh": profile.cnh if profile else None,
                "default_plate": profile.default_plate if profile else None,
                "status": link.status
            })
            
    return drivers

@app.post("/agendamentos", response_model=schemas.AgendamentoResponse)
async def create_agendamento(
    request: schemas.AgendamentoCreate,
    token_payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    if token_payload.get("role") != "transportadora":
        raise HTTPException(status_code=403, detail="Apenas transportadoras podem criar agendamentos")

    transportadora_tenant_id = token_payload.get("tenant_id")

    # Validar que o motorista pertence à frota desta transportadora
    fleet_link = db.query(models.FleetDriver).filter(
        models.FleetDriver.tenant_id == transportadora_tenant_id,
        models.FleetDriver.driver_id == request.driver_id
    ).first()
    if not fleet_link:
        raise HTTPException(status_code=400, detail="Motorista não pertence à sua frota")

    from datetime import datetime as dt
    scheduled_dt = dt.fromisoformat(request.scheduled_date)

    agendamento = models.Agendamento(
        transportadora_tenant_id=transportadora_tenant_id,
        terminal_tenant_id=request.terminal_tenant_id,
        driver_id=request.driver_id,
        vehicle_plate=request.vehicle_plate.upper(),
        cargo_type=request.cargo_type,
        container_number=request.container_number,
        armador=request.armador,
        container_type=request.container_type,
        scheduled_date=scheduled_dt,
        notes=request.notes,
        status="AGENDADO"
    )
    db.add(agendamento)
    db.commit()
    db.refresh(agendamento)

    return _format_agendamento(agendamento, db)


@app.put("/agendamentos/{agendamento_id}", response_model=schemas.AgendamentoResponse)
async def update_agendamento(
    agendamento_id: int,
    request: schemas.AgendamentoUpdate,
    token_payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    if token_payload.get("role") != "transportadora":
        raise HTTPException(status_code=403, detail="Apenas transportadoras podem editar agendamentos")

    tenant_id = token_payload.get("tenant_id")
    agendamento = db.query(models.Agendamento).filter(
        models.Agendamento.id == agendamento_id,
        models.Agendamento.transportadora_tenant_id == tenant_id
    ).first()

    if not agendamento:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")

    if agendamento.status not in ["AGENDADO", "CONFIRMADO"]:
        raise HTTPException(status_code=400, detail="Agendamento não pode ser editado neste status")

    from datetime import datetime as dt

    if request.driver_id is not None:
        fleet_link = db.query(models.FleetDriver).filter(
            models.FleetDriver.tenant_id == tenant_id,
            models.FleetDriver.driver_id == request.driver_id
        ).first()
        if not fleet_link:
            raise HTTPException(status_code=400, detail="Motorista não pertence à sua frota")
        agendamento.driver_id = request.driver_id

    if request.terminal_tenant_id is not None:
        agendamento.terminal_tenant_id = request.terminal_tenant_id
    if request.vehicle_plate is not None:
        agendamento.vehicle_plate = request.vehicle_plate.upper()
    if request.cargo_type is not None:
        agendamento.cargo_type = request.cargo_type
    if request.container_number is not None:
        agendamento.container_number = request.container_number
    if request.armador is not None:
        agendamento.armador = request.armador
    if request.container_type is not None:
        agendamento.container_type = request.container_type
    if request.scheduled_date is not None:
        agendamento.scheduled_date = dt.fromisoformat(request.scheduled_date)
    if request.notes is not None:
        agendamento.notes = request.notes

    db.commit()
    db.refresh(agendamento)
    return _format_agendamento(agendamento, db)


@app.get("/agendamentos", response_model=list[schemas.AgendamentoResponse])
async def list_agendamentos(
    token_payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    role = token_payload.get("role")
    tenant_id = token_payload.get("tenant_id")

    query = db.query(models.Agendamento)

    if role == "transportadora":
        query = query.filter(models.Agendamento.transportadora_tenant_id == tenant_id)
    elif role == "terminal":
        query = query.filter(models.Agendamento.terminal_tenant_id == tenant_id)
    else:
        raise HTTPException(status_code=403, detail="Acesso negado")

    agendamentos = query.order_by(models.Agendamento.scheduled_date).all()
    return [_format_agendamento(a, db) for a in agendamentos]


@app.patch("/agendamentos/{agendamento_id}/status")
async def update_agendamento_status(
    agendamento_id: int,
    request: schemas.AgendamentoStatusUpdate,
    token_payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    role = token_payload.get("role")
    tenant_id = token_payload.get("tenant_id")

    agendamento = db.query(models.Agendamento).filter(models.Agendamento.id == agendamento_id).first()
    if not agendamento:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")

    # Terminal só pode gerenciar seus próprios agendamentos
    if role == "terminal" and agendamento.terminal_tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Sem permissão")

    # Transportadora só pode cancelar os seus
    if role == "transportadora":
        if agendamento.transportadora_tenant_id != tenant_id:
            raise HTTPException(status_code=403, detail="Sem permissão")
        if request.status != "CANCELADO":
            raise HTTPException(status_code=403, detail="Transportadora só pode cancelar agendamentos")

    agendamento.status = request.status
    if request.status == "CHAMADO":
        agendamento.called_at = datetime.utcnow()
    db.commit()

    return {"message": f"Status atualizado para {request.status}", "id": agendamento_id}


@app.get("/queue/terminal", response_model=list[schemas.AgendamentoResponse])
async def get_terminal_queue(
    token_payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    """Retorna a fila ativa do terminal: agendamentos CONFIRMADOS e NA_FILA ordenados por data."""
    if token_payload.get("role") != "terminal":
        raise HTTPException(status_code=403, detail="Apenas terminais")

    tenant_id = token_payload.get("tenant_id")
    agendamentos = db.query(models.Agendamento).filter(
        models.Agendamento.terminal_tenant_id == tenant_id,
        models.Agendamento.status.in_(["AGENDADO", "CONFIRMADO", "NA_FILA", "CHAMADO"])
    ).order_by(models.Agendamento.scheduled_date).all()

    return [_format_agendamento(a, db) for a in agendamentos]


def _format_agendamento(a: models.Agendamento, db) -> dict:
    """Helper que serializa um Agendamento enriquecido com nomes."""
    transp = db.query(models.Tenant).filter(models.Tenant.id == a.transportadora_tenant_id).first()
    term = db.query(models.Tenant).filter(models.Tenant.id == a.terminal_tenant_id).first()
    driver = db.query(models.User).filter(models.User.id == a.driver_id).first()

    return {
        "id": a.id,
        "transportadora_name": transp.name if transp else "—",
        "terminal_name": term.name if term else "—",
        "driver_name": driver.name or driver.email if driver else "—",
        "driver_document": driver.document or "—" if driver else "—",
        "vehicle_plate": a.vehicle_plate,
        "cargo_type": a.cargo_type,
        "container_number": a.container_number,
        "armador": a.armador,
        "container_type": a.container_type,
        "scheduled_date": a.scheduled_date.isoformat() if a.scheduled_date else "",
        "status": a.status,
        "notes": a.notes,
        "created_at": a.created_at.isoformat() if a.created_at else "",
    }


@app.get("/")
async def root():
    return {"message": "Porto-Flow API is running"}
