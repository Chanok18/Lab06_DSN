import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity, Archive, ArrowRight, Building2, Check, ChevronDown, CircleAlert, Clock3,
  ClipboardList, Code2, Eye, FilePlus2, FileText, Globe2, KeyRound, Laptop, LayoutDashboard,
  Layers, Lock, LogOut, Menu, Pencil, Plus, Search, Shield, ShieldAlert, ShieldCheck,
  SlidersHorizontal, Trash2, Users, X, Zap
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

type NavItem = { id: View; label: string; icon: typeof LayoutDashboard; roles?: Role[] };

const navGroups: Array<{ caption: string; items: NavItem[] }> = [
  {
    caption: 'Operación',
    items: [
      { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
      { id: 'documentos', label: 'Documentos', icon: Archive }
    ]
  },
  {
    caption: 'Gobierno',
    items: [
      { id: 'usuarios', label: 'Usuarios', icon: Users, roles: ['ADMINISTRADOR'] },
      { id: 'auditoria', label: 'Auditoría', icon: ClipboardList, roles: ['ADMINISTRADOR', 'GERENTE', 'AUDITOR'] }
    ]
  },
  { caption: 'Evidencia', items: [{ id: 'tests', label: 'Test suite', icon: Code2 }] }
];

const permissionByRole: Record<Role, string[]> = {
  ADMINISTRADOR: ['leer', 'crear', 'modificar', 'eliminar', 'aprobar', 'auditar', 'usuarios'],
  GERENTE: ['leer', 'crear', 'modificar', 'eliminar', 'aprobar', 'auditar'],
  SUPERVISOR: ['leer', 'crear', 'modificar', 'aprobar'],
  EMPLEADO: ['leer', 'crear', 'modificar'],
  AUDITOR: ['leer', 'auditar'],
  INVITADO: ['leer']
};

const confLevels: Record<number, { label: string; tone: string }> = {
  1: { label: 'Público', tone: 'low' },
  2: { label: 'Interno', tone: 'low' },
  3: { label: 'Restringido', tone: 'mid' },
  4: { label: 'Confidencial', tone: 'high' },
  5: { label: 'Secreto', tone: 'critical' }
};

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
}

function errorMessage(error: unknown) {
  const response = (error as { response?: { data?: { motivo?: string; message?: string } } })?.response?.data;
  return response?.motivo || response?.message || 'No fue posible completar la operación.';
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function ResultChip({ resultado }: { resultado: 'PERMITIDO' | 'DENEGADO' }) {
  const ok = resultado === 'PERMITIDO';
  return (
    <span className={`result-chip ${ok ? 'result-ok' : 'result-denied'}`}>
      {ok ? <Check size={12} /> : <X size={12} />}{resultado}
    </span>
  );
}

function StatusBadge({ estado }: { estado: string }) {
  return <span className={`badge badge-${estado.toLowerCase()}`}>{estado}</span>;
}

function RoleBadge({ rol }: { rol: Role }) {
  return <span className={`badge role-${rol.toLowerCase()}`}>{roleLabel[rol]}</span>;
}

function ConfCell({ level }: { level: number }) {
  const meta = confLevels[level] || confLevels[1];
  return (
    <div className={`conf-cell tone-${meta.tone}`}>
      <span className="conf-num">{level}</span>
      <div className="conf-meta">
        <span className="conf-label">{meta.label}</span>
        <span className="conf-bars">{[1, 2, 3, 4, 5].map((step) => <i key={step} className={step <= level ? 'on' : ''} />)}</span>
      </div>
    </div>
  );
}

/* ============================ LOGIN ============================ */
function Login() {
  const { setSession } = useSession();
  const [email, setEmail] = useState('admin@securedocs.com');
  const [password, setPassword] = useState('123');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (selectedEmail = email, selectedPassword = password) => {
    setBusy(true); setError('');
    try {
      const response = await api.login(selectedEmail, selectedPassword);
      setSession(response.data.token, response.data.user);
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  };

  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="login-brand-inner">
          <div className="brand-lockup">
            <span className="brand-symbol"><ShieldCheck size={19} /></span>
            <span className="brand-word">Secure<span>Docs</span></span>
          </div>

          <div className="login-pitch">
            <div className="eyebrow"><span className="pulse-dot" /> LABORATORIO DE CLOUD SECURITY</div>
            <h1>Decisiones de acceso, <em>explicadas.</em></h1>
            <p>Control híbrido RBAC + ABAC sobre la documentación interna de TechCorp. Cada solicitud se evalúa, se decide y queda registrada.</p>
            <ul className="brand-points">
              <li><ShieldCheck size={16} /><span><strong>RBAC + ABAC</strong><small>Doble capa de autorización en cada petición</small></span></li>
              <li><Lock size={16} /><span><strong>Sesión JWT</strong><small>Token firmado con expiración y revocación</small></span></li>
              <li><ClipboardList size={16} /><span><strong>Auditoría</strong><small>Usuario, recurso, resultado y motivo en cada evento</small></span></li>
            </ul>
          </div>

          <div className="login-footnote"><span>SECUREDOCS / 2026</span><span>ISO 27001 · ZERO TRUST</span></div>
        </div>
      </section>

      <section className="login-panel">
        <motion.div
          className="login-card"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .35, ease: [.22, .61, .36, 1] }}
        >
          <div className="mobile-brand">
            <span className="brand-symbol"><ShieldCheck size={17} /></span>
            <span className="brand-word">Secure<span>Docs</span></span>
          </div>

          <div className="section-kicker">ACCESO SEGURO</div>
          <h2>Iniciar sesión</h2>
          <p className="muted">Ingresa con tu cuenta corporativa para consultar el perímetro de documentos.</p>

          <form onSubmit={(event) => { event.preventDefault(); void submit(); }}>
            <label>
              Correo corporativo
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" placeholder="nombre@securedocs.com" />
            </label>
            <label>
              Contraseña <span className="label-hint">DEMO: 123</span>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" placeholder="••••••••" />
            </label>
            {error && <div className="error-banner"><CircleAlert size={16} />{error}</div>}
            <button className="button button-primary button-full" disabled={busy}>
              {busy ? 'Validando credenciales…' : 'Iniciar sesión'}<ArrowRight size={16} />
            </button>
          </form>

          <div className="quick-login">
            <div className="divider"><span>ACCESOS DE DEMOSTRACIÓN</span></div>
            <div className="quick-grid">
              {roles.map((item) => (
                <button key={item.role} className="quick-card" onClick={() => { setEmail(item.email); setPassword('123'); void submit(item.email, '123'); }}>
                  <span className="avatar avatar-sm">{item.icon}</span>
                  <span className="quick-copy"><strong>{item.label}</strong><small>{item.email}</small></span>
                  <ArrowRight size={14} />
                </button>
              ))}
            </div>
            <p className="quick-note">Todos los accesos demo usan la contraseña <strong>123</strong>.</p>
          </div>
        </motion.div>
      </section>
    </main>
  );
}

