import { UserSubject, DocumentResource, EnvironmentContext } from '../types';

export interface PolicyRule {
  id: string;
  nombre: string;
  descripcion: string;
  evaluate: (
    user: UserSubject, 
    document: DocumentResource, 
    env: EnvironmentContext,
    action: string
  ) => { passed: boolean; reason?: string };
}

export const abacRules: PolicyRule[] = [
  // Política 1: Departamento (P1)
  {
    id: 'POL_001',
    nombre: 'Coincidencia de Departamento',
    descripcion: 'El usuario debe pertenecer al mismo departamento del documento (salvo excepciones RBAC).',
    evaluate: (user, document) => {
      if (user.rol === 'ADMINISTRADOR' || user.rol === 'GERENTE' || user.rol === 'AUDITOR') {
        return { passed: true };
      }
      const passed = user.departamento === document.departamento;
      return {
        passed,
        reason: passed ? undefined : `El departamento del usuario (${user.departamento}) no coincide con el del documento (${document.departamento})`
      };
    }
  },

  // Política 2: Nivel de Seguridad (P2)
  {
    id: 'POL_002',
    nombre: 'Nivel de Seguridad Insuficiente',
    descripcion: 'El nivel de seguridad del usuario debe ser mayor o igual al nivel de confidencialidad del documento.',
    evaluate: (user, document) => {
      const passed = user.nivel_seguridad >= document.nivel_confidencialidad;
      return {
        passed,
        reason: passed ? undefined : `Nivel de seguridad insuficiente (Usuario: ${user.nivel_seguridad}, Doc: ${document.nivel_confidencialidad})`
      };
    }
  },

  // Política 3: Propiedad del Documento para Modificación (P3)
  {
    id: 'POL_003',
    nombre: 'Propiedad de Documento',
    descripcion: 'Para modificar (UPDATE) un documento, el usuario debe ser el propietario creador.',
    evaluate: (user, document, env, action) => {
      if (action !== 'UPDATE') return { passed: true };
      if (user.rol === 'ADMINISTRADOR' || user.rol === 'GERENTE') return { passed: true };
      
      const passed = user.id === document.propietario_id;
      return {
        passed,
        reason: passed ? undefined : 'No es el propietario del documento para realizar modificaciones'
      };
    }
  },

  // Política 4: Horario Laboral para Documentos Confidenciales (P4)
  {
    id: 'POL_004',
    nombre: 'Horario de Acceso Confidencial',
    descripcion: 'Documentos confidenciales (nivel >= 4) solo pueden accederse de 08:00 a 18:00.',
    evaluate: (user, document, env) => {
      if (document.nivel_confidencialidad < 4) return { passed: true };

      const horaActual = env.hora; // Formato "HH:MM"
      const passed = horaActual >= '08:00' && horaActual <= '18:00';
      return {
        passed,
        reason: passed ? undefined : `Acceso denegado fuera de horario laboral (${horaActual}) para documentos confidenciales`
      };
    }
  },

  // Política 5: Restricción Geográfica / País (P5)
  {
    id: 'POL_005',
    nombre: 'Ubicación Geográfica',
    descripcion: 'El país del usuario y del entorno debe coincidir con el país del documento.',
    evaluate: (user, document, env) => {
      const passed = user.pais === document.pais && env.pais === document.pais;
      return {
        passed,
        reason: passed ? undefined : `Ubicación no autorizada (Usuario: ${user.pais}, Entorno: ${env.pais}, Doc: ${document.pais})`
      };
    }
  },

  // Política 6: Restricción por Dispositivo (P6)
  {
    id: 'POL_006',
    nombre: 'Dispositivo Corporativo Requerido',
    descripcion: 'Documentos nivel 4 o 5 exigen acceso desde un dispositivo corporativo.',
    evaluate: (user, document, env) => {
      if (document.nivel_confidencialidad < 4) return { passed: true };

      const passed = env.dispositivo === 'CORPORATIVO';
      return {
        passed,
        reason: passed ? undefined : 'Documento nivel 4 o 5 requiere un dispositivo CORPORATIVO'
      };
    }
  },

  // Política 7: Estado del Usuario (P7)
  {
    id: 'POL_007',
    nombre: 'Usuario Activo',
    descripcion: 'El usuario debe tener estado ACTIVO.',
    evaluate: (user) => {
      const passed = user.estado === 'ACTIVO';
      return {
        passed,
        reason: passed ? undefined : 'El usuario se encuentra INACTIVO en el sistema'
      };
    }
  },

  // Política 8: Restricción de Invitados / Externos (P8)
  {
    id: 'POL_008',
    nombre: 'Acceso de Invitados',
    descripcion: 'Invitados solo acceden a documentos con confidencialidad 1 y estado PUBLICADO.',
    evaluate: (user, document) => {
      if (user.rol !== 'INVITADO') return { passed: true };

      const contratoValido = user.tipo_contrato === 'EXTERNO';
      const nivelValido = document.nivel_confidencialidad <= 1;
      const estadoValido = document.estado === 'PUBLICADO';

      const passed = contratoValido && nivelValido && estadoValido;
      return {
        passed,
        reason: passed ? undefined : 'Invitado sin permisos suficientes (requiere contrato EXTERNO, doc confidencialidad 1 y PUBLICADO)'
      };
    }
  }
];