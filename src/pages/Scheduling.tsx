import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import {
  CalendarPlus, Calendar, Truck, User, Building2, Package,
  Plus, X, Clock, CheckCircle2, XCircle, AlertCircle, ChevronRight,
  FileText, Pencil, QrCode, Download, Ship, BoxSelect
} from 'lucide-react';
import {
  createAgendamento, listAgendamentos, updateAgendamento,
  updateAgendamentoStatus, getTerminals, getFleetDrivers
} from '../services/api';

// ── Dados estáticos ──────────────────────────────────────────
const CONTAINER_TYPES = [
  "20' DC (Dry Container)",
  "20' HC (High Cube)",
  "20' OT (Open Top)",
  "20' FR (Flat Rack)",
  "20' RF (Reefer)",
  "20' Tank",
  "20' Double Door",
  "40' DC (Dry Container)",
  "40' HC (High Cube)",
  "40' OT (Open Top)",
  "40' FR (Flat Rack)",
  "40' RF (Reefer)",
  "40' Double Door",
  "45' HC (High Cube)",
  "45' DC (Pallet Wide)",
  "48' DC",
  "53' DC",
  "ISO Tank",
  "Bulk Container",
];

const ARMADORES = [
  "MSC", "Maersk", "CMA CGM", "COSCO", "Hapag-Lloyd",
  "ONE (Ocean Network Express)", "Evergreen", "Yang Ming",
  "HMM (Hyundai)", "PIL", "Aliança", "Mercosul Line",
  "Log-In Logística", "Hamburg Süd", "Zim", "Outro",
];

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: JSX.Element }> = {
  AGENDADO:   { label: 'Agendado',   color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',    icon: <Clock size={11}/> },
  CONFIRMADO: { label: 'Confirmado', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: <CheckCircle2 size={11}/> },
  NA_FILA:    { label: 'Na Fila',    color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',   icon: <ChevronRight size={11}/> },
  CHAMADO:    { label: 'Chamado',    color: 'text-purple-700',  bg: 'bg-purple-50 border-purple-200', icon: <AlertCircle size={11}/> },
  CONCLUIDO:  { label: 'Concluído',  color: 'text-slate-500',   bg: 'bg-slate-50 border-slate-200',   icon: <CheckCircle2 size={11}/> },
  CANCELADO:  { label: 'Cancelado',  color: 'text-red-600',     bg: 'bg-red-50 border-red-200',       icon: <XCircle size={11}/> },
};

const BLANK_FORM = {
  terminal_tenant_id: '', driver_id: '', vehicle_plate: '',
  cargo_type: '', container_number: '', armador: '', container_type: '',
  scheduled_date: '', scheduled_time: '', notes: '',
};

function fmt(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

// ── Componente ───────────────────────────────────────────────
export default function Scheduling() {
  const [items, setItems] = useState<any[]>([]);
  const [terminals, setTerminals] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ ...BLANK_FORM });
  const [qrItem, setQrItem] = useState<any | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const token = localStorage.getItem('token') || '';

  const load = async () => {
    try {
      setLoading(true);
      const [sched, terms, drv] = await Promise.all([
        listAgendamentos(token), getTerminals(), getFleetDrivers(token),
      ]);
      setItems(sched); setTerminals(terms); setDrivers(drv);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm({ ...BLANK_FORM }); setEditId(null); setShowForm(true); };

  const openEdit = (a: any) => {
    const d = new Date(a.scheduled_date);
    const date = d.toISOString().split('T')[0];
    const time = d.toTimeString().slice(0, 5);
    const drv = drivers.find(x => x.name === a.driver_name);
    const term = terminals.find(x => x.name === a.terminal_name);
    setForm({
      terminal_tenant_id: term?.id?.toString() || '',
      driver_id: drv?.id?.toString() || '',
      vehicle_plate: a.vehicle_plate,
      cargo_type: a.cargo_type || '',
      container_number: a.container_number || '',
      armador: a.armador || '',
      container_type: a.container_type || '',
      scheduled_date: date,
      scheduled_time: time,
      notes: a.notes || '',
    });
    setEditId(a.id); setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.terminal_tenant_id || !form.driver_id || !form.vehicle_plate || !form.scheduled_date || !form.scheduled_time)
      return alert('Preencha os campos obrigatórios.');
    setSubmitting(true);
    const payload = {
      terminal_tenant_id: Number(form.terminal_tenant_id),
      driver_id: Number(form.driver_id),
      vehicle_plate: form.vehicle_plate,
      cargo_type: form.cargo_type || undefined,
      container_number: form.container_number || undefined,
      armador: form.armador || undefined,
      container_type: form.container_type || undefined,
      scheduled_date: `${form.scheduled_date}T${form.scheduled_time}:00`,
      notes: form.notes || undefined,
    };
    try {
      if (editId) await updateAgendamento(editId, payload, token);
      else await createAgendamento(payload, token);
      setShowForm(false); setForm({ ...BLANK_FORM }); setEditId(null);
      load();
    } catch (e: any) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Cancelar este agendamento?')) return;
    try { await updateAgendamentoStatus(id, 'CANCELADO', token); load(); }
    catch (e: any) { alert(e.message); }
  };

  // ── PDF ──────────────────────────────────────────────────────
  const generatePDF = (a: any) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210; const pad = 20;

    // Header bar
    doc.setFillColor(26, 34, 56);
    doc.rect(0, 0, W, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text('Porto-Flow', pad, 13);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text('Comprovante de Agendamento', pad, 21);
    doc.text(`Nº ${String(a.id).padStart(6, '0')}`, W - pad, 21, { align: 'right' });

    // Status badge
    doc.setTextColor(26, 34, 56);
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text(`Status: ${a.status}`, pad, 40);

    const row = (label: string, value: string, y: number) => {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(label.toUpperCase(), pad, y);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      doc.setTextColor(26, 34, 56);
      doc.text(value || '—', pad, y + 5);
    };

    let y = 52;
    row('Terminal', a.terminal_name, y); y += 16;
    row('Transportadora', a.transportadora_name, y); y += 16;
    row('Motorista', `${a.driver_name} — CPF: ${a.driver_document}`, y); y += 16;
    row('Placa do Veículo', a.vehicle_plate, y); y += 16;

    if (a.container_number || a.container_type || a.armador) {
      doc.setDrawColor(226, 232, 240);
      doc.line(pad, y, W - pad, y); y += 8;
      if (a.container_number) { row('Nº Container', a.container_number, y); y += 16; }
      if (a.container_type) { row('Tipo de Container', a.container_type, y); y += 16; }
      if (a.armador) { row('Armador', a.armador, y); y += 16; }
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(pad, y, W - pad, y); y += 8;
    row('Tipo de Carga', a.cargo_type || '—', y); y += 16;
    row('Data e Hora', fmt(a.scheduled_date), y); y += 16;
    if (a.notes) { row('Observações', a.notes, y); y += 16; }

    // QR Code placeholder box
    const qrX = W - pad - 45; const qrY = 48;
    doc.setDrawColor(226, 232, 240); doc.setFillColor(248, 250, 252);
    doc.roundedRect(qrX, qrY, 45, 45, 2, 2, 'FD');
    doc.setFontSize(7); doc.setTextColor(148, 163, 184);
    doc.text('QR CODE', qrX + 22.5, qrY + 25, { align: 'center' });
    doc.text(`AG-${a.id}`, qrX + 22.5, qrY + 31, { align: 'center' });

    // Footer
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 272, W, 25, 'F');
    doc.setTextColor(148, 163, 184); doc.setFontSize(7);
    doc.text('Gerado por Porto-Flow • Fila Virtual Alemoa', W / 2, 281, { align: 'center' });
    doc.text(`Emitido em ${new Date().toLocaleString('pt-BR')}`, W / 2, 287, { align: 'center' });

    doc.save(`agendamento-${a.id}.pdf`);
  };

  // ── RENDER ───────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Calendar className="text-primary-navy" size={26} /> Agendamentos
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Crie e gerencie seus agendamentos portuários.</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-primary-navy text-white px-5 py-3 rounded-xl font-bold shadow-md hover:opacity-90 active:scale-95 transition-all">
          <Plus size={18} /> Novo Agendamento
        </button>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className="bg-white rounded-2xl shadow-lg border border-border-subtle overflow-hidden">
            <div className="p-5 border-b border-border-subtle bg-slate-50/50 flex items-center justify-between">
              <h2 className="font-bold text-primary-navy text-lg flex items-center gap-2">
                {editId ? <Pencil size={18} /> : <CalendarPlus size={18} />}
                {editId ? 'Editar Agendamento' : 'Novo Agendamento'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditId(null); }}
                className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Terminal */}
              <Field label="Terminal Destino *" icon={<Building2 size={11}/>}>
                <select value={form.terminal_tenant_id} onChange={e => setForm({ ...form, terminal_tenant_id: e.target.value })} className={sel}>
                  <option value="">Selecione...</option>
                  {terminals.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </Field>

              {/* Motorista */}
              <Field label="Motorista *" icon={<User size={11}/>}>
                <select value={form.driver_id} onChange={e => setForm({ ...form, driver_id: e.target.value })} className={sel}>
                  <option value="">Selecione...</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>

              {/* Placa */}
              <Field label="Placa *" icon={<Truck size={11}/>}>
                <input value={form.vehicle_plate} onChange={e => setForm({ ...form, vehicle_plate: e.target.value.toUpperCase() })}
                  placeholder="ABC-1234" maxLength={8} className={`${inp} uppercase font-mono tracking-widest`} />
              </Field>

              {/* Data */}
              <Field label="Data *" icon={<Calendar size={11}/>}>
                <input type="date" value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })} className={inp} />
              </Field>

              {/* Hora */}
              <Field label="Horário *" icon={<Clock size={11}/>}>
                <input type="time" value={form.scheduled_time} onChange={e => setForm({ ...form, scheduled_time: e.target.value })} className={inp} />
              </Field>

              {/* Nº Container */}
              <Field label="Nº do Container" icon={<BoxSelect size={11}/>}>
                <input value={form.container_number} onChange={e => setForm({ ...form, container_number: e.target.value.toUpperCase() })}
                  placeholder="MSCU1234567" className={`${inp} uppercase font-mono`} />
              </Field>

              {/* Tipo de Container */}
              <Field label="Tipo de Container" icon={<Package size={11}/>}>
                <select value={form.container_type} onChange={e => setForm({ ...form, container_type: e.target.value })} className={sel}>
                  <option value="">Selecione...</option>
                  {CONTAINER_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              {/* Armador */}
              <Field label="Armador" icon={<Ship size={11}/>}>
                <select value={form.armador} onChange={e => setForm({ ...form, armador: e.target.value })} className={sel}>
                  <option value="">Selecione...</option>
                  {ARMADORES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </Field>

              {/* Tipo Carga */}
              <Field label="Tipo de Carga" icon={<Package size={11}/>}>
                <select value={form.cargo_type} onChange={e => setForm({ ...form, cargo_type: e.target.value })} className={sel}>
                  <option value="">Selecione...</option>
                  {['Contêiner', 'Granel Sólido', 'Granel Líquido', 'Carga Geral', 'Carga Frigorificada', 'Veículos', 'Projeto Especial', 'Outros'].map(c =>
                    <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              {/* Observações */}
              <div className="md:col-span-2 lg:col-span-3 space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <FileText size={11}/> Observações
                </label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={2} placeholder="Informações adicionais..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-border-subtle rounded-xl text-sm focus:ring-2 focus:ring-primary-navy/20 transition-all resize-none" />
              </div>
            </div>

            <div className="px-6 pb-6 flex justify-end gap-3">
              <button onClick={() => { setShowForm(false); setEditId(null); }}
                className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                Cancelar
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                className="px-8 py-2.5 text-sm font-bold bg-primary-navy text-white rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-50">
                {submitting ? 'Salvando...' : editId ? 'Salvar Alterações' : 'Confirmar Agendamento'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista */}
      <div className="bg-white rounded-2xl shadow-sm border border-border-subtle overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle bg-slate-50/50 flex items-center justify-between">
          <h2 className="font-bold text-primary-navy">Meus Agendamentos</h2>
          <span className="bg-primary-navy/10 text-primary-navy text-xs font-bold px-3 py-1 rounded-full">
            {items.filter(a => a.status !== 'CANCELADO').length} ativos
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarPlus className="mx-auto mb-3 text-slate-200" size={48} />
            <p className="text-slate-500 font-medium">Nenhum agendamento ainda</p>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {items.map(a => {
              const cfg = STATUS_CFG[a.status] || STATUS_CFG['AGENDADO'];
              const canEdit = ['AGENDADO', 'CONFIRMADO'].includes(a.status);
              return (
                <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="p-5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0">
                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(a.driver_name)}&background=1A2238&color=fff&bold=true&size=44`} alt="" className="w-full h-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-primary-navy">{a.driver_name}</p>
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                            {cfg.icon}{cfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1"><Building2 size={11}/>{a.terminal_name}</span>
                          <span className="flex items-center gap-1 font-mono font-semibold bg-slate-100 px-2 py-0.5 rounded"><Truck size={11}/>{a.vehicle_plate}</span>
                          {a.container_number && <span className="flex items-center gap-1 font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100"><BoxSelect size={11}/>{a.container_number}</span>}
                          {a.container_type && <span className="flex items-center gap-1"><Package size={11}/>{a.container_type}</span>}
                          {a.armador && <span className="flex items-center gap-1"><Ship size={11}/>{a.armador}</span>}
                          <span className="flex items-center gap-1"><Clock size={11}/>{fmt(a.scheduled_date)}</span>
                        </div>
                        {a.notes && <p className="text-xs text-slate-400 mt-1 italic">"{a.notes}"</p>}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => setQrItem(a)} title="QR Code"
                        className="p-2 text-slate-400 hover:text-primary-navy hover:bg-slate-100 rounded-lg transition-colors">
                        <QrCode size={16}/>
                      </button>
                      <button onClick={() => generatePDF(a)} title="Baixar PDF"
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                        <Download size={16}/>
                      </button>
                      {canEdit && (
                        <button onClick={() => openEdit(a)} title="Editar"
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                          <Pencil size={16}/>
                        </button>
                      )}
                      {a.status === 'AGENDADO' && (
                        <button onClick={() => handleCancel(a.id)}
                          className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                          <X size={13}/>Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {qrItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setQrItem(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-primary-navy text-lg">QR Code</h3>
                <button onClick={() => setQrItem(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              <div className="flex justify-center mb-4" ref={qrRef}>
                <QRCodeSVG
                  value={JSON.stringify({ id: qrItem.id, placa: qrItem.vehicle_plate, motorista: qrItem.driver_name, terminal: qrItem.terminal_name, data: qrItem.scheduled_date, container: qrItem.container_number || '' })}
                  size={200} level="H"
                  imageSettings={{ src: '', excavate: false, height: 0, width: 0 }}
                />
              </div>
              <p className="font-mono text-xs text-slate-400 mb-1">AG-{String(qrItem.id).padStart(6,'0')}</p>
              <p className="font-bold text-primary-navy">{qrItem.driver_name}</p>
              <p className="text-sm text-slate-500">{qrItem.vehicle_plate} · {qrItem.terminal_name}</p>
              {qrItem.container_number && <p className="text-xs font-mono text-blue-600 mt-1 bg-blue-50 inline-block px-3 py-1 rounded-full">{qrItem.container_number}</p>}
              <p className="text-xs text-slate-400 mt-2">{fmt(qrItem.scheduled_date)}</p>
              <button onClick={() => generatePDF(qrItem)}
                className="mt-5 w-full bg-primary-navy text-white font-bold py-3 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2">
                <Download size={16}/> Baixar PDF
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Helpers de estilo ────────────────────────────────────────
const inp = 'w-full px-4 py-2.5 bg-slate-50 border border-border-subtle rounded-xl text-sm focus:ring-2 focus:ring-primary-navy/20 focus:border-primary-navy/40 transition-all';
const sel = `${inp} cursor-pointer`;

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
        {icon}{label}
      </label>
      {children}
    </div>
  );
}
