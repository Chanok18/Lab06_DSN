-- Insertar Departamentos
INSERT INTO departamentos (nombre) VALUES 
('SISTEMAS'), 
('FINANZAS'), 
('RRHH'), 
('LEGAL');

-- Insertar Roles
INSERT INTO roles (nombre) VALUES 
('ADMINISTRADOR'), 
('GERENTE'), 
('SUPERVISOR'), 
('EMPLEADO'), 
('AUDITOR'), 
('INVITADO');

-- Insertar Permisos RBAC
INSERT INTO permisos (codigo, descripcion) VALUES
('CREATE', 'Crear recursos'),
('READ', 'Leer o consultar recursos'),
('UPDATE', 'Modificar recursos existentes'),
('DELETE', 'Eliminar recursos'),
('APPROVE', 'Aprobar documentos o solicitudes');

-- Mapeo Rol_Permisos
INSERT INTO rol_permisos (id_rol, id_permiso) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), -- ADMINISTRADOR (Todo)
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), -- GERENTE (Todo)
(3, 1), (3, 2), (3, 3), (3, 5),          -- SUPERVISOR (Sin DELETE)
(4, 1), (4, 2), (4, 3),                  -- EMPLEADO (CREATE, READ, UPDATE)
(5, 2),                                  -- AUDITOR (Solo READ)
(6, 2);                                  -- INVITADO (Solo READ)

-- Insertar Usuarios de Prueba
INSERT INTO usuarios (nombre, email, password_hash, id_rol, id_departamento, nivel_seguridad, pais, tipo_contrato, estado)
VALUES 
('Carlos Admin', 'admin@securedocs.com', '$2b$10$e8.Z/yMv9H', 1, 1, 5, 'PERU', 'INTERNO', 'ACTIVO'),
('Maria Gerente', 'gerente@securedocs.com', '$2b$10$e8.Z/yMv9H', 2, 2, 4, 'PERU', 'INTERNO', 'ACTIVO'),
('Juan Empleado', 'juan@securedocs.com', '$2b$10$e8.Z/yMv9H', 4, 1, 3, 'PERU', 'INTERNO', 'ACTIVO'),
('Pedro Inactivo', 'pedro@securedocs.com', '$2b$10$e8.Z/yMv9H', 4, 1, 2, 'PERU', 'INTERNO', 'INACTIVO'),
('Ana Invitada', 'ana@guest.com', '$2b$10$e8.Z/yMv9H', 6, 3, 1, 'PERU', 'EXTERNO', 'ACTIVO');

-- Insertar Documentos de Prueba
INSERT INTO documentos (titulo, id_departamento, nivel_confidencialidad, estado, pais, propietario_id)
VALUES 
('Manual de Arquitectura', 1, 3, 'PUBLICADO', 'PERU', 3),
('Reporte Financiero Q3', 2, 5, 'PUBLICADO', 'PERU', 2),
('Politica Interna RRHH', 3, 1, 'PUBLICADO', 'PERU', 1);