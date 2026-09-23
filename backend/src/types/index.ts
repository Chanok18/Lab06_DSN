// Roles del sistema
export type RoleName =
  | 'ADMINISTRADOR'
  | 'GERENTE'
  | 'SUPERVISOR'
  | 'EMPLEADO'
  | 'AUDITOR'
  | 'INVITADO';

// Acciones sobre recursos
export type ActionType =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'APPROVE';

// Atributos del Usuario (Subject)
export interface UserSubject {
  id: number;
  nombre: string;
  email?: string;
  rol: RoleName;
  departamento: string;
  nivel_seguridad: number;
  pais: string;
  tipo_contrato: 'INTERNO' | 'EXTERNO';
  estado: 'ACTIVO' | 'INACTIVO';
}

// Atributos del Documento (Resource)
export interface DocumentResource {
  id: number;
  titulo: string;
  descripcion?: string;
  fecha_creacion?: string;
  departamento: string;
  nivel_confidencialidad: number;
  estado: 'PENDIENTE' | 'PUBLICADO' | 'RECHAZADO';
  pais: string;
  propietario_id: number;
}

// Atributos del Entorno (Environment)
export interface EnvironmentContext {
  hora: string;
  direccion_ip: string;
  pais: string;
  dispositivo: 'CORPORATIVO' | 'PERSONAL';
}

// Registro de Auditoría
export interface AuditLog {
  usuario: string;
  recurso: string;
  accion: ActionType | string;
  fecha?: Date;
  resultado: 'PERMITIDO' | 'DENEGADO';
  motivo: string;
}

// Resultado de Evaluación ABAC
export interface ABACEvaluationResult {
  permitted: boolean;
  reason: string;
}