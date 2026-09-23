import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity, Archive, ArrowRight, ClipboardList, BadgeCheck, Building2, Check, ChevronDown,
  CircleAlert, Clock3, Code2, FilePlus2, FileText, Globe2, KeyRound, Laptop, LayoutDashboard,
  LockKeyhole, LogOut, Menu, Pencil, Plus, Search, ShieldCheck, SlidersHorizontal, Trash2,
  UserCog, Users, X, Zap
} from 'lucide-react';
import * as api from './api';
import { useSession } from './store';
import type { AuditLog, DocumentItem, EnvironmentContext, Role, User, View } from './types';

const roles: Array<{ role: Role; label: string; email: string; icon: string }> = [
  { role: 'ADMINISTRADOR', label: 'Administrador', email: 'admin@securedocs.com', icon: 'AP' },
  { role: 'GERENTE', label: 'Gerente', email: 'gerente@securedocs.com', icon: 'GF' },
  { role: 'SUPERVISOR', label: 'Supervisor', email: 'carlos.ruiz@securedocs.com', icon: 'CR' },
  { role: 'EMPLEADO', label: 'Empleado', email: 'maria.rrhh@securedocs.com', icon: 'MR' },
  { role: 'AUDITOR', label: 'Auditor', email: 'auditor@securedocs.com', icon: 'AG' },
  { role: 'INVITADO', label: 'Invitado', email: 'invitado@securedocs.com', icon: 'IE' }
];

const roleLabel: Record<Role, string> = {
  ADMINISTRADOR: 'Administrador', GERENTE: 'Gerente', SUPERVISOR: 'Supervisor',
  EMPLEADO: 'Empleado', AUDITOR: 'Auditor', INVITADO: 'Invitado'
};

const navItems: Array<{ id: View; label: string; icon: typeof LayoutDashboard; roles?: Role[] }> = [
  { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
  { id: 'documentos', label: 'Documentos', icon: Archive },
  { id: 'usuarios', label: 'Usuarios', icon: Users, roles: ['ADMINISTRADOR'] },
  { id: 'auditoria', label: 'Auditoría', icon: ClipboardList, roles: ['ADMINISTRADOR', 'GERENTE', 'AUDITOR'] },
  { id: 'tests', label: 'Test suite', icon: Code2 }
];

const permissionByRole: Record<Role, string[]> = {
  ADMINISTRADOR: ['leer', 'crear', 'modificar', 'eliminar', 'aprobar', 'auditar', 'usuarios'],
  GERENTE: ['leer', 'crear', 'modificar', 'eliminar', 'aprobar', 'auditar'],
  SUPERVISOR: ['leer', 'crear', 'modificar', 'aprobar'],
  EMPLEADO: ['leer', 'crear', 'modificar'],
  AUDITOR: ['leer', 'auditar'],
  INVITADO: ['leer']
};

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
}

function errorMessage(error: unknown) {
  const response = (error as { response?: { data?: { motivo?: string; message?: string } } })?.response?.data;
  return response?.motivo || response?.message || 'No fue posible completar la operación.';
}

