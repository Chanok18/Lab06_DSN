-- 1. Tabla Departamentos
CREATE TABLE IF NOT EXISTS departamentos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- 2. Tabla Roles
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- 3. Tabla Permisos (RBAC)
CREATE TABLE IF NOT EXISTS permisos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

-- 4. Tabla Rol_Permisos
CREATE TABLE IF NOT EXISTS rol_permisos (
    id_rol INT REFERENCES roles(id) ON DELETE CASCADE,
    id_permiso INT REFERENCES permisos(id) ON DELETE CASCADE,
    PRIMARY KEY (id_rol, id_permiso)
);

-- 5. Tabla Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    id_rol INT REFERENCES roles(id),
    id_departamento INT REFERENCES departamentos(id),
    nivel_seguridad INT NOT NULL CHECK (nivel_seguridad BETWEEN 1 AND 5),
    pais VARCHAR(50) NOT NULL,
    tipo_contrato VARCHAR(20) CHECK (tipo_contrato IN ('INTERNO', 'EXTERNO')),
    estado VARCHAR(20) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO'))
);

-- 6. Tabla Documentos
CREATE TABLE IF NOT EXISTS documentos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    id_departamento INT REFERENCES departamentos(id),
    nivel_confidencialidad INT NOT NULL CHECK (nivel_confidencialidad BETWEEN 1 AND 5),
    estado VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'PUBLICADO', 'RECHAZADO')),
    pais VARCHAR(50) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    propietario_id INT REFERENCES usuarios(id)
);

-- 7. Tabla Politicas (Configuración Motor ABAC)
CREATE TABLE IF NOT EXISTS politicas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    activa BOOLEAN DEFAULT TRUE
);

-- 8. Tabla Auditoria
CREATE TABLE IF NOT EXISTS auditoria (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(100) NOT NULL,
    recurso VARCHAR(100) NOT NULL,
    accion VARCHAR(50) NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resultado VARCHAR(20) CHECK (resultado IN ('PERMITIDO', 'DENEGADO')),
    motivo TEXT NOT NULL
);