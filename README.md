# Agentic Process Automation (APA) - Core Infrastructure

[![Go Version](https://img.shields.io/badge/Go-1.21+-00ADD8?style=flat&logo=go)](https://go.dev/)
[![Rust Version](https://img.shields.io/badge/Rust-1.75+-000000?style=flat&logo=rust)](https://www.rust-lang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-000000?style=flat&logo=next.js)](https://nextjs.org/)
[![Architecture](https://img.shields.io/badge/Architecture-Event--Driven-blue)]()

## 🚀 Visión General (First Principles)

La Automatización Robótica de Procesos (RPA) tradicional ha fallado. La dependencia de scripts rígidos basados en selectores de interfaz de usuario (UI) genera una deuda técnica insostenible, requiriendo mantenimiento constante frente a cualquier cambio mínimo en el entorno.

**APA (Agentic Process Automation)** reconstruye la automatización desde los primeros principios. En lugar de grabar clics, esta infraestructura implementa un pipeline de **Destilación de Conocimiento (Knowledge Distillation)**. Extrae pasivamente la telemetría del sistema (logs), utiliza modelos de lenguaje (LLMs) para inferir la lógica semántica subyacente y genera flujos de trabajo determinísticos que los agentes de IA ejecutan de forma autónoma.

### El Diferenciador Táctico: "Log-to-Logic-Purge"
Para garantizar el cumplimiento normativo estricto y eliminar la superficie de ataque, este sistema implementa un ciclo de vida destructivo para los datos crudos:
1. **Shadow Ingestion:** Copia pasiva de logs sin afectar los sistemas de producción.
2. **Distillation:** Extracción de la regla lógica de negocio en formato de Grafo (JSON).
3. **Purge:** Eliminación absoluta y automática del log crudo original inmediatamente después de la validación. Conservamos la lógica, destruimos el riesgo.

---

## 🏗 Arquitectura del Sistema

La plataforma está diseñada como un sistema distribuido de alta disponibilidad, separando estrictamente la captura en el borde (*edge*), la orquestación concurrente y el plano de control humano.

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
Arquitectura *Headless* para la supervisión y gobernanza de los agentes.
* **Human-in-the-loop (HITL):** Interfaz visual donde los operadores auditan y aprueban los Grafos de Flujo destilados antes del despliegue del agente.
* **Agent Governance:** Gestión centralizada de credenciales de servicio (OAuth) y monitoreo de ejecución atómica por excepciones.

---

## 📂 Estructura del Repositorio (Domain-Driven Design)

El backend en Go sigue estrictamente los principios de Clean Architecture, aislando la lógica de negocio de la infraestructura de almacenamiento o proveedores de IA.

```text
apa-orchestrator/
├── cmd/
│   └── server/
│       └── main.go                 # Entry point & Dependency Injection (Wiring)
├── internal/
│   ├── core/                       
│   │   ├── domain/                 # Entidades: Agent, Workflow, RawLog
│   │   └── ports/                  # Contratos (Interfaces): Inbound & Outbound
│   ├── handlers/                   
│   │   ├── grpc/                   # Stream de ingesta desde el Edge (Rust)
│   │   └── http/                   # API para el Model Control Plane (Next.js)
│   ├── services/                   
│   │   └── distiller.go            # Casos de uso: Distillation Pipeline & Purge
│   └── storage/                    
│       ├── postgres/               # Estado inmutable: Reglas destiladas y auditoría
│       ├── minio/                  # Almacenamiento efímero para logs crudos
│       └── llm/                    # Adaptadores de IA (OpenRouter API)
├── pkg/
│   └── logger/                     # Utilidades de telemetría estructurada
├── deploy/
│   ├── docker-compose.yml          # Levantamiento de infraestructura local (DBs)
│   └── Dockerfile                  # Contenedorización del orquestador Go
├── go.mod
└── go.sum

```

## 🛠 Despliegue Local (Infraestructura como Código)
Este proyecto asume un entorno nativo de la nube. Utilice Docker para levantar las dependencias de infraestructura local (PostgreSQL para estado, MinIO para almacenamiento efímero).
 1. Clonar el repositorio:
   ```bash
   git clone https://github.com/codelym09/Codelym-Nexus.git
   cd Codelym-Nexus/deploy
   ```
 2. Levantar la infraestructura base:
   ```bash
   docker-compose up -d
   ```
 3. Configurar variables de entorno (.env):
   ```env
   OPENROUTER_API_KEY=tu_api_key
   POSTGRES_DSN=postgres://apa_admin:password@localhost:5432/apa_state?sslmode=disable
   MINIO_ENDPOINT=localhost:9000
   ```
 4. Ejecutar el Orquestador Core:
   ```bash
   cd ../cmd/server
   go run main.go
   ```

## 🛡️ Principios de Ingeniería Mantenidos en este Repositorio
 1. **Eficiencia en el Borde:** Las tareas pesadas de parseo se mantienen lejos del hardware del cliente.
 2. **Ejecución Atómica:** Los agentes ejecutan flujos de trabajo paso a paso. Si falla un paso, el estado se preserva y notifica para supervisión humana, asegurando 100% de consistencia.
 3. **Prioridad a la Infraestructura:** Este repositorio se centra estrictamente en la infraestructura técnica, la integración de APIs y el enrutamiento de datos.
 4. **Almacenamiento No-Sensible:** El motor no retiene datos operativos históricos. Si ocurre una brecha de seguridad en el sistema, los historiales de eventos crudos no existirán para ser extraídos.