function Login() {
  const { setSession } = useSession();
  const [email, setEmail] = useState('admin@securedocs.com');
  const [password, setPassword] = useState('123');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (selectedEmail = email) => {
    setBusy(true); setError('');
    try {
      const response = await api.login(selectedEmail, password);
      setSession(response.data.token, response.data.user);
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  };

  return <main className="login-page">
    <section className="login-atmosphere">
      <div className="brand-mark"><ShieldCheck size={24} /><span>SecureDocs</span></div>
      <div className="login-hero">
        <div className="eyebrow"><span className="pulse-dot" /> LABORATORIO DE CLOUD SECURITY</div>
        <h1>Decisiones de acceso,<br /><em>explicadas.</em></h1>
        <p>Explora el control híbrido RBAC + ABAC de TechCorp en una consola diseñada para hacer visible cada política.</p>
        <div className="security-orbit"><LockKeyhole size={30} /><span>POLICY ENGINE<br /><strong>ONLINE</strong></span><div className="orbit orbit-one" /><div className="orbit orbit-two" /></div>
      </div>
      <div className="login-footnote"><span>SECUREDOCS / 2026</span><span>ISO 27001 · ZERO TRUST</span></div>
    </section>
    <section className="login-panel">
      <div className="login-form-wrap">
        <div className="mobile-brand"><ShieldCheck size={23} /> SecureDocs</div>
        <div className="section-kicker">IDENTIDAD VERIFICADA</div>
        <h2>Bienvenido de vuelta</h2>
        <p className="muted">Inicia una sesión para consultar tu perímetro de acceso.</p>
        <form onSubmit={(event) => { event.preventDefault(); void submit(); }}>
          <label>Correo corporativo<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" /></label>
          <label>Contraseña <span className="label-hint">DEMO: 123</span><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" /></label>
          {error && <div className="error-banner"><CircleAlert size={16} />{error}</div>}
          <button className="primary-button full" disabled={busy}>{busy ? 'Validando...' : 'Iniciar sesión'}<ArrowRight size={17} /></button>
        </form>
        <div className="quick-login"><div className="divider"><span>ACCESOS DE DEMOSTRACIÓN</span></div><div className="quick-grid">
          {roles.map((item) => <button key={item.role} className="quick-card" onClick={() => { setEmail(item.email); void submit(item.email); }}><span className="avatar small">{item.icon}</span><span>{item.label}</span><ArrowRight size={14} /></button>)}
        </div></div>
      </div>
    </section>
  </main>;
}

function EnvironmentBar() {
  const { environment, setEnvironment } = useSession();
  const update = (patch: Partial<EnvironmentContext>) => setEnvironment({ ...environment, ...patch });
  return <div className="environment-bar">
    <div className="env-title"><span className="env-icon"><SlidersHorizontal size={16} /></span><div><strong>Simulador ABAC</strong><small>Contexto de la petición</small></div></div>
    <div className="env-controls">
      <label className="env-control"><Globe2 size={15} /><span>Ubicación</span><select value={environment.country} onChange={(e) => update({ country: e.target.value })}><option value="PERU">Perú</option><option value="USA">USA</option><option value="EUROPA">Europa</option></select></label>
      <label className="env-control"><Clock3 size={15} /><span>Hora</span><input type="time" value={environment.time} onChange={(e) => update({ time: e.target.value })} /></label>
      <div className="env-control device-control"><Laptop size={15} /><span>Dispositivo</span><div className="segmented"><button className={environment.device === 'CORPORATIVO' ? 'active' : ''} onClick={() => update({ device: 'CORPORATIVO' })}>Corporativo</button><button className={environment.device === 'PERSONAL' ? 'active personal' : ''} onClick={() => update({ device: 'PERSONAL' })}>Personal</button></div></div>
      <div className="headers-badge"><span className="live-signal" /> HEADERS INYECTADOS <code>{environment.country} · {environment.device} · {environment.time}</code></div>
    </div>
  </div>;
}

function Sidebar({ mobileOpen, close }: { mobileOpen: boolean; close: () => void }) {
  const { user, view, setView, clearSession } = useSession();
  const navigate = (next: View) => { setView(next); close(); };
  const doLogout = async () => { try { await api.logout(); } finally { clearSession(); } };
  return <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
    <div className="sidebar-brand"><span className="brand-symbol"><ShieldCheck size={19} /></span><span>Secure<span className="brand-accent">Docs</span></span><button className="mobile-close" onClick={close}><X size={18} /></button></div>
    <div className="workspace-switch"><span className="workspace-icon"><Building2 size={15} /></span><span><small>WORKSPACE</small><strong>TechCorp / Interno</strong></span><ChevronDown size={15} /></div>
    <nav><div className="nav-caption">CONTROL CENTER</div>{navItems.map((item) => {
      if (item.roles && !item.roles.includes(user!.rol)) return null;
      const Icon = item.icon;
      return <button key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} onClick={() => navigate(item.id)}><Icon size={18} /><span>{item.label}</span>{item.id === 'auditoria' && <span className="nav-dot" />}</button>;
    })}</nav>
    <div className="sidebar-bottom"><div className="policy-mini"><div className="policy-mini-icon"><Zap size={15} /></div><div><strong>Policy engine</strong><span><i /> Todas las políticas activas</span></div></div><div className="profile"><span className="avatar">{initials(user!.nombre)}</span><span className="profile-info"><strong>{user!.nombre}</strong><small>{roleLabel[user!.rol]} · Nivel {user!.nivel_seguridad}</small></span><button className="icon-button" title="Cerrar sesión" onClick={() => void doLogout()}><LogOut size={16} /></button></div></div>
  </aside>;
}

