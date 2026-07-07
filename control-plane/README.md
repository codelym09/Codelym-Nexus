# 🚀 Codelym Control Plane

**Plataforma inteligente de destilación y supervisión de flujos de trabajo desde logs del sistema**

Una aplicación web profesional que transforma logs crudos en flujos de trabajo automatizados mediante inteligencia artificial, con revisión humana (HITL) y expansión continua basada en aprendizaje.

---

## 📋 Características Principales

### 1. **Autenticación Segura con Google OAuth**
- Acceso exclusivo mediante Google Sign-In
- Gestión automática de sesiones y cookies
- Soporte para múltiples usuarios con roles (admin/user)

### 2. **Dashboard Profesional**
- Interfaz futurista con gradiente violeta-teal
- Visualización de workflows destilados
- Estadísticas en tiempo real
- Composición asimétrica con espacio negativo

### 3. **Ingesta Flexible de Logs**
- Upload de archivos de log
- Paste directo de contenido
- Procesamiento automático y validación
- Indicadores de progreso en tiempo real

### 4. **Destilación Inteligente con IA**
- Integración con OpenRouter LLM
- Análisis automático de logs
- Generación de flujos de trabajo en JSON estructurado
- Identificación de pasos, decisiones y patrones

### 5. **Visualización Gráfica Interactiva**
- React Flow para visualización de nodos
- Grafo animado de pasos del workflow
- Información detallada de cada nodo
- Zoom, pan y navegación intuitiva

### 6. **Interfaz Human-in-the-Loop (HITL)**
- Revisión manual de workflows antes de ejecución
- Botones de aprobación/rechazo
- Confirmación de acciones críticas
- Historial de cambios y decisiones

### 7. **Gestión de Estados**
- Estados: pendiente, aprobado, ejecutando, completado, fallido
- Transiciones automáticas
- Historial completo de cambios
- Trazabilidad de quién hizo qué y cuándo

### 8. **Expansión Continua de Flujos**
- Detección automática de nuevas acciones en logs
- Agregación inteligente al workflow existente
- Aprendizaje progresivo del sistema
- Mejora continua de flujos

---

## 🏗️ Arquitectura Técnica

### Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 19 + TypeScript + Tailwind CSS 4 |
| **Backend** | Express 4 + tRPC 11 + Node.js |
| **Base de Datos** | MySQL/TiDB con Drizzle ORM |
| **Visualización** | React Flow para grafos interactivos |
| **Autenticación** | Manus OAuth + Google Sign-In |
| **IA/LLM** | OpenRouter API |
| **Almacenamiento** | S3 (MinIO compatible) |

### Estructura de Carpetas

```
codelym-control-plane/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── pages/            # Páginas principales
│   │   ├── components/       # Componentes reutilizables
│   │   ├── lib/              # Utilidades y configuración
│   │   └── hooks/            # Custom React hooks
│   └── public/               # Archivos estáticos
├── server/                    # Backend Node.js
│   ├── routers.ts            # Endpoints tRPC
│   ├── db.ts                 # Query helpers
│   └── _core/                # Configuración central
├── drizzle/                   # Esquema de BD y migraciones
├── shared/                    # Tipos y constantes compartidas
└── references/               # Documentación de integraciones
```

### Flujo de Datos

```
Usuario → Google OAuth → Dashboard
                          ↓
                    Ingesta de Logs
                          ↓
                    LLM Destilación
                          ↓
                    Workflow JSON
                          ↓
                    HITL Review
                          ↓
                    Aprobación/Rechazo
                          ↓
                    Base de Datos
                          ↓
                    Visualización Gráfica
```

---

## 🚀 Instalación y Desarrollo

### Requisitos Previos
- Node.js 22+
- pnpm 10+
- MySQL/TiDB
- Credenciales de OpenRouter API

### Setup Local

```bash
# Clonar repositorio
git clone https://github.com/codelym09/codelym.git
cd codelym-control-plane

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Ejecutar migraciones de BD
pnpm drizzle-kit generate
pnpm drizzle-kit migrate

# Iniciar servidor de desarrollo
pnpm dev
```

