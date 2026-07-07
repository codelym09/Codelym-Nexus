# Agentic Process Automation (APA) - Plataforma Unificada

[![Go Version](https://img.shields.io/badge/Go-1.21+-00ADD8?style=flat&logo=go)](https://go.dev/)
[![Rust Version](https://img.shields.io/badge/Rust-1.75+-000000?style=flat&logo=rust)](https://www.rust-lang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-000000?style=flat&logo=next.js)](https://nextjs.org/)
[![Architecture](https://img.shields.io/badge/Architecture-Event--Driven-blue)]()

## 🚀 Visión General (First Principles)

La Automatización Robótica de Procesos (RPA) tradicional ha fallado. La dependencia de scripts rígidos basados en selectores de interfaz de usuario (UI) genera una deuda técnica insostenible, requiriendo mantenimiento constante frente a cualquier cambio mínimo en el entorno.

**APA (Agentic Process Automation)** reconstruye la automatización desde los primeros principios. Esta infraestructura implementa un pipeline de **Destilación de Conocimiento (Knowledge Distillation)**. Extrae pasivamente la telemetría del sistema (logs), utiliza modelos de lenguaje (LLMs) para inferir la lógica semántica subyacente y genera flujos de trabajo determinísticos que los agentes de IA ejecutan de forma autónoma.

### El Diferenciador Táctico: "Log-to-Logic-Purge"
Para garantizar el cumplimiento normativo estricto y eliminar la superficie de ataque, este sistema implementa un ciclo de vida destructivo para los datos crudos:
1. **Shadow Ingestion:** Copia pasiva de logs sin afectar los sistemas de producción.
2. **Distillation:** Extracción de la regla lógica de negocio en formato de Grafo (JSON).
3. **Purge:** Eliminación absoluta y automática del log crudo original inmediatamente después de la validación. Conservamos la lógica, destruimos el riesgo.

---

## 🏗 Arquitectura del Sistema Unificada

La plataforma está diseñada como un sistema distribuido de alta disponibilidad, separando estrictamente la captura en el borde (*edge*), la orquestación concurrente y el plano de control humano. Este repositorio unifica los componentes principales:

### 1. Edge Telemetry (Rust)
Un agente binario ultra-ligero y seguro para la memoria, desplegado en la infraestructura local.
* **Non-Destructive Acquisition:** Operación *read-only* sobre los logs del sistema objetivo.
* **Local Sanitization:** Enmascaramiento de PII mediante expresiones regulares antes de la transmisión.
* **gRPC Streaming:** Envío eficiente y seguro de eventos hacia el orquestador.

### 2. Orchestration & Distillation Engine (Go)
El núcleo del sistema. Diseñado en Golang para maximizar el rendimiento en la gestión de concurrencia y orquestación de miles de eventos simultáneos.
* **Event Router:** Manejo de webhooks y streams entrantes.
* **LLM Adapter (OpenRouter/Claude 3.5):** Capa de traducción que convierte el ruido del log en State Machines ejecutables.
* **Automated Sanitizer:** Proceso implacable de eliminación de datos efímeros en almacenamiento compatible con S3 (MinIO).

### 3. Model Control Plane (Next.js)
Arquitectura *Headless* para la supervisión y gobernanza de los agentes. Esta es la interfaz de usuario principal para interactuar con el sistema.
* **Human-in-the-loop (HITL):** Interfaz visual donde los operadores auditan y aprueban los Grafos de Flujo destilados antes del despliegue del agente.
* **Agent Governance:** Gestión centralizada de credenciales de servicio (OAuth) y monitoreo de ejecución atómica por excepciones.

---

## 📂 Estructura del Repositorio (Domain-Driven Design)

Este repositorio ahora contiene la infraestructura central (Orchestration & Distillation Engine) y el plano de control (Model Control Plane).

```text
Codelym-Nexus/
├── cmd/                                # Comandos ejecutables del orquestador Go
│   └── server/
│       └── main.go                     # Punto de entrada & Inyección de Dependencias
├── internal/                           # Lógica interna del orquestador Go
│   ├── core/                           # Dominio del negocio (agnóstico a la infraestructura)
│   │   ├── domain/                     # Entidades: Agent, Workflow, RawLog
│   │   └── ports/                      # Contratos (Interfaces): Inbound & Outbound
│   ├── handlers/                       # Adaptadores de entrada (gRPC, HTTP)
│   ├── services/                       # Casos de uso: Distillation Pipeline & Purge
│   └── storage/                        # Adaptadores de salida (persistencia, LLM)
├── pkg/                                # Paquetes compartidos (logger, utilidades)
├── deploy/                             # Configuraciones de despliegue (Docker Compose)
│   ├── docker-compose.yml              # Levantamiento de infraestructura local (DBs)
│   └── Dockerfile                      # Contenedorización del orquestador Go
├── control-plane/                      # **Codelym Control Plane (Frontend Next.js)**
│   ├── client/                         # Frontend React
│   ├── server/                         # Backend Node.js
│   ├── drizzle/                        # Esquema de BD y migraciones
│   ├── shared/                         # Tipos y constantes compartidas
│   └── references/                     # Documentación de integraciones
├── docs/                               # Documentación general del proyecto
│   └── ARCHITECTURE.md                 # Arquitectura detallada del orquestador Go
├── go.mod
├── go.sum
└── README.md
```

---

## 📋 Características Principales del Control Plane

El **Codelym Control Plane** (ubicado en `control-plane/`) es una aplicación web profesional que transforma logs crudos en flujos de trabajo automatizados mediante inteligencia artificial, con revisión humana (HITL) y expansión continua basada en aprendizaje.

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

## 🛠 Despliegue Local (Infraestructura como Código)

Este proyecto asume un entorno nativo de la nube. Utilice Docker para levantar las dependencias de infraestructura local (PostgreSQL para estado, MinIO para almacenamiento efímero).

### Para el Orchestration & Distillation Engine (Go):
1. Clonar el repositorio (ya hecho).
2. Navegar al directorio `deploy`:
   ```bash
   cd Codelym-Nexus/deploy
   ```
3. Levantar la infraestructura base:
   ```bash
   docker-compose up -d
   ```
4. Configurar variables de entorno (.env):
   ```env
   OPENROUTER_API_KEY=tu_api_key
   POSTGRES_DSN=postgres://apa_admin:password@localhost:5432/apa_state?sslmode=disable
   MINIO_ENDPOINT=localhost:9000
   ```
5. Ejecutar el Orquestador Core:
   ```bash
   cd ../cmd/server
   go run main.go
   ```

### Para el Codelym Control Plane (Next.js):
1. Navegar al directorio `control-plane`:
   ```bash
   cd Codelym-Nexus/control-plane
   ```
2. Instalar dependencias:
   ```bash
   pnpm install
   ```
3. Configurar variables de entorno:
   ```bash
   cp .env.example .env.local
   # Editar .env.local con tus credenciales (ver sección de variables de entorno requeridas)
   ```
4. Ejecutar migraciones de BD:
   ```bash
   pnpm drizzle-kit generate
   pnpm drizzle-kit migrate
   ```
5. Iniciar servidor de desarrollo:
   ```bash
   pnpm dev
   ```

---

## 🛡️ Principios de Ingeniería Mantenidos en este Repositorio
1. **Eficiencia en el Borde:** Las tareas pesadas de parseo se mantienen lejos del hardware del cliente.
2. **Ejecución Atómica:** Los agentes ejecutan flujos de trabajo paso a paso. Si falla un paso, el estado se preserva y notifica para supervisión humana, asegurando 100% de consistencia.
3. **Prioridad a la Infraestructura:** Este repositorio se centra estrictamente en la infraestructura técnica, la integración de APIs y el enrutamiento de datos.
4. **Almacenamiento No-Sensible:** El motor no retiene datos operativos históricos. Si ocurre una brecha de seguridad en el sistema, los historiales de eventos crudos no existirán para ser extraídos.

---

## 🔌 Integraciones Clave

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

## 📝 Endpoints tRPC (Control Plane)

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

## 🎨 Diseño Visual (Control Plane)

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

## 🧪 Testing (Control Plane)

```bash
# Ejecutar tests unitarios
pnpm test

# Tests con coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

---

## 📦 Despliegue (Control Plane)

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
- [Guía de Desarrollo](./control-plane/docs/DEVELOPMENT.md) (si existe en el repositorio `codelym`)
- [API Reference](./control-plane/docs/API.md) (si existe en el repositorio `codelym`)
- [Changelog](./control-plane/CHANGELOG.md) (si existe en el repositorio `codelym`)

---

**Última actualización:** Julio 2026
**Versión:** 1.0.0-beta
