# Codelym Control Plane - TODO

## Funcionalidades Principales

### Autenticación y Seguridad
- [x] Autenticación con Google OAuth (ya configurada en template)
- [ ] Validación de sesión en rutas protegidas
- [ ] Logout seguro

### Base de Datos
- [ ] Tabla de workflows (flujos de trabajo)
- [ ] Tabla de logs (registros crudos)
- [ ] Tabla de workflow_steps (pasos del flujo)
- [ ] Tabla de workflow_history (historial de cambios)
- [ ] Relaciones entre tablas

### Backend - Ingesta de Logs
- [ ] Endpoint POST /api/logs/upload para subir archivos
- [ ] Endpoint POST /api/logs/paste para pegar contenido directo
- [ ] Validación y sanitización de logs
- [ ] Almacenamiento de logs en base de datos

### Backend - Pipeline de Destilación
- [ ] Integración con LLM (OpenRouter/Claude)
- [ ] Análisis de logs y generación de workflow JSON
- [ ] Validación del formato JSON de salida
- [ ] Almacenamiento de workflows destilados

### Backend - Expansión Continua
- [ ] Detección de nuevas acciones en logs
- [ ] Lógica de enriquecimiento de workflows existentes
- [ ] Actualización automática de pasos

### Backend - HITL (Human-in-the-Loop)
- [ ] Endpoint para obtener workflows pendientes de aprobación
- [ ] Endpoint para aprobar workflow
- [ ] Endpoint para rechazar workflow
- [ ] Cambio de estado en base de datos

### Frontend - Autenticación
- [ ] Página de login con Google OAuth
- [ ] Protección de rutas autenticadas
- [ ] Logout desde el dashboard

### Frontend - Dashboard Principal
- [ ] Diseño con gradiente violeta-teal
- [ ] Tipografía blanca, bold, grande en esquina inferior izquierda
- [ ] Subtítulos delicados en esquina superior derecha
- [ ] Composición asimétrica con espacio negativo
- [ ] Visualización de lista de workflows

### Frontend - Ingesta de Logs
- [ ] Formulario para subir archivos
- [ ] Área de texto para pegar logs directamente
- [ ] Indicador de progreso durante procesamiento
- [ ] Validación de entrada

### Frontend - Visualización de Workflows
- [ ] Componente de grafo interactivo
- [ ] Visualización de nodos y pasos
- [ ] Información detallada de cada paso
- [ ] Indicador de estado (pendiente, aprobado, ejecutando, completado, fallido)

### Frontend - HITL Interface
- [ ] Panel de revisión de workflows
- [ ] Botones de aprobar/rechazar
- [ ] Visualización de detalles antes de aprobación
- [ ] Confirmación de acciones críticas

### Frontend - Historial de Workflows
- [ ] Lista de todos los workflows
- [ ] Filtrado por estado
- [ ] Búsqueda de workflows
- [ ] Detalles de cada workflow

### Integración LLM
- [ ] Configuración de OpenRouter API
- [ ] Prompt engineering para análisis de logs
- [ ] Validación de respuestas JSON
- [ ] Manejo de errores de LLM

### Testing
- [ ] Tests unitarios para servicios de backend
- [ ] Tests de endpoints API
- [ ] Tests de componentes React