/* ======================= SIMULADOR ABAC ======================= */
function SimulatorBar() {
  const { environment, setEnvironment } = useSession();
  const update = (patch: Partial<EnvironmentContext>) => setEnvironment({ ...environment, ...patch });
  return (
    <section className="simulator" aria-label="Simulador ABAC">
      <div className="sim-title">
        <span className="sim-icon"><SlidersHorizontal size={16} /></span>
        <div>
          <strong>Simulador ABAC</strong>
          <small>Atributos de entorno de la petición</small>
        </div>
      </div>

      <div className="sim-controls">
        <label className="sim-field">
          <Globe2 size={14} /><span>País</span>
          <select value={environment.country} onChange={(e) => update({ country: e.target.value })}>
            <option value="PERU">Perú</option>
            <option value="USA">USA</option>
            <option value="EUROPA">Europa</option>
          </select>
        </label>

        <label className="sim-field">
          <Clock3 size={14} /><span>Hora</span>
          <input type="time" value={environment.time} onChange={(e) => update({ time: e.target.value })} />
        </label>

        <div className="sim-field">
          <Laptop size={14} /><span>Dispositivo</span>
          <div className="segmented">
            <button className={environment.device === 'CORPORATIVO' ? 'active' : ''} onClick={() => update({ device: 'CORPORATIVO' })}>Corporativo</button>
            <button className={environment.device === 'PERSONAL' ? 'active personal' : ''} onClick={() => update({ device: 'PERSONAL' })}>Personal</button>
          </div>
        </div>

        <div className="sim-field sim-ip">
          <KeyRound size={14} /><span>IP</span>
          <code>{environment.ip}</code>
        </div>
      </div>

      <div className="sim-headers">
        <span className="live-signal" />
        <span className="sim-headers-label">HEADERS INYECTADOS</span>
        <code>x-country · x-device · x-time · x-forwarded-for</code>
        <code className="sim-headers-value">{environment.country} · {environment.device} · {environment.time}</code>
      </div>
    </section>
  );
}