function TopHeader({ onMenu }: { onMenu: () => void }) {
  const { view, user } = useSession();
  const labels: Record<View, string> = { dashboard: 'Resumen ejecutivo', documentos: 'Documentos', usuarios: 'Gestión de usuarios', auditoria: 'Registro de auditoría', tests: 'Test suite' };
  return <header className="top-header"><button className="mobile-menu icon-button" onClick={onMenu}><Menu size={20} /></button><div><div className="breadcrumb">SECUREDOCS <span>/</span> {labels[view].toUpperCase()}</div><h1>{labels[view]}</h1></div><div className="header-actions"><div className="header-status"><span className="live-signal" /> SISTEMA OPERATIVO</div><div className="header-user"><span className="avatar small">{initials(user!.nombre)}</span><span>{user!.nombre}</span></div></div></header>;
}

function Metric({ icon: Icon, label, value, note, tone }: { icon: typeof FileText; label: string; value: string | number; note: string; tone: string }) {
  return <div className="metric-card"><div className={`metric-icon ${tone}`}><Icon size={19} /></div><div className="metric-copy"><span>{label}</span><strong>{value}</strong><small>{note}</small></div></div>;
}

function Dashboard({ documents, logs, onView }: { documents: DocumentItem[]; logs: AuditLog[]; onView: (view: View) => void }) {
  const denied = logs.filter((log) => log.resultado === 'DENEGADO');
  const allowed = logs.filter((log) => log.resultado === 'PERMITIDO');
  const max = Math.max(allowed.length, denied.length, 1);
  return <div className="view-stack"><div className="welcome-row"><div><div className="section-kicker">VISIÓN GENERAL · EN TIEMPO REAL</div><h2>Control de acceso</h2><p className="muted">El perímetro de tus documentos, resumido en una sola vista.</p></div><button className="primary-button" onClick={() => onView('documentos')}><FileText size={16} /> Explorar documentos</button></div><div className="metrics-grid"><Metric icon={FileText} label="Documentos visibles" value={documents.length} note="Filtrados por ABAC" tone="indigo" /><Metric icon={BadgeCheck} label="Accesos permitidos" value={allowed.length} note="En el registro actual" tone="emerald" /><Metric icon={CircleAlert} label="Accesos denegados" value={denied.length} note="RBAC + ABAC" tone="rose" /><Metric icon={ShieldCheck} label="Nivel de seguridad" value={`0${useSession.getState().user?.nivel_seguridad}`} note="Clasificación del usuario" tone="amber" /></div><div className="dashboard-grid"><section className="panel activity-panel"><div className="panel-heading"><div><span className="section-kicker">OBSERVABILIDAD</span><h3>Actividad de autorización</h3></div><button className="text-button" onClick={() => onView('auditoria')}>Ver registro <ArrowRight size={14} /></button></div><div className="bar-chart"><div className="bar-group"><div className="bar-label"><span>Permitido</span><strong>{allowed.length}</strong></div><div className="bar-track"><motion.div initial={{ width: 0 }} animate={{ width: `${(allowed.length / max) * 100}%` }} className="bar-fill emerald" /></div></div><div className="bar-group"><div className="bar-label"><span>Denegado</span><strong>{denied.length}</strong></div><div className="bar-track"><motion.div initial={{ width: 0 }} animate={{ width: `${(denied.length / max) * 100}%` }} className="bar-fill rose" /></div></div></div><div className="activity-foot"><span><i className="dot emerald-dot" /> Decisión autorizada</span><span><i className="dot rose-dot" /> Política bloqueada</span></div></section><section className="panel posture-panel"><div className="panel-heading"><div><span className="section-kicker">POSTURA ACTUAL</span><h3>Perímetro de seguridad</h3></div><ShieldCheck className="posture-shield" size={24} /></div><div className="posture-score"><strong>{documents.length ? 'ACTIVO' : 'RESTRINGIDO'}</strong><span>RBAC + ABAC en cada solicitud</span></div><div className="rule-list"><span><Check size={13} /> Rol validado</span><span><Check size={13} /> Estado ACTIVO</span><span><Check size={13} /> Entorno observable</span></div></section></div><section className="panel recent-panel"><div className="panel-heading"><div><span className="section-kicker">ALCANCE DE DATOS</span><h3>Documentos accesibles</h3></div><button className="text-button" onClick={() => onView('documentos')}>Abrir biblioteca <ArrowRight size={14} /></button></div><div className="mini-docs">{documents.slice(0, 4).map((doc) => <div className="mini-doc" key={doc.id}><span className="doc-type"><FileText size={15} /></span><div><strong>{doc.titulo}</strong><small>{doc.departamento} · Nivel {doc.nivel_confidencialidad}</small></div><span className={`status status-${doc.estado.toLowerCase()}`}>{doc.estado}</span></div>)}</div></section></div>;
}

