# 🚚 App Reparto (SaaS B2B)

**App Reparto** es una plataforma integral de gestión logística y ventas en ruta (Software as a Service) diseñada específicamente para empresas de reparto de bidones de agua, soda y productos afines. Construida sobre el stack **MERN** (MongoDB, Express, React, Node.js), la aplicación adopta un enfoque _Mobile-First_ para facilitar el trabajo ágil de los repartidores en la calle, mientras otorga a los administradores un panel de control completo y robusto.

---

## 🏗️ Arquitectura y Tecnologías

La plataforma está dividida en dos módulos principales:

### Frontend (`/FrontEnd`)
- **React 19 & Vite:** Renderizado ultrarrápido y empaquetado optimizado.
- **Tailwind CSS:** Diseño UI/UX moderno, minimalista ("Aqua-Industrial") y responsivo. Adaptado para uso intuitivo con una sola mano en dispositivos móviles (botones amplios, bottom navigation bar).
- **React Router v7:** Manejo de rutas y accesos protegidos según rol.
- **Axios & Recharts:** Consumo de la API RESTful y visualización de estadísticas y gráficos de rendimiento en tiempo real.
- **PWA (Progressive Web App):** Capacidad de instalación en dispositivos móviles simulando una app nativa gracias a `vite-plugin-pwa`.

### Backend (`/BackEnd`)
- **Node.js & Express 5:** API RESTful modular y de alto rendimiento.
- **MongoDB & Mongoose:** Base de datos NoSQL con esquemas estrictos.
- **Arquitectura Multi-Tenant (Multi-empresa):** Aislamiento total de la información. Cada operador (dueño de franquicia) tiene su propio ecosistema de datos protegido mediante inyección de `businessId` a nivel de token JWT y capa de Middlewares.
- **Ciberseguridad:**
  - **CORS dinámicos:** Restringe peticiones solo desde el frontend autorizado.
  - **Express-Rate-Limit:** Prevención activa de ataques DDoS y fuerza bruta en endpoints críticos (Login/Registro).
  - **Helmet & Sanitizador Custom:** Protección global contra ataques XSS y limpiador recursivo anti-inyección NoSQL.

---

## ✨ Características Principales

### 👨‍💼 Para el Administrador (Dueño del Negocio)
1. **White Labeling Dinámico:** Configura el nombre de tu franquicia, tus precios y tu propio catálogo de productos al instante mediante un _Wizard de Onboarding_.
2. **Tablero Financiero y Estadísticas (Stats):** Visualización en tiempo real de la "Caja Real" (dinero efectivo recaudado) versus la "Deuda Viva" (dinero pendiente por cobrar en la calle).
3. **Gestión de RRHH:** Sistema de "Códigos de Invitación" temporales y seguros para afiliar repartidores sin exponer credenciales críticas. Control absoluto para activar, suspender o bloquear choferes.
4. **Inventario Físico (Capital):** Control estricto de los dispensadores en depósito vs. los comodatos asignados en domicilios de clientes, tasando el capital bloqueado.
5. **Panel Automático de Recupero:** Alertas de clientes inactivos (por ej., más de 20 días sin comprar teniendo equipos prestados).

### 🚚 Para el Repartidor (Chofer en Calle)
1. **Ventas y Cobranzas Ultra Rápidas:** Registro rápido de entregas.
2. **Motor Analítico de Fiados:** Si un cliente no abona el total de la entrega, el sistema automáticamente calcula, retiene y suma la "Deuda" activa del cliente (marcada en rojo), sin cálculos manuales.
3. **Filtro del Día ("Cierre de Caja"):** Una vista concentrada con lo facturado, lo fiado y la cantidad de entregas del turno.

---

## 🔒 Roles y Niveles de Acceso (RBAC)

El sistema opera bajo un férreo control de acceso basado en roles:
1. **SuperAdmin:** Dueño del Software. Mantiene el _Kill Switch_ universal capaz de desconectar globalmente franquicias que incumplan suscripciones. Ingreso asegurado por una variable de entorno `MASTER_ADMIN_CODE`.
2. **Admin:** Dueño de la franquicia distribuidora. Controla precios, inventario, visualiza las finanzas globales y gestiona a sus empleados.
3. **Empleado (Chofer):** Solo ve el flujo operativo diario. Puede cargar ventas y registrar cobranzas vinculadas siempre al `businessId` de su jefe, pero no tiene acceso a las finanzas jerárquicas ni puede eliminar registros (protección anti-fraude).

---

## 🚀 Despliegue y Ejecución Local

Para levantar todo el entorno de desarrollo localmente:

### Requisitos Previos
- Node.js (v18 o superior recomendado)
- MongoDB corriendo localmente o un clúster de MongoDB Atlas.

### 1. Configurar el Backend
```bash
cd BackEnd
npm install
# Crear archivo .env en la raíz de BackEnd basándose en las variables necesarias
# (MONGO_URI, JWT_SECRET, FRONTEND_URL, MASTER_ADMIN_CODE, etc.)
npm run dev
```

### 2. Configurar el Frontend
```bash
cd FrontEnd
npm install
# Crear archivo .env en la raíz de FrontEnd
# VITE_API_URL=http://localhost:5000/api
npm run dev
```

Visita `http://localhost:5173` para ingresar a la plataforma.

---

*Desarrollado para optimizar hasta el último recurso logístico del distribuidor de a pie.* 💧
