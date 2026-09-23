# SecureDocs: Control de acceso RBAC + ABAC

SecureDocs es un sistema de gestión de documentos internos para TechCorp. Su autorización se evalúa en dos capas:

1. **RBAC:** determina si el rol posee el permiso base para ejecutar una operación.
2. **ABAC:** valida los atributos del usuario, documento y entorno de la petición.

El acceso solo se autoriza cuando ambas capas permiten la operación. Cada solicitud protegida genera un registro de auditoría.

> **Estado:** prototipo funcional para laboratorio universitario de Cloud Security.

---

## 🚀 Tecnologías Utilizadas

* **Backend:** Node.js, TypeScript y Express.js
* **Frontend:** React, Vite, TypeScript, Tailwind CSS, Zustand, Axios, Lucide React y Framer Motion
* **Autenticación:** JWT y Bcrypt
* **Base de datos local:** SQLite mediante `sqlite3` y `sqlite`
* **Cliente API:** navegador, Thunder Client o Postman

## Arquitectura

```text
Frontend React
   |
   | Axios + JWT + contexto ABAC
   v
API REST Express
   |
   +-- Autenticación JWT
   +-- Middleware RBAC
   +-- Motor de políticas ABAC
   +-- Servicio de documentos
   +-- Servicio de usuarios
   +-- Auditoría
   |
   v
SQLite
```

El backend se encuentra en `backend/src` y el frontend en `frontend/src`.

---

## 🔐 Modelos de Control de Acceso Implementados

1. **RBAC (Role-Based Access Control):** 
   * Evalúa la jerarquía `Usuario -> Rol -> Permisos -> Operación`.
   * Bloquea solicitudes si el rol del usuario carece de la autorización para la ruta/método deseado.
2. **ABAC (Attribute-Based Access Control):** 
   * Contextualiza la decisión evaluando atributos en tiempo de ejecución:
     * **Sujeto:** Departamento, Nivel de Seguridad, Estado (`ACTIVO`), País.
     * **Objeto/Recurso:** Departamento destino, Nivel de Confidencialidad, País.
   * **Entorno:** Hora, país, dirección IP y dispositivo.

### Políticas ABAC

Las políticas están centralizadas en `backend/src/policies/rules.ts` y son evaluadas por `ABACEngine`:

| Código | Política | Regla principal |
|---|---|---|
| POL_001 | Departamento | El usuario y el documento pertenecen al mismo departamento, salvo roles autorizados. |
| POL_002 | Nivel de seguridad | `nivel_seguridad >= nivel_confidencialidad`. |
| POL_003 | Propiedad | Para modificar, el usuario debe ser propietario, salvo Administrador o Gerente. |
| POL_004 | Horario | Documentos nivel 4 o 5 solo se consultan entre 08:00 y 18:00. |
| POL_005 | País | El país del usuario, entorno y documento debe coincidir. |
| POL_006 | Dispositivo | Documentos nivel 4 o 5 requieren dispositivo `CORPORATIVO`. |
| POL_007 | Estado | Solo usuarios `ACTIVO` pueden autenticarse y acceder. |
| POL_008 | Invitados | Contrato `EXTERNO`, nivel máximo 1 y documento `PUBLICADO`. |

---

## Funcionalidades implementadas

* Login y logout con JWT revocable durante la ejecución.
* CRUD de documentos y flujo de aprobación.
* Gestión administrativa de usuarios, roles, departamentos, nivel de seguridad y estado.
* Middleware independiente para autenticación, RBAC, ABAC y auditoría.
* Frontend con quick login para los seis roles, dashboard, documentos, usuarios, auditoría y Test Suite.
* Simulador ABAC que inyecta `x-country`, `x-device`, `x-time` y `x-forwarded-for`.

## Instalación y ejecución

### Requisitos

* Node.js 20 o superior
* npm

### Backend

```powershell
cd backend
npm install
npm run seed
npm run dev
```

La API queda disponible en `http://localhost:4000`.

> `npm run seed` reinicia la base local `backend/database.sqlite` con los usuarios, roles, permisos y documentos de demostración.

### Frontend

En otra terminal:

```powershell
cd frontend
npm install
npm run dev
```

La interfaz queda disponible en `http://localhost:5173` y consume `http://localhost:4000/api`.

Para utilizar otro puerto de backend:

```powershell
$env:VITE_API_URL = "http://localhost:4001/api"
npm run dev
```

Para crear el build de producción:

```powershell
npm run build
```

## Usuarios de demostración

Todas las cuentas de seed usan la contraseña `123`:

| Rol | Correo | Departamento | Nivel |
|---|---|---|---:|
| Administrador | `admin@securedocs.com` | SISTEMAS | 5 |
| Gerente | `gerente@securedocs.com` | FINANZAS | 4 |
| Supervisor | `carlos.ruiz@securedocs.com` | FINANZAS | 3 |
| Empleado | `maria.rrhh@securedocs.com` | RRHH | 2 |
| Auditor | `auditor@securedocs.com` | SISTEMAS | 3 |
| Invitado | `invitado@securedocs.com` | SISTEMAS | 1 |

## API principal

| Método | Endpoint | Autorización |
|---|---|---|
| POST | `/api/auth/login` | Pública |
| POST | `/api/auth/logout` | JWT |
| GET | `/api/usuarios` | RBAC `USER_READ` |
| POST | `/api/usuarios` | RBAC `USER_CREATE` |
| PUT | `/api/usuarios/:id` | RBAC `USER_UPDATE` |
| PATCH | `/api/usuarios/:id/estado` | RBAC `USER_UPDATE` |
| GET | `/api/documentos` | RBAC `DOC_READ` + ABAC |
| GET | `/api/documentos/:id` | RBAC `DOC_READ` + ABAC |
| POST | `/api/documentos` | RBAC `DOC_CREATE` + ABAC |
| PUT | `/api/documentos/:id` | RBAC `DOC_UPDATE` + ABAC |
| DELETE | `/api/documentos/:id` | RBAC `DOC_DELETE` + ABAC |
| POST | `/api/documentos/:id/aprobar` | RBAC `DOC_APPROVE` + ABAC |
| GET | `/api/auditoria` | RBAC `AUDIT_READ` |

## Casos de prueba obligatorios

La vista **Test suite** del frontend contiene los 12 escenarios solicitados: acceso por departamento, aprobación por Supervisor, denegación RBAC, nivel insuficiente, Gerente eliminando, Auditor modificando, usuario inactivo, horario, dispositivo personal e invitados.

Las evidencias pueden obtenerse desde el frontend o consultando:

```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/auditoria" -Headers @{ Authorization = "Bearer <TOKEN>" }
```

## Entregables del laboratorio

Este repositorio contiene el código fuente, README, esquema SQL, seed de datos, arquitectura separada por módulos RBAC/ABAC y la interfaz de demostración. Para completar la entrega académica deben anexarse también el diagrama exportado, evidencias/capturas de los casos y el video de funcionamiento.

### Frontend SecureDocs

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

La interfaz estará disponible en `http://localhost:5173`. Por defecto consume la API en
`http://localhost:4000/api`; para usar otro puerto, define `VITE_API_URL`, por ejemplo:

```powershell
$env:VITE_API_URL = "http://localhost:4001/api"
npm run dev
```

El frontend incluye accesos demo para los seis roles, navegación condicionada por RBAC,
simulador de país/dispositivo/hora que inyecta cabeceras ABAC, decodificador visual de
políticas, documentos, usuarios, auditoría y la matriz de los 12 casos obligatorios.