function PolicyModal({ document, close }: { document: DocumentItem; close: () => void }) {
  const { user, environment } = useSession();
  const checks: Array<[string, boolean, string]> = [
    ['Departamento', user!.rol === 'ADMINISTRADOR' || user!.rol === 'GERENTE' || user!.rol === 'AUDITOR' || user!.departamento === document.departamento, `${user!.departamento} = ${document.departamento}`],
    ['Nivel de seguridad', user!.nivel_seguridad >= document.nivel_confidencialidad, `${user!.nivel_seguridad} >= ${document.nivel_confidencialidad}`],
    ['Estado del usuario', user!.estado === 'ACTIVO', user!.estado],
    ['País / ubicación', user!.pais === document.pais && environment.country === document.pais, `${environment.country} = ${document.pais}`],
    ['Horario confidencial', document.nivel_confidencialidad < 4 || (environment.time >= '08:00' && environment.time <= '18:00'), document.nivel_confidencialidad < 4 ? 'No aplica' : environment.time],
    ['Dispositivo', document.nivel_confidencialidad < 4 || environment.device === 'CORPORATIVO', document.nivel_confidencialidad < 4 ? 'No aplica' : environment.device]
  ];
  const permitted = checks.every(([, result]) => result);
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}><motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="policy-modal"><div className="modal-heading"><div><span className="section-kicker">POLICY ENGINE DECODER</span><h2>{document.titulo}</h2><p className="muted">Evaluación simulada para la acción <strong>READ</strong></p></div><button className="icon-button" onClick={close}><X size={19} /></button></div><div className={`decision-banner ${permitted ? 'allowed' : 'blocked'}`}><span className="decision-icon">{permitted ? <Check size={20} /> : <X size={20} />}</span><div><strong>{permitted ? 'ACCESO AUTORIZADO' : 'ACCESO DENEGADO'}</strong><small>{permitted ? 'RBAC y ABAC cumplen las condiciones actuales.' : 'Una o más políticas bloquean esta solicitud.'}</small></div></div><div className="decoder-grid">{checks.map(([name, pass, value]) => <div className="decoder-row" key={name}><span className={pass ? 'check-pass' : 'check-fail'}>{pass ? <Check size={14} /> : <X size={14} />}</span><div><strong>{name}</strong><small>{value}</small></div><span className={pass ? 'text-pass' : 'text-fail'}>{pass ? 'PASS' : 'BLOCK'}</span></div>)}</div><div className="request-context"><span><Globe2 size={14} /> {environment.country}</span><span><Laptop size={14} /> {environment.device}</span><span><Clock3 size={14} /> {environment.time}</span><span><KeyRound size={14} /> Nivel {user!.nivel_seguridad}</span></div></motion.div></div>;
}

