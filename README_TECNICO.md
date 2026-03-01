# ⚙️ README_TECNICO.md - H2APP (Core Architecture)

Este documento detalla la estructura lógica profunda de la aplicación de Logística de Reparto (Stack: `MERN`). Está destinado a futuros ingenieros de software, DevOps o desarrolladores del núcleo del producto.

## 🏗️ 1. Arquitectura Multi-Tenant (El Pilar Principal)
La plataforma no es para un solo negocio; es un **SaaS B2B Multi-empresa (Multi-Tenant)**. 
- **Aislamiento de Datos por Documento:** Todos los esquemas sensibles de MongoDB (`Cliente.js`, `Venta.js`, `Gastos.js`, `Inventario.js`) inyectan un ObjectId mandatorio llamado `businessId`.
- **Inyección Transparente Backend:** Nunca confiamos en el `businessId` enviado por el frontend. El Token JWT del usuario ya codifica su `businessId` nativo. El middleware `verificarToken.js` parsea esto y se expone como un helper constante `biz(req)` en todos los controladores. Cada single query a Mongo de la plataforma empieza con `{ $match: { businessId: biz(req) } }`.
- **Índices Aislados:** Si un tenant crea un cliente "Juan Pérez", y otro distinto quiere crear "Juan Pérez", es perfectamente legal. Los índices de `unique` de Mongo (como el Teléfono en clientes) ahora incluyen `businessId` para que los checks de unicidad actúen en burbuja (`{ businessId: 1, telefono: 1 }`).

## 🔐 2. Seguridad y Niveles de Acceso (RBAC)
Existen tres Roles duros, y la estructura jerárquica va en descenso: `SuperAdmin -> Admin -> Empleado`.

- **Master Admin Code (`MASTER_ADMIN_CODE`):** Requisito inquebrantable en `.env`. Para crear un `Admin` que será dueño de una nueva empresa (`businessId` naciente), en la ruta de registro se debe proveer el MASTER CODE secreto. Previene inyecciones masivas anónimas de bases de datos de nuevos tenants fantasma.
- **Códigos Dinámicos y Vínculo (`InviteCodes.js`):** ¿Cómo un Empleado llega a un `businessId` creado por un admin? El Admin hace spawn de un "Código de Invitación" temporal de 6 dígitos que se guarda en DB apuntando a su `businessId`. El empleado lo introduce al registrarse y hereda el `businessId` como Tenant.
- **"The Kill Switch" y Suspensión Global:** Si una franquicia no abona su subscripción del Software, el `SuperAdmin` (tú, desarrollador) cambia el flag global de la empresa (`Activo: false` en BD o vía su Panel). El Middleware genérico detecta este boolean al momento de decodificar el JWT y desaloja toda petición devolviendo Status 403, apagando la UI instantáneamente para el dueño y sus choferes.

## 🎨 3. White Label y "Onboarding" Dinámico
La marca comercial de cada Tenant es plástica.
- **`ConfigParams.js` (MDB):** Al nacer un tenant, su config incluye nombre, logo string, y catálogo particular JSON.
- **Wizard Interrupter:** Si un Admin acaba de crear su cuenta, el Frontend interroga su `config`. Si detecta un onboarding vacío, una ruta interceptora modal (`OnboardingWizard.jsx`) oscurece la app y hace que configure los precios antes de pasar. Esto inyecta sus productos al esquema maestro de Venta de su Tenant.

## 💰 4. Lógica Financiera Estricta - Transacciones en Calle
- **Abonó vs Total:** El sistema de "Fiado" no es un módulo extra, es inercial. En `Venta.js`, si `monto_pagado` < `total`, automáticamente la deuda queda viva. 
- **Deuda Viva Dinámica:** La "Deuda de un Cliente" NUNCA es guardada fijamente en el documento del cliente (fomenta data races y desincronización). En cambio, se calcula en tiempo de vuelo mediante Aggregation Pipelines (`statsController.js`), sumando todas las diferencias entre `total` y `monto_pagado` de las operaciones asociadas a su `_id`.

## 📦 5. Activos e Inventario Físico (CAPEX)
El seguimiento de "Dispensers" y equipamiento prestado (comodatos) fue desarrollado para que audite de forma doble.
1. **Polo en la DB - `Inventario.js`:** Determina el total general adquirido, coste unitario y lo que queda en 'Depósito'.
2. **Registro Descentralizado - `Cliente.js`:** Cada cliente suma `dispensersAsignados`.
- La **Valorización y Auditoría:** La API `obtenerDashboardInventario` junta las puntas. Cuenta el número global sumando cuántos clientes tienen flag `dispensersAsignados > 0`, y cruza ese volumen con el costo unitario (`costoReposicion`) para tasar económicamente a toda la red entera.

## 🖥 6. Arquitectura UX/UI - Modernizando React
Toda la suite visual usa un approach estricto "Aqua-Industrial" y "Mobile-First":
- **Tailwind `clx.js`:** Minimalismo. Uso de variables abstractas `sm`, `min-h-[44px]` (para touch rules en móvil real) y skeletons iterados para tapar tiempos de respuesta de mongoose.
- **Layouts Desglosables:** `Navbar.jsx` tiene comportamiento Split en <= 768px: Bottom Bar (App estandar) limitada para los 6 operacionales duros, delegando la carga administrativa y secundaria a un Menú Hamburguesa en Dropdown modal (Top Bar) para no sofocar el UI.
- Uso de **Recharts** (`Pie`, `AreaChart`) para dashboard inyectando Gradientes SVG nativos.

## 🛡️ 7. Ciberseguridad y Blindaje de la API
Para proteger el ecosistema de la Base de Datos y mitigar ataques automatizados, se integraron defensas absolutas a nivel del entry-point:

1. **Políticas de CORS Dinámicas:** El servidor evalúa inteligentemente el entorno. Permite el tráfico sin fricciones hacia Vite (`http://localhost:5173` o `127.0.0.1`) en modo desarrollo. Sin embargo, en Producción rechaza peticiones (Preflight Options y Normales) que no provengan exactamente de la firma estipulada en `process.env.FRONTEND_URL`, impidiendo que frontends no autorizados clonen la UI y usen nuestra API.
2. **Protección contra Inyección NoSQL (Express 5 Compatibilidad):** Debido a que la API usa localmente Express 5, se descartó el uso de la dependencia `express-mongo-sanitize` (la cual genera un crash de `TypeError` al intentar reasignar los getters estrictos de `req.query`). En su lugar, rige un **middleware custom** (`sanitizeNoSQL.js`) ejecutado de forma global que recorre y muta recursivamente el payload por referencia, eliminando de raíz cualquier key dañina que inicie con `$` o `.`.
3. **Mitigación Anti-DDoS y Fuerza Bruta:** Toda la app está arropada por el paquete `express-rate-limit`. El tráfico regular tiene un cap general de 100 peticiones cada 15 min por IP. Por otro lado, las rutas críticas (`/api/auth/login` y `/api/auth/registrar`) cuentan con un escudo híper estricto de apenas **5 intentos cada 15 minutos**, abortando matemáticamente los ataques de fuerza bruta.
4. **Protección XSS y Configuración de Cabeceras:** Todo el request handling pasa a través de `helmet()`, despojando metadatos vulnerables (`X-Powered-By`) e implantando resguardos duros contra cross-site scripting (XSS), secuestro de Mime-types y ejecución de iframes falsos (Clickjacking).