### Desarrollo

```bash
# Compilar TypeScript
pnpm check

# Ejecutar tests
pnpm test

# Formatear código
pnpm format

# Build para producción
pnpm build
pnpm start
```

---

## 📊 Esquema de Base de Datos

### Tabla: `users`
- Gestión de usuarios y autenticación
- Campos: id, openId, name, email, role, createdAt, updatedAt

### Tabla: `raw_logs`
- Almacenamiento de logs crudos
- Campos: id, userId, content, source, fileName, createdAt

### Tabla: `workflows`
- Flujos de trabajo destilados
- Campos: id, userId, name, description, status, graphJson, sourceLogId, createdAt, updatedAt, approvedAt, approvedBy

### Tabla: `workflow_steps`
- Pasos individuales dentro de workflows
- Campos: id, workflowId, stepNumber, title, description, action, parameters, createdAt

### Tabla: `workflow_history`
- Historial de cambios y decisiones
- Campos: id, workflowId, action, previousState, newState, changedBy, createdAt

---

## 🔌 Integraciones

### Google OAuth
- Autenticación segura mediante Google
- Gestión automática de sesiones
- Sincronización de perfil de usuario

### OpenRouter LLM
- Modelos de IA para destilación de logs
- Análisis de patrones y comportamientos
- Generación de flujos estructurados en JSON

### tRPC
- Type-safe RPC entre frontend y backend
- Validación automática de tipos
- Documentación auto-generada

---

## 📝 Endpoints tRPC

### Workflows
- `workflows.list` - Obtener workflows del usuario
- `workflows.getById` - Obtener workflow específico con pasos
- `workflows.approve` - Aprobar workflow
- `workflows.reject` - Rechazar workflow
- `workflows.addStep` - Agregar paso a workflow
- `workflows.updateStep` - Actualizar paso existente
- `workflows.deleteStep` - Eliminar paso del workflow

### Logs
- `logs.uploadPaste` - Procesar logs (upload o paste)

### Auth
- `auth.me` - Obtener usuario actual
- `auth.logout` - Cerrar sesión

---

## 🎨 Diseño Visual

### Paleta de Colores
- **Primario**: Teal (#0d9488)
- **Secundario**: Violeta (#7c3aed)
- **Fondo**: Gradiente violeta-teal
- **Texto**: Blanco (#ffffff)
- **Acentos**: Verde (#10b981)

### Componentes UI
- Glassmorphism para tarjetas
- Animaciones suaves (300ms max)
- Tipografía bold y grande para impacto
- Espacio negativo generoso
- Composición asimétrica

---

## 🧪 Testing

```bash
# Ejecutar tests unitarios
pnpm test

# Tests con coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

---

## 📦 Despliegue

### Producción (Manus Hosting)
```bash
# Crear checkpoint
pnpm build

# El sistema de Manus maneja el despliegue automático
```

### Variables de Entorno Requeridas
```
DATABASE_URL=mysql://...
JWT_SECRET=...
VITE_APP_ID=...
OAUTH_SERVER_URL=...
VITE_OAUTH_PORTAL_URL=...
BUILT_IN_FORGE_API_URL=...
BUILT_IN_FORGE_API_KEY=...
VITE_FRONTEND_FORGE_API_KEY=...
VITE_FRONTEND_FORGE_API_URL=...
```

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver archivo `LICENSE` para más detalles.

---

## 👥 Autores

- **Codelym Team** - Desarrollo principal
- Construido con ❤️ para automatización inteligente de procesos

---

## 📞 Soporte

Para reportar bugs o sugerencias, abre un issue en GitHub o contacta al equipo de desarrollo.

---

## 🔗 Enlaces Útiles

- [Documentación de Arquitectura](./docs/ARCHITECTURE.md)
- [Guía de Desarrollo](./docs/DEVELOPMENT.md)
- [API Reference](./docs/API.md)
- [Changelog](./CHANGELOG.md)

---

**Última actualización:** Julio 2026
**Versión:** 1.0.0-beta