function DocumentView({ documents, reload }: { documents: DocumentItem[]; reload: () => Promise<void> }) {
  const { user, environment } = useSession();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<DocumentItem | null>(null);
  const [notice, setNotice] = useState('');
  const [creating, setCreating] = useState(false);
  const visible = documents.filter((doc) => `${doc.titulo} ${doc.departamento}`.toLowerCase().includes(query.toLowerCase()));
  const perms = permissionByRole[user!.rol];
  const act = async (operation: () => Promise<unknown>, success: string) => { try { await operation(); setNotice(success); await reload(); } catch (err) { setNotice(errorMessage(err)); } };
  return <div className="view-stack"><div className="content-toolbar"><div><div className="section-kicker">BIBLIOTECA PROTEGIDA</div><h2>Documentos</h2><p className="muted">Solo se muestran recursos autorizados por el motor de políticas.</p></div>{perms.includes('crear') && <button className="primary-button" onClick={() => setCreating(true)}><Plus size={16} /> Nuevo documento</button>}</div>{notice && <div className={`notice ${notice.includes('deneg') || notice.includes('insuf') || notice.includes('no ') ? 'notice-error' : ''}`}><Activity size={15} />{notice}<button onClick={() => setNotice('')}><X size={14} /></button></div>}<div className="panel table-panel"><div className="table-toolbar"><div className="search-field"><Search size={16} /><input placeholder="Buscar por título o departamento" value={query} onChange={(e) => setQuery(e.target.value)} /></div><span className="result-count">{visible.length} recursos visibles</span></div><div className="table-wrap"><table><thead><tr><th>ID</th><th>Documento</th><th>Departamento</th><th>Confidencialidad</th><th>Estado</th><th>Propietario</th><th className="align-right">Acciones</th></tr></thead><tbody>{visible.map((doc) => <tr key={doc.id}><td><span className="id-code">DOC-{String(doc.id).padStart(3, '0')}</span></td><td><div className="document-cell"><span className="doc-type"><FileText size={15} /></span><div><strong>{doc.titulo}</strong><small>{doc.descripcion || 'Sin descripción registrada'}</small></div></div></td><td><span className="department"><span className="department-dot" />{doc.departamento}</span></td><td><div className="conf-level"><span>{doc.nivel_confidencialidad}</span><div>{[1,2,3,4,5].map((level) => <i className={level <= doc.nivel_confidencialidad ? (doc.nivel_confidencialidad >= 4 ? 'hot' : 'filled') : ''} key={level} />)}</div></div></td><td><span className={`status status-${doc.estado.toLowerCase()}`}>{doc.estado}</span></td><td><span className="owner">USR-{String(doc.propietario_id).padStart(3, '0')}</span></td><td><div className="row-actions"><button title="Decodificar políticas" onClick={() => setSelected(doc)}><Search size={15} /></button>{perms.includes('modificar') && <button title="Modificar" onClick={() => void act(() => api.updateDocument(doc.id, { titulo: doc.titulo }), 'Documento actualizado correctamente')}><Pencil size={15} /></button>}{perms.includes('aprobar') && doc.estado === 'PENDIENTE' && <button title="Aprobar" className="action-approve" onClick={() => void act(() => api.approveDocument(doc.id), 'Documento aprobado y publicado')}><Check size={15} /></button>}{perms.includes('eliminar') && <button title="Eliminar" className="action-delete" onClick={() => void act(() => api.deleteDocument(doc.id), 'Documento eliminado correctamente')}><Trash2 size={15} /></button>}</div></td></tr>)}</tbody></table>{visible.length === 0 && <div className="empty-state"><Archive size={24} /><strong>No hay documentos visibles</strong><span>El contexto actual está filtrando todos los recursos o no hay coincidencias.</span></div>}</div></div>{selected && <PolicyModal document={selected} close={() => setSelected(null)} />}{creating && <CreateDocumentModal close={() => setCreating(false)} reload={reload} />}</div>;
}

