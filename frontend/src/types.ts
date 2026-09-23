export type Role = 'ADMINISTRADOR' | 'GERENTE' | 'SUPERVISOR' | 'EMPLEADO' | 'AUDITOR' | 'INVITADO';
export type View = 'dashboard' | 'documentos' | 'usuarios' | 'auditoria' | 'tests';

export interface User {
  id: number;
  nombre: string;
  email?: string;
  rol: Role;
  departamento: string;
  nivel_seguridad: number;
  pais: string;
  tipo_contrato: 'INTERNO' | 'EXTERNO';
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface DocumentItem {
  id: number;
  titulo: string;
  descripcion?: string;
  id_departamento?: number;
  departamento: string;
  nivel_confidencialidad: number;
  estado: 'PENDIENTE' | 'PUBLICADO' | 'RECHAZADO';
  pais: string;
  propietario_id: number;
  fecha_creacion?: string;
}

export interface AuditLog {
  id?: number;
  usuario: string;
  recurso: string;
  accion: string;
  fecha?: string;
  resultado: 'PERMITIDO' | 'DENEGADO';
  motivo: string;
}

export interface EnvironmentContext {
  country: string;
  device: 'CORPORATIVO' | 'PERSONAL';
  time: string;
  ip: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  message: string;
}
