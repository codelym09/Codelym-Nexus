# Arquitectura Detallada de Codelym-Nexus

Este documento profundiza en los componentes clave y los patrones de diseño que sustentan la plataforma de Automatización de Procesos Agénticos (APA) de Codelym-Nexus. Se adhiere a los principios de **Clean Architecture** y **Domain-Driven Design (DDD)** para garantizar la escalabilidad, mantenibilidad y testabilidad.

## 1. Visión General de Alto Nivel

Codelym-Nexus es un sistema distribuido que orquesta agentes de IA para automatizar procesos empresariales complejos. Se compone de tres planos principales:

*   **Plano de Telemetría Edge (Rust):** Captura pasiva de logs y eventos en el borde de la red.
*   **Plano de Orquestación y Destilación (Go):** El cerebro del sistema, donde los logs se transforman en lógica de negocio ejecutable mediante LLMs.
*   **Plano de Control del Modelo (Next.js):** Interfaz de usuario para la supervisión, gobernanza y "Human-in-the-Loop" (HITL).

```mermaid
graph TD
    subgraph Edge Telemetry (Rust)
        A[Sistemas de Producción] --> B(Agente Edge)
        B --> C(Sanitización Local)
        C --> D{gRPC Stream}
    end

    subgraph Orchestration & Distillation Engine (Go)
        D --> E[Event Router]
        E --> F(LLM Adapter)
        F --> G(Distillation Pipeline)
        G --> H(Automated Sanitizer)
        H --> I[Ephemeral Storage (MinIO)]
        G --> J[State Repository (PostgreSQL)]
    end

    subgraph Model Control Plane (Next.js)
        K[Operador Humano] --> L(Interfaz de Usuario)
        L --> M{REST API}
    end

    J -- Lee/Escribe --> M
    M -- Consulta --> J
    M -- Control --> G
```

## 2. Plano de Orquestación y Destilación (Go)

Este plano es el corazón de Codelym-Nexus, implementado en Go para aprovechar su concurrencia y rendimiento. Sigue una arquitectura hexagonal, donde el dominio central está desacoplado de los detalles de infraestructura.

### 2.1. Estructura de Directorios (Clean Architecture)

```text
apa-orchestrator/
├── cmd/
│   └── server/                 # Punto de entrada de la aplicación (main.go)
├── internal/
│   ├── core/                   # Dominio del negocio (agnóstico a la infraestructura)
│   │   ├── domain/             # Entidades de negocio (Agent, Workflow, RawLog)
│   │   └── ports/              # Interfaces (contratos) para adaptadores
│   ├── handlers/               # Adaptadores de entrada (gRPC, HTTP)
│   │   ├── grpc/               # Implementación del servidor gRPC
│   │   └── http/               # Implementación del servidor HTTP (REST)
│   ├── services/               # Casos de uso / Lógica de aplicación (DistillerService)
│   └── storage/                # Adaptadores de salida (persistencia, LLM)
│       ├── postgres/           # Implementación de StateRepository para PostgreSQL
│       ├── minio/              # Implementación de EphemeralStorage para MinIO
│       └── llm/                # Implementación de IntelligenceRouter para LLM (OpenRouter)
├── pkg/                        # Paquetes compartidos (logger, utilidades)
├── deploy/                     # Configuraciones de despliegue (Docker Compose)
├── go.mod
└── go.sum
```

### 2.2. Componentes Clave

#### a) `internal/core/domain`

Define las entidades de negocio puras, sin dependencias externas. Ejemplos:

*   `RawLog`: Representa un log crudo capturado del sistema.
*   `Workflow`: Un grafo de lógica de negocio destilada y ejecutable.
*   `Agent`: La entidad que ejecuta los flujos de trabajo.

#### b) `internal/core/ports`

Define las interfaces (contratos) que los adaptadores deben implementar. Esto permite que el dominio sea independiente de la tecnología subyacente. Ejemplos:

*   `EphemeralStorage`: Para guardar y purgar logs crudos (implementado por `minio/Adapter`).
*   `StateRepository`: Para persistir y recuperar flujos de trabajo (implementado por `postgres/Repository`).
*   `IntelligenceRouter`: Para interactuar con modelos de lenguaje (implementado por `llm/OpenRouterAdapter`).

#### c) `internal/services`

Contiene la lógica de aplicación o casos de uso. El `DistillerService` es el componente central que orquesta la destilación de conocimiento:

1.  Recibe `RawLog`s.
2.  Utiliza `IntelligenceRouter` para destilar la lógica en un `Workflow`.
3.  Persiste el `Workflow` usando `StateRepository`.
4.  Purga los `RawLog`s del `EphemeralStorage` (principio "Log-to-Logic-Purge").

#### d) `internal/handlers`

Adaptadores de entrada que exponen la funcionalidad del dominio a través de diferentes protocolos:

*   `grpc/TelemetryHandler`: Recibe streams de telemetría de los agentes Edge.
*   `http/ControlPlaneHandler`: Proporciona una API REST para el Model Control Plane (Next.js).

#### e) `internal/storage`

Adaptadores de salida que implementan las interfaces definidas en `internal/core/ports`:

*   `minio/Adapter`: Interactúa con un almacenamiento compatible con S3 (MinIO) para logs efímeros.
*   `postgres/Repository`: Interactúa con PostgreSQL para el estado persistente de los flujos de trabajo.
*   `llm/OpenRouterAdapter`: Se comunica con la API de OpenRouter (o cualquier otro proveedor de LLM) para la destilación de lógica.

## 3. Principios de Diseño Clave

*   **Inversión de Dependencias:** El dominio (`core`) no depende de los adaptadores (`handlers`, `storage`). Los adaptadores dependen de las interfaces del dominio.
*   **Separación de Preocupaciones:** Cada componente tiene una responsabilidad única y bien definida.
*   **Testabilidad:** La lógica de negocio puede ser probada de forma aislada, sin necesidad de infraestructura real.
*   **Reemplazabilidad:** Los adaptadores pueden ser fácilmente intercambiados (ej. cambiar de PostgreSQL a Cassandra) sin afectar la lógica central.
*   **Seguridad por Diseño:** El principio "Log-to-Logic-Purge" asegura que los datos sensibles no persistan más allá de lo necesario.

## 4. Despliegue y Operación

El proyecto está diseñado para ser desplegado en entornos nativos de la nube. `deploy/docker-compose.yml` proporciona una configuración local para levantar las dependencias de infraestructura (PostgreSQL, MinIO) para desarrollo y pruebas.

La contenedorización del orquestador Go se gestiona a través de `deploy/Dockerfile`.

---

*Autor: Manus AI*
*Fecha: 7 de julio de 2026*