function CreateDocumentModal({ close, reload }: { close: () => void; reload: () => Promise<void> }) {
  const { user } = useSession();
  const [title, setTitle] = useState(''); const [level, setLevel] = useState('1'); const [department, setDepartment] = useState(user!.departamento); const [error, setError] = useState('');
  const create = async () => { try { const departmentIds: Record<string, number> = { SISTEMAS: 1, FINANZAS: 2, RRHH: 3 }; await api.createDocument({ titulo: title, descripcion: 'Documento creado desde SecureDocs', id_departamento: departmentIds[department], nivel_confidencialidad: Number(level), pais: 'PERU', estado: 'PENDIENTE' }); await reload(); close(); } catch (err) { setError(errorMessage(err)); } };
  return <div className="modal-backdrop"><motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="form-modal"><div className="modal-heading"><div><span className="section-kicker">NUEVO RECURSO</span><h2>Crear documento</h2></div><button className="icon-button" onClick={close}><X size={19} /></button></div><div className="form-grid"><label>Título<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Informe de seguridad" /></label><label>Departamento<select value={department} onChange={(e) => setDepartment(e.target.value)}><option>SISTEMAS</option><option>FINANZAS</option><option>RRHH</option></select></label><label>Nivel de confidencialidad<select value={level} onChange={(e) => setLevel(e.target.value)}>{[1,2,3,4,5].map((item) => <option key={item}>{item} · Nivel {item}</option>)}</select></label></div>{error && <div className="error-banner"><CircleAlert size={16} />{error}</div>}<div className="modal-actions"><button className="secondary-button" onClick={close}>Cancelar</button><button className="primary-button" disabled={!title.trim()} onClick={() => void create()}><FilePlus2 size={16} /> Crear documento</button></div></motion.div></div>;
}

