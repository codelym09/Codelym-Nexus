# Plan de implementación — Nube Store MVP

## Alcance

Añadir al control plane una experiencia de e-commerce autocontenida y navegable en `/store`, sin romper las rutas existentes de Codelym Nexus. La primera iteración valida el flujo tienda → catálogo → carrito → checkout y añade un panel operacional ligero para catálogo, pedidos y configuración.

## Decisiones de implementación

- Reutilizar React, Vite, Tailwind y Lucide ya presentes.
- Mantener el dashboard existente para las rutas actuales.
- Renderizar `/store` fuera de la capa de autenticación del control plane para que el MVP pueda probarse inmediatamente.
- Usar estado local para simular catálogo, carrito, checkout y estados de pedidos; dejar los puntos de integración claros para sustituirlos por tRPC/Drizzle en la siguiente iteración.
- Servir activos fotográficos locales desde `client/public/store`.
- Añadir `public/manus-routes.json` con la ruta pública del MVP y las rutas existentes.

## Diseño

### Movimiento

**Editorial commerce / quiet luxury latinoamericano**: una tienda que se siente como una revista de objetos bien curados, no como un backoffice genérico.

### Principios

1. Calma visual y jerarquía tipográfica clara.
2. Materialidad cálida mediante marfil, terracota, carbón y superficies de papel.
3. Navegación lateral compacta para operar, lienzo amplio para vender.
4. Interacciones rápidas con feedback visible y poca fricción.

### Color

Marfil y arena forman la base acogedora; carbón da contraste y legibilidad; terracota funciona como color propio de la marca y guía las acciones; verde salvia comunica estados positivos y calma.

### Layout

Shell de dos zonas: rail lateral de administración y canvas editorial con hero asimétrico. En catálogo, las cards respiran y alternan proporciones; en pedidos, una tabla aireada con estados tipo píldora.

### Firma visual

- Monograma “CN” dentro de un cuadrado terracota.
- Etiquetas de estado con borde fino y fondos translúcidos.
- Cards de producto con marco fotográfico cálido y una línea de categoría en mayúsculas.

### Interacción y animación

Hover suave de 180–240ms, entradas escalonadas en el dashboard, drawer de carrito desde la derecha, modal de checkout con avance por pasos y estados confirmados con microcopy directo. No usar animaciones decorativas que dificulten la operación.

### Tipografía

`DM Sans` para interfaz y lectura; `Fraunces` para titulares editoriales y precios destacados. Jerarquía: eyebrow 11px uppercase, títulos 32–56px, cuerpo 14–16px, metadatos 11–12px.

### Esencia de marca

**Casa Nómada ayuda a marcas de bienestar independientes a vender con una tienda que se siente tan cuidada como sus productos.** Personalidad: serena, curada, cercana.

### Voz

Headlines: breves y sensoriales. CTAs: verbos claros, sin lenguaje técnico. Ejemplos: “Haz espacio para lo esencial” y “Publicar mi tienda”.

### Wordmark

“casa nómada” en minúsculas con el monograma CN como sello editorial.

### Color de marca

Terracota `#C45F45`.

## Estructura

- `client/src/pages/CommerceMVP.tsx`: shell, catálogo, carrito, checkout, pedidos y configuración local.
- `client/src/App.tsx`: separa la ruta pública `/store` del panel autenticado existente.
- `client/src/index.css`: tokens y estilos específicos de Casa Nómada.
- `client/public/store/*`: fotos del catálogo y hero.
- `client/public/manus-routes.json`: manifiesto de rutas.

## Siguiente integración real

Sustituir los arrays y handlers locales por tablas `stores`, `products`, `orders`, `order_items`, `payments` y `shipping_rules`; extraer la capa de estado a routers tRPC; conectar el primer proveedor de pago mediante webhooks idempotentes y habilitar autenticación por tienda.