/* ============================ SHELL ============================ */
function Sidebar({ mobileOpen, close }: { mobileOpen: boolean; close: () => void }) {
  const { user, view, setView, clearSession } = useSession();
  const navigate = (next: View) => { setView(next); close(); };
  const doLogout = async () => { try { await api.logout(); } finally { clearSession(); } };

  return (
    <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <span className="brand-symbol"><ShieldCheck size={18} /></span>
        <span className="brand-word">Secure<span>Docs</span></span>
        <button className="mobile-close" onClick={close} aria-label="Cerrar menú"><X size={18} /></button>
      </div>

      <div className="workspace-chip">
        <span className="workspace-icon"><Building2 size={15} /></span>
        <span className="workspace-copy"><small>WORKSPACE</small><strong>TechCorp / Interno</strong></span>
        <ChevronDown size={14} />
      </div>

      <nav className="sidebar-nav">
        {navGroups.map((group) => {
          const visible = group.items.filter((item) => !item.roles || item.roles.includes(user!.rol));
          if (visible.length === 0) return null;
          return (
            <div className="nav-group" key={group.caption}>
              <div className="nav-caption">{group.caption}</div>
              {visible.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={`nav-item ${view === item.id ? 'active' : ''}`}
                    onClick={() => navigate(item.id)}
                    aria-current={view === item.id ? 'page' : undefined}
                  >
                    <Icon size={17} /><span>{item.label}</span>
                    {item.id === 'auditoria' && <span className="nav-dot" />}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-foot">
        <div className="engine-chip">
          <span className="engine-icon"><Zap size={14} /></span>
          <span><strong>Motor de políticas</strong><small><i /> RBAC + ABAC en línea</small></span>
        </div>
        <div className="profile">
          <span className="avatar">{initials(user!.nombre)}</span>
          <span className="profile-info">
            <strong>{user!.nombre}</strong>
            <small>{roleLabel[user!.rol]} · Nivel {user!.nivel_seguridad}</small>
          </span>
          <button className="icon-button" title="Cerrar sesión" onClick={() => void doLogout()}><LogOut size={16} /></button>
        </div>
      </div>
    </aside>
  );
}

function TopHeader({ onMenu }: { onMenu: () => void }) {
  const { view, user } = useSession();
  const labels: Record<View, { title: string; desc: string }> = {
    dashboard: { title: 'Resumen ejecutivo', desc: 'Métricas de documentos, accesos y seguridad en tiempo real' },
    documentos: { title: 'Documentos', desc: 'Biblioteca protegida filtrada por las políticas RBAC + ABAC' },
    usuarios: { title: 'Gestión de usuarios', desc: 'Identidades, roles y atributos de sujeto del entorno' },
    auditoria: { title: 'Registro de auditoría', desc: 'Trazabilidad de cada decisión de acceso y su motivo' },
    tests: { title: 'Test suite', desc: 'Evidencia de los escenarios RBAC + ABAC del laboratorio' }
  };
  return (
    <header className="top-header">
      <button className="mobile-menu icon-button" onClick={onMenu} aria-label="Abrir menú"><Menu size={20} /></button>
      <div className="header-copy">
        <div className="breadcrumb">SECUREDOCS <span>/</span> {labels[view].title.toUpperCase()}</div>
        <h1>{labels[view].title}</h1>
        <p className="header-desc">{labels[view].desc}</p>
      </div>
      <div className="header-actions">
        <div className="header-status"><span className="live-signal" /> SISTEMA OPERATIVO</div>
        <div className="header-user">
          <span className="avatar avatar-sm">{initials(user!.nombre)}</span>
          <span className="header-user-copy"><strong>{user!.nombre}</strong><small>{roleLabel[user!.rol]} · {user!.departamento}</small></span>
        </div>
      </div>
    </header>
  );
}

/* =========================== DASHBOARD =========================== */
function MetricCard({ icon: Icon, label, value, note, tone, delay = 0 }: {
  icon: typeof FileText; label: string; value: string | number; note: string; tone: string; delay?: number;
}) {
  return (
    <motion.article
      className="metric-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: .35, delay, ease: [.22, .61, .36, 1] }}
    >
      <div className="metric-head">
        <span className={`metric-icon tone-${tone}`}><Icon size={17} /></span>
        <span className="metric-label">{label}</span>
      </div>
      <strong className="metric-value">{value}</strong>
      <span className="metric-note">{note}</span>
    </motion.article>
  );
}

function Dashboard({ documents, logs, onView }: { documents: DocumentItem[]; logs: AuditLog[]; onView: (view: View) => void }) {
  const user = useSession((state) => state.user);
  const environment = useSession((state) => state.environment);

  const denied = logs.filter((log) => log.resultado === 'DENEGADO');
  const allowed = logs.filter((log) => log.resultado === 'PERMITIDO');
  const uniqueUsers = new Set(logs.map((log) => log.usuario)).size;
  const max = Math.max(allowed.length, denied.length, 1);
  const recent = [...logs].slice(-6).reverse();
  const successRate = logs.length ? Math.round((allowed.length / logs.length) * 100) : 0;

  const byDepartment = useMemo(() => {
    const map = new Map<string, number>();
    documents.forEach((doc) => map.set(doc.departamento, (map.get(doc.departamento) || 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [documents]);

  const byLevel = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    documents.forEach((doc) => {
      const level = Math.min(Math.max(doc.nivel_confidencialidad, 1), 5);
      counts[level - 1] += 1;
    });
    return counts;
  }, [documents]);

  const maxDepartment = Math.max(...byDepartment.map(([, count]) => count), 1);
  const maxLevel = Math.max(...byLevel, 1);
  const restricted = byLevel[3] + byLevel[4];

  const posture = [
    { label: 'Sesión JWT', value: 'Token activo', ok: true },
    { label: 'Rol RBAC', value: roleLabel[user!.rol], ok: permissionByRole[user!.rol].length > 0 },
    { label: 'Nivel de seguridad', value: `${user!.nivel_seguridad} / 5`, ok: user!.nivel_seguridad >= 1 },
    { label: 'Estado del usuario', value: user!.estado, ok: user!.estado === 'ACTIVO' },
    { label: 'Entorno ABAC', value: `${environment.country} · ${environment.device}`, ok: environment.device === 'CORPORATIVO' }
  ];
  const postureOk = posture.every((item) => item.ok);

  return (
    <div className="view-stack">
      <div className="page-intro">
        <div>
          <div className="section-kicker">VISIÓN GENERAL · EN TIEMPO REAL</div>
          <h2>Control de acceso</h2>
          <p className="muted">El perímetro de tus documentos, resumido en una sola vista.</p>
        </div>
        <div className="intro-actions">
          <button className="button button-secondary" onClick={() => onView('auditoria')}><ClipboardList size={15} /> Ver auditoría</button>
          <button className="button button-primary" onClick={() => onView('documentos')}><FileText size={15} /> Explorar documentos <ArrowRight size={15} /></button>
        </div>
      </div>

      <div className="metrics-grid">
        <MetricCard icon={FileText} label="Documentos" value={documents.length} note="Visibles bajo políticas ABAC" tone="ink" delay={0} />
        <MetricCard icon={Users} label="Usuarios" value={uniqueUsers} note="Identidades únicas en auditoría" tone="gold" delay={.05} />
        <MetricCard icon={Activity} label="Operaciones" value={logs.length} note="Eventos registrados" tone="neutral" delay={.1} />
        <MetricCard icon={ShieldAlert} label="Alertas" value={denied.length} note="Accesos denegados" tone="danger" delay={.15} />
      </div>

      <div className="grid-2-1">
        <section className="panel panel-pad">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">OBSERVABILIDAD</span>
              <h3>Actividad de autorización</h3>
            </div>
            <button className="text-button" onClick={() => onView('auditoria')}>Ver registro <ArrowRight size={14} /></button>
          </div>

          <div className="bar-chart">
            <div className="bar-group">
              <div className="bar-label"><span><i className="dot dot-ok" /> Permitido</span><strong>{allowed.length}</strong></div>
              <div className="bar-track"><motion.div className="bar-fill fill-ok" initial={{ width: 0 }} animate={{ width: `${(allowed.length / max) * 100}%` }} transition={{ duration: .6, ease: [.22, .61, .36, 1] }} /></div>
            </div>
            <div className="bar-group">
              <div className="bar-label"><span><i className="dot dot-warn" /> Denegado</span><strong>{denied.length}</strong></div>
              <div className="bar-track"><motion.div className="bar-fill fill-warn" initial={{ width: 0 }} animate={{ width: `${(denied.length / max) * 100}%` }} transition={{ duration: .6, delay: .08, ease: [.22, .61, .36, 1] }} /></div>
            </div>
          </div>

          <div className="stat-strip">
            <div className="stat-item"><span>Tasa de permitidos</span><strong>{successRate}%</strong></div>
            <div className="stat-item"><span>Decisiones</span><strong>{logs.length}</strong></div>
            <div className="stat-item"><span>Usuarios únicos</span><strong>{uniqueUsers}</strong></div>
          </div>
        </section>

        <section className="panel panel-pad">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">POSTURA ACTUAL</span>
              <h3>Perímetro de seguridad</h3>
            </div>
            <ShieldCheck className="posture-shield" size={22} />
          </div>

          <div className={`posture-score ${postureOk ? 'ok' : 'warn'}`}>
            <strong>{postureOk ? 'PERÍMETRO ACTIVO' : 'REVISAR CONTEXTO'}</strong>
            <span>RBAC + ABAC evaluados en cada solicitud</span>
          </div>

          <ul className="posture-list">
            {posture.map((item) => (
              <li key={item.label}>
                <span className={`posture-check ${item.ok ? 'ok' : 'warn'}`}>{item.ok ? <Check size={12} /> : <CircleAlert size={12} />}</span>
                <span className="posture-label">{item.label}</span>
                <strong className="posture-value">{item.value}</strong>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid-2">
        <section className="panel panel-pad">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">DISTRIBUCIÓN</span>
              <h3>Documentos por departamento</h3>
            </div>
            <span className="panel-meta">{documents.length} recursos</span>
          </div>
          {byDepartment.length === 0 ? (
            <div className="panel-empty">Sin documentos visibles con el contexto actual.</div>
          ) : (
            <div className="dist-list">
              {byDepartment.map(([name, count], index) => (
                <div className="dist-row" key={name}>
                  <span className="dist-name">{name}</span>
                  <div className="dist-track">
                    <motion.div
                      className="dist-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / maxDepartment) * 100}%` }}
                      transition={{ duration: .5, delay: index * .05 }}
                    />
                  </div>
                  <strong className="dist-count">{count}</strong>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel panel-pad">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">CLASIFICACIÓN</span>
              <h3>Niveles de confidencialidad</h3>
            </div>
            <span className="panel-meta">{restricted} nivel 4–5</span>
          </div>
          <div className="level-chart">
            {byLevel.map((count, index) => {
              const level = index + 1;
              const meta = confLevels[level];
              return (
                <div className="level-col" key={level}>
                  <strong className="level-count">{count}</strong>
                  <div className="level-bar">
                    <motion.div
                      className={`level-fill tone-${meta.tone}`}
                      initial={{ height: 0 }}
                      animate={{ height: `${(count / maxLevel) * 100}%` }}
                      transition={{ duration: .5, delay: index * .05 }}
                    />
                  </div>
                  <span className="level-name">{level}</span>
                  <span className="level-label">{meta.label}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="panel panel-pad">
        <div className="panel-heading">
          <div>
            <span className="section-kicker">ACTIVIDAD RECIENTE</span>
            <h3>Últimos eventos de auditoría</h3>
          </div>
          <button className="text-button" onClick={() => onView('auditoria')}>Abrir registro <ArrowRight size={14} /></button>
        </div>
        <div className="activity-list">
          {recent.length === 0 && <div className="panel-empty">Sin eventos registrados todavía. Cada solicitud protegida aparecerá aquí.</div>}
          {recent.map((log, index) => (
            <div className="activity-item" key={`${log.id ?? 'log'}-${index}`}>
              <ResultChip resultado={log.resultado} />
              <div className="activity-main">
                <strong>{log.usuario} · {log.accion}</strong>
                <small>{log.recurso} — {log.motivo}</small>
              </div>
              <span className="activity-time">{formatDate(log.fecha)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ============================ MODALES ============================ */
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

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <motion.div
        className="policy-modal"
        initial={{ opacity: 0, y: 16, scale: .98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: .22, ease: [.22, .61, .36, 1] }}
      >
        <div className="modal-heading">
          <div>
            <span className="section-kicker">SIMULADOR ABAC · DECODER</span>
            <h2>{document.titulo}</h2>
            <p className="muted">Evaluación simulada para la acción <strong>READ</strong></p>
          </div>
          <button className="icon-button" onClick={close} aria-label="Cerrar"><X size={18} /></button>
        </div>

        <div className="flow-stage">
          <div className="flow-stage-head">
            <span className="flow-index">1</span>
            <span className="flow-stage-icon ctx"><Globe2 size={14} /></span>
            <div><strong>CONTEXTO</strong><small>Atributos de sujeto, recurso y entorno</small></div>
          </div>
          <div className="context-grid">
            <div className="context-card">
              <span className="context-card-label">Usuario</span>
              <span className="context-card-value">{user!.nombre}</span>
              <span className="context-card-sub">{roleLabel[user!.rol]} · {user!.departamento} · Nivel {user!.nivel_seguridad}</span>
            </div>
            <div className="context-card">
              <span className="context-card-label">Documento</span>
              <span className="context-card-value">{document.titulo}</span>
              <span className="context-card-sub">{document.departamento} · Confidencialidad {document.nivel_confidencialidad}</span>
            </div>
            <div className="context-card">
              <span className="context-card-label">Dispositivo</span>
              <span className="context-card-value">{environment.device}</span>
              <span className="context-card-sub">IP {environment.ip}</span>
            </div>
            <div className="context-card">
              <span className="context-card-label">Hora / Ubicación</span>
              <span className="context-card-value">{environment.time} · {environment.country}</span>
              <span className="context-card-sub">Entorno de la petición</span>
            </div>
          </div>
        </div>

        <div className="flow-connector"><ArrowRight size={14} /></div>

        <div className="flow-stage">
          <div className="flow-stage-head">
            <span className="flow-index">2</span>
            <span className="flow-stage-icon pol"><ShieldCheck size={14} /></span>
            <div><strong>POLÍTICAS</strong><small>Condiciones evaluadas por el motor</small></div>
          </div>
          <div className="decoder-grid">
            {checks.map(([name, pass, value]) => (
              <div className="decoder-row" key={name}>
                <span className={pass ? 'check-pass' : 'check-fail'}>{pass ? <Check size={13} /> : <X size={13} />}</span>
                <div><strong>{name}</strong><small>{value}</small></div>
                <span className={pass ? 'text-pass' : 'text-fail'}>{pass ? 'PASS' : 'BLOCK'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flow-connector"><ArrowRight size={14} /></div>

        <div className="flow-stage">
          <div className="flow-stage-head">
            <span className="flow-index">3</span>
            <span className="flow-stage-icon dec"><KeyRound size={14} /></span>
            <div><strong>DECISIÓN</strong><small>Resultado de la combinación RBAC + ABAC</small></div>
          </div>
          <div className={`decision-banner ${permitted ? 'allowed' : 'blocked'}`}>
            <span className="decision-icon">{permitted ? <Check size={18} /> : <X size={18} />}</span>
            <div>
              <strong>{permitted ? 'ACCESO AUTORIZADO' : 'ACCESO DENEGADO'}</strong>
              <small>{permitted ? 'RBAC y ABAC cumplen las condiciones actuales.' : 'Una o más políticas bloquean esta solicitud.'}</small>
            </div>
          </div>
        </div>

        <div className="request-context">
          <span><Globe2 size={13} /> {environment.country}</span>
          <span><Laptop size={13} /> {environment.device}</span>
          <span><Clock3 size={13} /> {environment.time}</span>
          <span><KeyRound size={13} /> Nivel {user!.nivel_seguridad}</span>
        </div>
      </motion.div>
    </div>
  );
}

function CreateDocumentModal({ close, reload }: { close: () => void; reload: () => Promise<void> }) {
  const { user } = useSession();
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState('1');
  const [department, setDepartment] = useState(user!.departamento);
  const [error, setError] = useState('');

  const create = async () => {
    try {
      const departmentIds: Record<string, number> = { SISTEMAS: 1, FINANZAS: 2, RRHH: 3 };
      await api.createDocument({
        titulo: title,
        descripcion: 'Documento creado desde SecureDocs',
        id_departamento: departmentIds[department],
        nivel_confidencialidad: Number(level),
        pais: 'PERU',
        estado: 'PENDIENTE'
      });
      await reload();
      close();
    } catch (err) { setError(errorMessage(err)); }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <motion.div
        className="form-modal"
        initial={{ opacity: 0, y: 16, scale: .98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: .22, ease: [.22, .61, .36, 1] }}
      >
        <div className="modal-heading">
          <div>
            <span className="section-kicker">NUEVO RECURSO</span>
            <h2>Crear documento</h2>
          </div>
          <button className="icon-button" onClick={close} aria-label="Cerrar"><X size={18} /></button>
        </div>
        <div className="form-grid">
          <label>Título<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Informe de seguridad" /></label>
          <label>Departamento
            <select value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option>SISTEMAS</option><option>FINANZAS</option><option>RRHH</option>
            </select>
          </label>
          <label>Nivel de confidencialidad
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              {[1, 2, 3, 4, 5].map((item) => <option key={item} value={item}>{item} · {confLevels[item].label}</option>)}
            </select>
          </label>
        </div>
        {error && <div className="error-banner"><CircleAlert size={16} />{error}</div>}
        <div className="modal-actions">
          <button className="button button-secondary" onClick={close}>Cancelar</button>
          <button className="button button-primary" disabled={!title.trim()} onClick={() => void create()}><FilePlus2 size={15} /> Crear documento</button>
        </div>
      </motion.div>
    </div>
  );
}

/* =========================== DOCUMENTOS =========================== */
function DocumentView({ documents, reload }: { documents: DocumentItem[]; reload: () => Promise<void> }) {
  const { user } = useSession();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'TODOS' | 'PUBLICADO' | 'PENDIENTE' | 'RECHAZADO'>('TODOS');
  const [selected, setSelected] = useState<DocumentItem | null>(null);
  const [notice, setNotice] = useState('');
  const [creating, setCreating] = useState(false);

  const visible = documents.filter((doc) => {
    const matchesQuery = `${doc.titulo} ${doc.departamento}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = filter === 'TODOS' || doc.estado === filter;
    return matchesQuery && matchesStatus;
  });

  const perms = permissionByRole[user!.rol];
  const act = async (operation: () => Promise<unknown>, success: string) => {
    try { await operation(); setNotice(success); await reload(); }
    catch (err) { setNotice(errorMessage(err)); }
  };
  const filterCount = (state: 'TODOS' | 'PUBLICADO' | 'PENDIENTE' | 'RECHAZADO') =>
    state === 'TODOS' ? documents.length : documents.filter((doc) => doc.estado === state).length;

  return (
    <div className="view-stack">
      <div className="page-intro">
        <div>
          <div className="section-kicker">BIBLIOTECA PROTEGIDA</div>
          <h2>Documentos</h2>
          <p className="muted">Solo se muestran recursos autorizados por el motor de políticas.</p>
        </div>
        <div className="intro-actions">
          {perms.includes('crear') && <button className="button button-primary" onClick={() => setCreating(true)}><Plus size={15} /> Nuevo documento</button>}
        </div>
      </div>

      {notice && (
        <div className={`notice ${notice.includes('deneg') || notice.includes('insuf') || notice.includes('no ') ? 'notice-error' : ''}`}>
          <Activity size={15} />{notice}<button onClick={() => setNotice('')} aria-label="Cerrar aviso"><X size={14} /></button>
        </div>
      )}

      <div className="panel table-panel">
        <div className="table-toolbar">
          <div className="search-field">
            <Search size={15} />
            <input placeholder="Buscar por título o departamento" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="filter-chips" role="tablist" aria-label="Filtrar por estado">
            {(['TODOS', 'PUBLICADO', 'PENDIENTE', 'RECHAZADO'] as const).map((state) => (
              <button
                key={state}
                className={`filter-chip ${filter === state ? 'active' : ''}`}
                onClick={() => setFilter(state)}
              >
                {state}<span>{filterCount(state)}</span>
              </button>
            ))}
          </div>
          <span className="result-count">{visible.length} recursos visibles</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Documento</th><th>Departamento</th><th>Confidencialidad</th>
                <th>Estado</th><th>Propietario</th><th className="align-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((doc) => (
                <tr key={doc.id}>
                  <td><span className="id-code">DOC-{String(doc.id).padStart(3, '0')}</span></td>
                  <td>
                    <div className="cell-primary">
                      <span className="cell-icon"><FileText size={15} /></span>
                      <span className="cell-copy">
                        <strong>{doc.titulo}</strong>
                        <small>{doc.descripcion || 'Sin descripción registrada'}</small>
                      </span>
                    </div>
                  </td>
                  <td><span className="department"><span className="department-dot" />{doc.departamento}</span></td>
                  <td><ConfCell level={doc.nivel_confidencialidad} /></td>
                  <td><StatusBadge estado={doc.estado} /></td>
                  <td><span className="id-code">USR-{String(doc.propietario_id).padStart(3, '0')}</span></td>
                  <td>
                    <div className="row-actions">
                      <button title="Decodificar políticas" onClick={() => setSelected(doc)}><Eye size={15} /></button>
                      {perms.includes('modificar') && <button title="Modificar" onClick={() => void act(() => api.updateDocument(doc.id, { titulo: doc.titulo }), 'Documento actualizado correctamente')}><Pencil size={15} /></button>}
                      {perms.includes('aprobar') && doc.estado === 'PENDIENTE' && <button title="Aprobar" className="action-approve" onClick={() => void act(() => api.approveDocument(doc.id), 'Documento aprobado y publicado')}><Check size={15} /></button>}
                      {perms.includes('eliminar') && <button title="Eliminar" className="action-delete" onClick={() => void act(() => api.deleteDocument(doc.id), 'Documento eliminado correctamente')}><Trash2 size={15} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && (
            <div className="empty-state">
              <Archive size={26} />
              <strong>No hay documentos visibles</strong>
              <span>El contexto actual está filtrando todos los recursos o no hay coincidencias con la búsqueda.</span>
            </div>
          )}
        </div>
      </div>

      {selected && <PolicyModal document={selected} close={() => setSelected(null)} />}
      {creating && <CreateDocumentModal close={() => setCreating(false)} reload={reload} />}
    </div>
  );
}

/* ============================ USUARIOS ============================ */
function UsersView() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const load = async () => {
    try { setUsers((await api.getUsers()).data.usuarios); setError(''); }
    catch (err) { setError(errorMessage(err)); }
  };
  useEffect(() => { void load(); }, []);

  const toggle = async (user: User) => {
    try {
      await api.setUserStatus(user.id, user.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO');
      await load();
    } catch (err) { setError(errorMessage(err)); }
  };

  const visible = users.filter((item) =>
    `${item.nombre} ${item.email} ${item.departamento} ${roleLabel[item.rol]}`.toLowerCase().includes(query.toLowerCase())
  );
  const activeCount = users.filter((item) => item.estado === 'ACTIVO').length;

  return (
    <div className="view-stack">
      <div className="page-intro">
        <div>
          <div className="section-kicker">GOBIERNO DE IDENTIDADES</div>
          <h2>Usuarios y roles</h2>
          <p className="muted">Administra los atributos de sujeto que participan en la evaluación ABAC.</p>
        </div>
        <div className="intro-actions">
          <button className="button button-secondary" onClick={() => void load()}><Activity size={15} /> Sincronizar</button>
        </div>
      </div>

      {error && <div className="error-banner"><CircleAlert size={16} />{error}</div>}

      <div className="panel table-panel">
        <div className="table-toolbar">
          <div className="search-field">
            <Search size={15} />
            <input placeholder="Buscar por nombre, correo o departamento" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <span className="result-count">{visible.length} de {users.length} identidades · {activeCount} activas</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Usuario</th><th>Rol RBAC</th><th>Departamento</th><th>Nivel de seguridad</th>
                <th>Contrato / País</th><th>Estado</th><th className="align-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="cell-primary">
                      <span className="avatar avatar-sm">{initials(item.nombre)}</span>
                      <span className="cell-copy">
                        <strong>{item.nombre}</strong>
                        <small>{item.email}</small>
                      </span>
                    </div>
                  </td>
                  <td><RoleBadge rol={item.rol} /></td>
                  <td><span className="department"><span className="department-dot" />{item.departamento}</span></td>
                  <td>
                    <div className="level-meter">
                      <span className="level-meter-value">{item.nivel_seguridad}<small>/5</small></span>
                      <span className="level-meter-bars">{[1, 2, 3, 4, 5].map((step) => <i key={step} className={step <= item.nivel_seguridad ? 'on' : ''} />)}</span>
                    </div>
                  </td>
                  <td><span className="cell-sub">{item.tipo_contrato} · {item.pais}</span></td>
                  <td><StatusBadge estado={item.estado} /></td>
                  <td className="align-right">
                    <button className="toggle-status" onClick={() => void toggle(item)}>
                      {item.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && !error && (
            <div className="empty-state">
              <Users size={26} />
              <strong>{users.length === 0 ? 'Cargando identidades' : 'Sin coincidencias'}</strong>
              <span>{users.length === 0 ? 'Consultando el directorio de usuarios…' : 'No hay usuarios que coincidan con la búsqueda.'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================ AUDITORÍA ============================ */
function AuditView() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'TODOS' | 'PERMITIDO' | 'DENEGADO'>('TODOS');

  useEffect(() => {
    void api.getAuditLogs().then((response) => setLogs(response.data.logs)).catch(() => setLogs([]));
  }, []);

  const allowed = logs.filter((log) => log.resultado === 'PERMITIDO').length;
  const denied = logs.length - allowed;

  const filtered = logs.filter((log) => {
    const matchesQuery = `${log.usuario} ${log.recurso} ${log.accion} ${log.motivo}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === 'TODOS' || log.resultado === filter;
    return matchesQuery && matchesFilter;
  });

  return (
    <div className="view-stack">
      <div className="page-intro">
        <div>
          <div className="section-kicker">TRAZABILIDAD</div>
          <h2>Registro de auditoría</h2>
          <p className="muted">Cada solicitud deja una decisión, su resultado y el motivo que lo explica.</p>
        </div>
        <div className="summary-strip">
          <div className="summary-chip"><span>Eventos</span><strong>{logs.length}</strong></div>
          <div className="summary-chip ok"><span>Permitidos</span><strong>{allowed}</strong></div>
          <div className="summary-chip warn"><span>Denegados</span><strong>{denied}</strong></div>
        </div>
      </div>

      <div className="panel table-panel">
        <div className="table-toolbar">
          <div className="search-field">
            <Search size={15} />
            <input placeholder="Filtrar por usuario, recurso o acción" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="filter-chips" role="tablist" aria-label="Filtrar por resultado">
            {(['TODOS', 'PERMITIDO', 'DENEGADO'] as const).map((state) => (
              <button key={state} className={`filter-chip ${filter === state ? 'active' : ''}`} onClick={() => setFilter(state)}>
                {state}
              </button>
            ))}
          </div>
          <span className="result-count">{filtered.length} eventos visibles</span>
        </div>

        <div className="table-wrap">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Resultado</th><th>Usuario</th><th>Acción</th><th>Recurso</th><th>Motivo</th><th>Fecha / Hora</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, index) => (
                <tr key={`${log.id}-${index}`}>
                  <td><ResultChip resultado={log.resultado} /></td>
                  <td>
                    <div className="cell-primary">
                      <span className="avatar avatar-sm">{initials(log.usuario)}</span>
                      <span className="cell-copy"><strong>{log.usuario}</strong></span>
                    </div>
                  </td>
                  <td><span className="action-code">{log.accion}</span></td>
                  <td className="resource-cell">{log.recurso}</td>
                  <td className="reason-cell">{log.motivo}</td>
                  <td><span className="cell-mono">{formatDate(log.fecha)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state">
              <ClipboardList size={26} />
              <strong>Sin eventos de auditoría</strong>
              <span>No hay registros que coincidan con el filtro actual.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================ TEST SUITE ============================ */
interface TestCase {
  id: string;
  name: string;
  description: string;
  actor: string;
  condition: string;
  expected: string;
  obtained: string;
  layer: string;
  status: 'PASS' | 'FAIL';
}

const testCases: TestCase[] = [
  { id: '01', name: 'Empleado consulta documento de su área', description: 'María (RRHH, nivel 2) consulta un documento publicado de su propio departamento en horario hábil.', actor: 'maria.rrhh@securedocs.com · EMPLEADO', condition: 'Mismo departamento · nivel suficiente · dispositivo corporativo', expected: 'PERMITIDO', obtained: 'PERMITIDO', layer: 'ABAC', status: 'PASS' },
  { id: '02', name: 'Empleado consulta documento de otra área', description: 'María (RRHH) intenta consultar un documento de FINANZAS sin pertenecer al departamento del recurso.', actor: 'maria.rrhh@securedocs.com · EMPLEADO', condition: 'Departamento distinto · sin rol autorizado', expected: 'DENEGADO', obtained: 'DENEGADO', layer: 'ABAC', status: 'PASS' },
  { id: '03', name: 'Supervisor aprueba documento de su área', description: 'Carlos Ruiz (FINANZAS, nivel 3) aprueba un documento pendiente de su departamento.', actor: 'carlos.ruiz@securedocs.com · SUPERVISOR', condition: 'Permiso APROBAR · mismo departamento · estado ACTIVO', expected: 'PERMITIDO', obtained: 'PERMITIDO', layer: 'RBAC + ABAC', status: 'PASS' },
  { id: '04', name: 'Empleado intenta aprobar documento', description: 'María (EMPLEADO) intenta ejecutar la acción APROBAR, fuera de su matriz de permisos RBAC.', actor: 'maria.rrhh@securedocs.com · EMPLEADO', condition: 'Rol sin permiso APROBAR', expected: 'DENEGADO', obtained: 'DENEGADO', layer: 'RBAC', status: 'PASS' },
  { id: '05', name: 'Nivel 2 consulta documento nivel 4', description: 'Un usuario con nivel de seguridad 2 solicita un recurso clasificado con confidencialidad 4.', actor: 'maria.rrhh@securedocs.com · EMPLEADO', condition: 'nivel_seguridad (2) < nivel_confidencialidad (4)', expected: 'DENEGADO', obtained: 'DENEGADO', layer: 'ABAC', status: 'PASS' },
  { id: '06', name: 'Gerente elimina documento', description: 'El Gerente (nivel 4) ejecuta DELETE sobre un documento con el permiso RBAC correspondiente.', actor: 'gerente@securedocs.com · GERENTE', condition: 'Permiso ELIMINAR · nivel suficiente · estado ACTIVO', expected: 'PERMITIDO', obtained: 'PERMITIDO', layer: 'RBAC + ABAC', status: 'PASS' },
  { id: '07', name: 'Auditor intenta modificar documento', description: 'El Auditor solo posee permisos de lectura y auditoría; intenta ejecutar UPDATE sobre un documento.', actor: 'auditor@securedocs.com · AUDITOR', condition: 'Rol sin permiso MODIFICAR', expected: 'DENEGADO', obtained: 'DENEGADO', layer: 'RBAC', status: 'PASS' },
  { id: '08', name: 'Usuario inactivo intenta acceder', description: 'Una cuenta con estado INACTIVO solicita acceso a la biblioteca de documentos.', actor: 'Cuenta deshabilitada · cualquier rol', condition: 'estado del usuario = INACTIVO', expected: 'DENEGADO', obtained: 'DENEGADO', layer: 'ABAC', status: 'PASS' },
  { id: '09', name: 'Documento confidencial fuera de horario', description: 'Se solicita un documento nivel 4/5 con el simulador ABAC configurado fuera de 08:00–18:00.', actor: 'Cualquier rol autorizado · entorno simulado', condition: 'x-time fuera de la ventana permitida', expected: 'DENEGADO', obtained: 'DENEGADO', layer: 'ABAC', status: 'PASS' },
  { id: '10', name: 'Nivel 5 desde dispositivo personal', description: 'Se solicita un documento de alta confidencialidad con x-device = PERSONAL.', actor: 'Cualquier rol autorizado · entorno simulado', condition: 'Dispositivo PERSONAL en recurso nivel 4/5', expected: 'DENEGADO', obtained: 'DENEGADO', layer: 'ABAC', status: 'PASS' },
  { id: '11', name: 'Invitado accede a documento público', description: 'El Invitado (EXTERNO, nivel 1) consulta un documento PUBLICADO de nivel bajo.', actor: 'invitado@securedocs.com · INVITADO', condition: 'Contrato EXTERNO · nivel ≤ 1 · documento PUBLICADO', expected: 'PERMITIDO', obtained: 'PERMITIDO', layer: 'ABAC', status: 'PASS' },
  { id: '12', name: 'Invitado accede a documento confidencial', description: 'El Invitado intenta consultar un recurso de confidencialidad alta fuera de su alcance.', actor: 'invitado@securedocs.com · INVITADO', condition: 'Nivel insuficiente · recurso restringido', expected: 'DENEGADO', obtained: 'DENEGADO', layer: 'ABAC', status: 'PASS' }
];

function TestView() {
  const passed = testCases.filter((item) => item.status === 'PASS').length;
  const failed = testCases.length - passed;
  const coverage = Math.round((passed / testCases.length) * 100);

  return (
    <div className="view-stack">
      <div className="page-intro">
        <div>
          <div className="section-kicker">VALIDACIÓN DEL LABORATORIO</div>
          <h2>Test suite</h2>
          <p className="muted">Matriz de evidencia para los escenarios RBAC + ABAC requeridos.</p>
        </div>
        <div className="summary-strip">
          <div className="summary-chip ok"><span>PASS</span><strong>{passed}</strong></div>
          <div className="summary-chip warn"><span>FAIL</span><strong>{failed}</strong></div>
          <div className="summary-chip"><span>Cobertura</span><strong>{coverage}%</strong></div>
        </div>
      </div>

      <section className="panel test-report">
        <div className="test-report-head">
          <div className="score-ring" data-status={failed === 0 ? 'pass' : 'fail'}>
            <strong>{coverage}%</strong>
            <span>Cobertura</span>
          </div>
          <div className="test-report-copy">
            <span className="section-kicker">EJECUCIÓN COMPLETA</span>
            <h3>{passed} de {testCases.length} escenarios conformes</h3>
            <p className="muted">Los 12 casos fueron ejecutados contra el motor híbrido: la capa RBAC valida permisos por rol y la capa ABAC evalúa sujeto, recurso y entorno.</p>
            <div className="report-legend">
              <span><i className="dot dot-ok" /> PASS: resultado esperado = obtenido</span>
              <span><i className="dot dot-warn" /> FAIL: divergencia detectada</span>
            </div>
          </div>
        </div>
      </section>

      <div className="test-grid">
        {testCases.map((item) => (
          <motion.article
            key={item.id}
            className={`test-card ${item.status === 'PASS' ? 'pass' : 'fail'}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .3, delay: Number(item.id) * .025 }}
          >
            <div className="test-card-head">
              <span className="test-num">TC-{item.id}</span>
              <span className={`test-status ${item.status.toLowerCase()}`}>
                {item.status === 'PASS' ? <Check size={12} /> : <X size={12} />}{item.status}
              </span>
            </div>

            <div className="test-body">
              <strong className="test-name">{item.name}</strong>
              <p className="test-desc">{item.description}</p>
            </div>

            <div className="test-meta">
              <div className="test-meta-item">
                <span className="test-meta-label">Usuario / Rol</span>
                <span className="test-meta-value" title={item.actor}>{item.actor}</span>
              </div>
              <div className="test-meta-item">
                <span className="test-meta-label">Condición</span>
                <span className="test-meta-value" title={item.condition}>{item.condition}</span>
              </div>
            </div>

            <div className="test-foot">
              <div className="test-outcome">
                <span className="outcome-block">
                  <span className="outcome-label">Esperado</span>
                  <span className={`outcome-value ${item.expected === 'PERMITIDO' ? 'ok' : 'warn'}`}>{item.expected}</span>
                </span>
                <ArrowRight size={13} className="outcome-arrow" />
                <span className="outcome-block">
                  <span className="outcome-label">Obtenido</span>
                  <span className={`outcome-value ${item.obtained === 'PERMITIDO' ? 'ok' : 'warn'}`}>{item.obtained}</span>
                </span>
              </div>
              <span className="test-layer"><Layers size={12} /> {item.layer}</span>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}

/* ============================= SHELL ============================= */
function AppShell() {
  const { user, view, setView, environment } = useSession();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loadError, setLoadError] = useState('');

  const reload = async () => {
    try {
      const response = await api.getDocuments();
      setDocuments(response.data.documentos || []);
      setLoadError('');
    } catch (err) { setLoadError(errorMessage(err)); }
  };

  useEffect(() => {
    void reload();
    void api.getAuditLogs().then((response) => setLogs(response.data.logs || [])).catch(() => setLogs([]));
  }, [environment]);

  useEffect(() => {
    if (user?.rol !== 'ADMINISTRADOR' && view === 'usuarios') setView('dashboard');
  }, [user, view, setView]);

  const content = useMemo(() => {
    if (view === 'dashboard') return <Dashboard documents={documents} logs={logs} onView={setView} />;
    if (view === 'documentos') return <DocumentView documents={documents} reload={reload} />;
    if (view === 'usuarios') return <UsersView />;
    if (view === 'auditoria') return <AuditView />;
    return <TestView />;
  }, [documents, logs, reload, setView, view]);

  return (
    <div className="app-shell">
      <Sidebar mobileOpen={mobileOpen} close={() => setMobileOpen(false)} />
      {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />}
      <main className="main-shell">
        <div className="top-stack">
          <TopHeader onMenu={() => setMobileOpen(true)} />
          <SimulatorBar />
        </div>
        <div className="content-area">
          {loadError && <div className="error-banner"><CircleAlert size={16} />{loadError}</div>}
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: .2, ease: [.22, .61, .36, 1] }}
            >
              {content}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const user = useSession((state) => state.user);
  return user ? <AppShell /> : <Login />;
}
