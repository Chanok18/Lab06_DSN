import { getDB } from './config/database';

async function initDB() {
  const db = await getDB();

  console.log('Reiniciando base de datos con usuarios de prueba...');

  await db.exec(`
    DROP TABLE IF EXISTS auditoria;
    DROP TABLE IF EXISTS documentos;
    DROP TABLE IF EXISTS usuarios;
    DROP TABLE IF EXISTS rol_permisos;
    DROP TABLE IF EXISTS permisos;
    DROP TABLE IF EXISTS roles;
    DROP TABLE IF EXISTS departamentos;

    CREATE TABLE departamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE
    );

    CREATE TABLE roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE
    );

    CREATE TABLE permisos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT NOT NULL UNIQUE,
        descripcion TEXT
    );

    CREATE TABLE rol_permisos (
        id_rol INTEGER,
        id_permiso INTEGER,
        PRIMARY KEY (id_rol, id_permiso),
        FOREIGN KEY(id_rol) REFERENCES roles(id),
        FOREIGN KEY(id_permiso) REFERENCES permisos(id)
    );

    CREATE TABLE usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        id_rol INTEGER,
        id_departamento INTEGER,
        nivel_seguridad INTEGER CHECK (nivel_seguridad BETWEEN 1 AND 5),
        pais TEXT NOT NULL,
        tipo_contrato TEXT CHECK (tipo_contrato IN ('INTERNO', 'EXTERNO')),
        estado TEXT DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
        FOREIGN KEY(id_rol) REFERENCES roles(id),
        FOREIGN KEY(id_departamento) REFERENCES departamentos(id)
    );

    CREATE TABLE documentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        descripcion TEXT,
        id_departamento INTEGER,
        nivel_confidencialidad INTEGER CHECK (nivel_confidencialidad BETWEEN 1 AND 5),
        estado TEXT DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'PUBLICADO', 'RECHAZADO')),
        pais TEXT NOT NULL,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        propietario_id INTEGER,
        FOREIGN KEY(id_departamento) REFERENCES departamentos(id),
        FOREIGN KEY(propietario_id) REFERENCES usuarios(id)
    );

    CREATE TABLE auditoria (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT NOT NULL,
        recurso TEXT NOT NULL,
        accion TEXT NOT NULL,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        resultado TEXT CHECK (resultado IN ('PERMITIDO', 'DENEGADO')),
        motivo TEXT NOT NULL
    );

    INSERT INTO departamentos (id, nombre) VALUES
    (1, 'SISTEMAS'),
    (2, 'FINANZAS'),
    (3, 'RRHH');

    INSERT INTO roles (id, nombre) VALUES
    (1, 'ADMINISTRADOR'),
    (2, 'GERENTE'),
    (3, 'SUPERVISOR'),
    (4, 'EMPLEADO'),
    (5, 'AUDITOR'),
    (6, 'INVITADO');

    INSERT INTO permisos (id, codigo, descripcion) VALUES
    (1, 'DOC_READ', 'Leer documentos'),
    (2, 'DOC_CREATE', 'Crear documentos'),
    (3, 'DOC_UPDATE', 'Modificar documentos'),
    (4, 'DOC_DELETE', 'Eliminar documentos'),
    (5, 'DOC_APPROVE', 'Aprobar documentos'),
    (6, 'USER_READ', 'Consultar usuarios'),
    (7, 'USER_CREATE', 'Crear usuarios'),
    (8, 'USER_UPDATE', 'Actualizar usuarios'),
    (9, 'AUDIT_READ', 'Ver auditoría'),
    (10, 'ROLE_ASSIGN', 'Asignar roles');

    INSERT INTO rol_permisos (id_rol, id_permiso) VALUES
    (1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10),
    (2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6), (2, 8),
    (3, 1), (3, 2), (3, 3), (3, 5),
    (4, 1), (4, 2), (4, 3),
    (5, 1), (5, 9),
    (6, 1);

    INSERT INTO usuarios (id, nombre, email, password_hash, id_rol, id_departamento, nivel_seguridad, pais, tipo_contrato, estado) VALUES
    (1, 'Admin Principal', 'admin@securedocs.com', '123', 1, 1, 5, 'PERU', 'INTERNO', 'ACTIVO'),
    (2, 'Gerente Finanzas', 'gerente@securedocs.com', '123', 2, 2, 4, 'PERU', 'INTERNO', 'ACTIVO'),
    (3, 'Carlos Ruiz', 'carlos.ruiz@securedocs.com', '123', 3, 2, 3, 'PERU', 'INTERNO', 'ACTIVO'),
    (4, 'Maria RRHH', 'maria.rrhh@securedocs.com', '123', 4, 3, 2, 'PERU', 'INTERNO', 'ACTIVO'),
    (5, 'Auditor General', 'auditor@securedocs.com', '123', 5, 1, 3, 'PERU', 'INTERNO', 'ACTIVO'),
    (6, 'Invitado Externo', 'invitado@securedocs.com', '123', 6, 1, 1, 'PERU', 'EXTERNO', 'ACTIVO');

    INSERT INTO documentos (id, titulo, id_departamento, nivel_confidencialidad, estado, pais, propietario_id) VALUES
    (1, 'Presupuesto Anual', 2, 3, 'PENDIENTE', 'PERU', 3),
    (2, 'Presupuesto Corporativo', 2, 4, 'PENDIENTE', 'PERU', 3),
    (3, 'Política Interna', 1, 2, 'PUBLICADO', 'PERU', 1),
    (4, 'Reporte de Nómina', 3, 2, 'PUBLICADO', 'PERU', 4),
    (5, 'Proyecto Reserva', 1, 5, 'PENDIENTE', 'PERU', 1),
    (6, 'Comunicado Público', 1, 1, 'PUBLICADO', 'PERU', 1);
  `);

  console.log('¡Base de datos reseteada con éxito!');
}

initDB().catch(console.error);