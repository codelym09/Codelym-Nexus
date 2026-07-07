# Codelym Control Plane - TODO

## Funcionalidades Principales

### Autenticación y Seguridad
- [x] Autenticación con Google OAuth (ya configurada en template)
- [x] Validación de sesión en rutas protegidas
- [x] Logout seguro
- [x] Roles de usuario (user/admin)

### Base de Datos
- [x] Tabla de workflows (flujos de trabajo)
- [x] Tabla de logs (registros crudos)
- [x] Tabla de workflow_steps (pasos del flujo)
- [x] Tabla de workflow_history (historial de cambios)
- [x] Relaciones entre tablas
- [x] Tabla de security_audit_log (auditoría)
- [x] Tabla de security_events (eventos de seguridad)
- [x] Tabla de webhook_events (eventos de webhook)
- [x] Tabla de payment_plans (planes de suscripción)
- [x] Tabla de payment_transactions (transacciones)
- [x] Tabla de user_subscriptions (suscripciones de usuario)
- [x] Tabla de failed_login_attempts (intentos fallidos de login)

### Backend - Ingesta de Logs
- [x] Endpoint POST /api/logs/upload para subir archivos
- [x] Endpoint POST /api/logs/paste para pegar contenido directo
- [x] Validación y sanitización de logs
- [x] Almacenamiento de logs en base de datos

### Backend - Pipeline de Destilación
- [x] Integración con LLM (OpenRouter/Claude)
- [x] Análisis de logs y generación de workflow JSON
- [x] Validación del formato JSON de salida
- [x] Almacenamiento de workflows destilados

### Backend - Expansión Continua
- [x] Detección de nuevas acciones en logs
- [x] Lógica de enriquecimiento de workflows existentes
- [x] Actualización automática de pasos

### Backend - HITL (Human-in-the-Loop)
- [x] Endpoint para obtener workflows pendientes de aprobación
- [x] Endpoint para aprobar workflow
- [x] Endpoint para rechazar workflow
- [x] Cambio de estado en base de datos

### Backend - Pagos (Stripe + MercadoPago)
- [x] createCheckoutSession (Stripe)
- [x] createMercadopagoSession (MercadoPago)
- [x] getMySubscription
- [x] getMyTransactions
- [x] cancelSubscription
- [x] getPlans

### Backend - Webhooks
- [x] Webhook endpoint para Stripe (/api/webhooks/stripe)
- [x] Webhook endpoint para MercadoPago (/api/webhooks/mercado_pago)
- [x] Procesamiento de eventos de pago
- [x] Actualización automática de suscripciones
- [x] Detección de duplicados
- [x] Auditoría de eventos de webhook

### Backend - Seguridad y Auditoría
- [x] Registro de auditoría de todas las acciones
- [x] Eventos de seguridad (high/critical)
- [x] Tracking de intentos fallidos de login
- [x] getAuditStats (estadísticas de auditoría)
- [x] getSecurityStats (estadísticas de seguridad)
- [x] getFailedLoginStats (estadísticas de login)
- [x] getAuditLog (registro de auditoría)
- [x] getSecurityEvents (eventos de seguridad)
- [x] resolveSecurityEvent (resolución de eventos)
- [x] exportAuditLog (exportación en JSON/CSV)
- [x] exportSecurityEvents (exportación en JSON/CSV)
- [x] exportPaymentTransactions (exportación en JSON/CSV)
- [x] exportFullReport (reporte completo consolidado)

### Backend - Notificaciones
- [x] getNotifications (notificaciones de usuario)
- [x] sendPaymentNotification (notificaciones de pago)
- [x] notifyOwner (notificaciones al owner)
- [x] processPaymentWebhook (integración con webhooks)

### Backend - Admin Dashboard
- [x] getOverview (resumen general)
- [x] listUsers (gestión de usuarios)
- [x] updateUserRole (promoción de rol)
- [x] getAllWorkflows (todos los workflows)
- [x] getFinancialOverview (dashboard financiero)
- [x] getSecurityOverview (dashboard de seguridad)
- [x] getSubscriptionOverview (dashboard de suscripciones)

### Frontend - Autenticación
- [x] Página de login con Google OAuth (template)
- [x] Protección de rutas autenticadas
- [x] Logout desde el dashboard

### Frontend - Dashboard Principal
- [x] Diseño con gradiente violeta-teal
- [x] Tipografía blanca, bold, grande
- [x] Composición asimétrica con espacio negativo
- [x] Visualización de lista de workflows
- [x] Cards de estadísticas rápidas
- [x] Acciones rápidas
- [x] Notificaciones recientes

### Frontend - Ingesta de Logs
- [x] Formulario para subir archivos
- [x] Área de texto para pegar logs directamente
- [x] Indicador de progreso durante procesamiento
- [x] Validación de entrada
- [x] Toggle entre modo paste/upload

### Frontend - Visualización de Workflows
- [x] Componente de grafo interactivo
- [x] Visualización de nodos y pasos
- [x] Información detallada de cada paso
- [x] Indicador de estado (pendiente, aprobado, ejecutando, completado, fallido)
- [x] Historial de cambios del workflow

### Frontend - HITL Interface
- [x] Panel de revisión de workflows
- [x] Botones de aprobar/rechazar
- [x] Visualización de detalles antes de aprobación
- [x] Confirmación de acciones críticas

### Frontend - Historial de Workflows
- [x] Lista de todos los workflows
- [x] Filtrado por estado
- [x] Búsqueda de workflows
- [x] Detalles de cada workflow

### Frontend - Billing / Suscripción
- [x] Página de gestión de suscripción
- [x] Visualización de planes disponibles
- [x] Checkout con Stripe
- [x] Checkout con MercadoPago
- [x] Cancelación de suscripción
- [x] Historial de transacciones

### Frontend - Dashboard de Seguridad
- [x] Stats cards (auditoría, críticos, sin resolver, login fallidos)
- [x] Tab de auditoría con filtros
- [x] Tab de eventos de seguridad con resolución
- [x] Tab de estadísticas
- [x] Botones de exportación
- [x] Filtros de severidad y rango temporal

### Frontend - Dashboard Admin
- [x] Vista de usuarios con gestión de roles
- [x] Vista de workflows
- [x] Vista financiera (ingresos, transacciones, proveedores)
- [x] Vista de seguridad (eventos críticos, login fallidos)
- [x] Vista de suscripciones (churn rate, por estado)

### Integración LLM
- [x] Configuración de OpenRouter API
- [x] Prompt engineering para análisis de logs
- [x] Validación de respuestas JSON
- [x] Manejo de errores de LLM

### Testing
- [ ] Tests unitarios para servicios de backend
- [ ] Tests de endpoints API
- [ ] Tests de componentes React