function UsersView() {
  const [users, setUsers] = useState<User[]>([]); const [error, setError] = useState('');
  const load = async () => { try { setUsers((await api.getUsers()).data.usuarios); } catch (err) { setError(errorMessage(err)); } };
  useEffect(() => { void load(); }, []);
  const toggle = async (user: User) => { try { await api.setUserStatus(user.id, user.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'); await load(); } catch (err) { setError(errorMessage(err)); } };
  return <div className="view-stack"><div className="content-toolbar"><div><div className="section-kicker">GOBIERNO DE IDENTIDADES</div><h2>Usuarios y roles</h2><p className="muted">Administra atributos de sujeto que participan en ABAC.</p></div><button className="secondary-button" onClick={() => void load()}><Activity size={15} /> Sincronizar</button></div>{error && <div className="error-banner"><CircleAlert size={16} />{error}</div>}<div className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Usuario</th><th>Rol RBAC</th><th>Departamento</th><th>Nivel</th><th>Contrato / País</th><th>Estado</th><th /></tr></thead><tbody>{users.map((item) => <tr key={item.id}><td><div className="document-cell"><span className="avatar small">{initials(item.nombre)}</span><div><strong>{item.nombre}</strong><small>{item.email}</small></div></div></td><td><span className="role-pill">{roleLabel[item.rol]}</span></td><td>{item.departamento}</td><td><span className="security-level">{item.nivel_seguridad}<span>/5</span></span></td><td><span className="country-cell">{item.tipo_contrato} · {item.pais}</span></td><td><span className={`status status-${item.estado.toLowerCase()}`}>{item.estado}</span></td><td><button className="toggle-status" onClick={() => void toggle(item)}>{item.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}</button></td></tr>)}</tbody></table></div></div></div>;
}

function AuditView() {
  const [logs, setLogs] = useState<AuditLog[]>([]); const [query, setQuery] = useState('');
  useEffect(() => { void api.getAuditLogs().then((response) => setLogs(response.data.logs)).catch(() => setLogs([])); }, []);
  const filtered = logs.filter((log) => `${log.usuario} ${log.recurso} ${log.accion}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="view-stack"><div className="content-toolbar"><div><div className="section-kicker">TRAZABILIDAD</div><h2>Registro de auditoría</h2><p className="muted">Cada solicitud deja una decisión y su motivo.</p></div><div className="audit-count"><span className="live-signal" /> {logs.length} EVENTOS</div></div><div className="panel table-panel"><div className="table-toolbar"><div className="search-field"><Search size={16} /><input placeholder="Filtrar eventos" value={query} onChange={(e) => setQuery(e.target.value)} /></div></div><div className="table-wrap"><table><thead><tr><th>Resultado</th><th>Actor</th><th>Acción</th><th>Recurso</th><th>Fecha</th><th>Motivo</th></tr></thead><tbody>{filtered.map((log, index) => <tr key={`${log.id}-${index}`}><td><span className={`result-chip ${log.resultado === 'PERMITIDO' ? 'result-ok' : 'result-denied'}`}>{log.resultado === 'PERMITIDO' ? <Check size={13} /> : <X size={13} />}{log.resultado}</span></td><td>{log.usuario}</td><td><span className="action-code">{log.accion}</span></td><td className="resource-cell">{log.recurso}</td><td>{log.fecha ? new Date(log.fecha).toLocaleString('es-PE') : 'Ahora'}</td><td className="reason-cell">{log.motivo}</td></tr>)}</tbody></table></div></div></div>;
}

const testCases = [
  ['01', 'Empleado consulta documento de su área', 'PERMITIDO', 'ABAC'], ['02', 'Empleado consulta documento de otra área', 'DENEGADO', 'ABAC'],
  ['03', 'Supervisor aprueba documento de su área', 'PERMITIDO', 'RBAC + ABAC'], ['04', 'Empleado intenta aprobar documento', 'DENEGADO', 'RBAC'],
  ['05', 'Nivel 2 consulta documento nivel 4', 'DENEGADO', 'ABAC'], ['06', 'Gerente elimina documento', 'PERMITIDO', 'RBAC + ABAC'],
  ['07', 'Auditor intenta modificar documento', 'DENEGADO', 'RBAC'], ['08', 'Usuario inactivo intenta acceder', 'DENEGADO', 'ABAC'],
  ['09', 'Documento confidencial fuera de horario', 'DENEGADO', 'ABAC'], ['10', 'Nivel 5 desde dispositivo personal', 'DENEGADO', 'ABAC'],
  ['11', 'Invitado accede a documento público', 'PERMITIDO', 'ABAC'], ['12', 'Invitado accede a documento confidencial', 'DENEGADO', 'ABAC']
];
function TestView() {
  return <div className="view-stack"><div className="content-toolbar"><div><div className="section-kicker">VALIDACIÓN DEL LABORATORIO</div><h2>Test suite</h2><p className="muted">Matriz de evidencia para los escenarios RBAC + ABAC requeridos.</p></div><span className="coverage-badge"><Check size={14} /> 12 escenarios definidos</span></div><div className="panel test-panel">{testCases.map(([id, name, expected, layer]) => <div className="test-row" key={id}><span className="test-id">{id}</span><div className="test-name"><strong>{name}</strong><small>Capa evaluada: {layer}</small></div><span className={`expected ${expected === 'PERMITIDO' ? 'expected-ok' : 'expected-denied'}`}>{expected}</span><button className="run-test" title="Ejecutar en API"><Zap size={14} /></button></div>)}</div></div>;
}

function AppShell() {
  const { user, view, setView, environment } = useSession();
  const [documents, setDocuments] = useState<DocumentItem[]>([]); const [logs, setLogs] = useState<AuditLog[]>([]); const [mobileOpen, setMobileOpen] = useState(false); const [loadError, setLoadError] = useState('');
  const reload = async () => { try { const response = await api.getDocuments(); setDocuments(response.data.documentos || []); setLoadError(''); } catch (err) { setLoadError(errorMessage(err)); } };
  useEffect(() => { void reload(); void api.getAuditLogs().then((response) => setLogs(response.data.logs || [])).catch(() => setLogs([])); }, [environment]);
  useEffect(() => { if (user?.rol !== 'ADMINISTRADOR' && view === 'usuarios') setView('dashboard'); }, [user, view, setView]);
  const content = useMemo(() => { if (view === 'dashboard') return <Dashboard documents={documents} logs={logs} onView={setView} />; if (view === 'documentos') return <DocumentView documents={documents} reload={reload} />; if (view === 'usuarios') return <UsersView />; if (view === 'auditoria') return <AuditView />; return <TestView />; }, [documents, logs, reload, setView, view]);
  return <div className="app-shell"><Sidebar mobileOpen={mobileOpen} close={() => setMobileOpen(false)} />{mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />}<main className="main-shell"><TopHeader onMenu={() => setMobileOpen(true)} /><EnvironmentBar /><div className="content-area">{loadError && <div className="error-banner"><CircleAlert size={16} />{loadError}</div>}<AnimatePresence mode="wait"><motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .18 }}>{content}</motion.div></AnimatePresence></div></main></div>;
}

export default function App() {
  const user = useSession((state) => state.user);
  return user ? <AppShell /> : <Login />;
}
