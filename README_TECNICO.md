# ⚙️ README Técnico - H2APP

Este documento detalla la arquitectura, los principios de diseño y las convenciones técnicas del proyecto H2APP. Está destinado a ingenieros de software, DevOps y futuros contribuidores al núcleo del producto.

## 1. Filosofía y Principios de Diseño

-   **Arquitectura Multi-Tenant:** El sistema está diseñado como un SaaS B2B. El aislamiento de datos es el pilar fundamental y se logra a nivel de documento en MongoDB mediante un `businessId` obligatorio.
-   **Seguridad por Defecto:** Las políticas de seguridad no son opcionales. Se aplican de forma global a través de middlewares y validaciones estrictas en el backend.
-   **Mobile-First:** La interfaz de usuario se diseña y construye priorizando la experiencia en dispositivos móviles, garantizando usabilidad y rendimiento en el campo.
-   **Screaming Architecture (Frontend):** La estructura del código del frontend está organizada por características (`features`), no por tipos de archivo, haciendo la base del código más intuitiva y escalable.

## 2. Arquitectura del Backend (`/BackEnd`)

El backend está construido sobre Node.js y Express 5, siguiendo un patrón RESTful modular.

#### El Núcleo: Sistema Multi-Tenant
-   **Aislamiento de Datos:** Cada documento en colecciones críticas (ventas, clientes, etc.) contiene una referencia `businessId`.
-   **Inyección Segura de Contexto:** El `businessId` se extrae del token JWT del usuario autenticado en un middleware (`verificarToken.js`) y se inyecta en cada consulta a la base de datos. El frontend nunca envía el `businessId` directamente.
-   **Índices Únicos por Tenant:** Las restricciones de unicidad en la base de datos (ej. teléfono del cliente) son compuestas y siempre incluyen el `businessId`, permitiendo que diferentes empresas usen los mismos datos sin colisiones.

#### Seguridad
-   **Autenticación y Autorización (RBAC):**
    -   Se utiliza JSON Web Tokens (JWT) para gestionar las sesiones.
    -   Existen tres roles con una jerarquía estricta: `SuperAdmin` > `Admin` > `Empleado`.
    -   El acceso a las rutas está protegido por middlewares que verifican tanto el token como el rol del usuario.
-   **Protección de la API:**
    -   **CORS Dinámico:** Restringe las peticiones a un `FRONTEND_URL` autorizado en producción.
    -   **Rate Limiting:** Previene ataques de fuerza bruta y DDoS en endpoints críticos como el login (`express-rate-limit`).
    -   **Sanitización de Entradas:** Un middleware personalizado elimina caracteres maliciosos (`$` y `.`) de las entradas para prevenir inyecciones NoSQL.
    -   **Cabeceras de Seguridad:** Se utiliza `helmet` para proteger contra vulnerabilidades comunes como XSS y clickjacking.

## 3. Arquitectura del Frontend (`/FrontEnd`)

El frontend es una Single Page Application (SPA) construida con React 19 y Vite.

#### Estructura de Carpetas (Screaming Architecture)
El directorio `src/` está organizado por funcionalidad de negocio:
-   `src/features/auth`: Lógica de autenticación, vistas de login/registro.
-   `src/features/sales`: Componentes y lógica para el registro de ventas.
-   `src/features/dashboard`: Vistas y componentes del panel de administrador.
-   `src/lib`: Clientes de API (Axios), helpers, etc.
-   `src/components/ui`: Componentes de interfaz de usuario genéricos y reutilizables.
-   `src/layouts`: Estructuras de página principales (ej. `AdminLayout`, `PublicLayout`).

#### Manejo del Estado
(Sección a completar. Ej: Se utiliza Zustand para el estado global de la sesión del usuario y el estado local de React (`useState`) para la gestión de formularios y componentes.)

## 4. Guía de Instalación para Desarrollo

### Requisitos Previos
-   Node.js (v18 o superior)
-   MongoDB (local o en un clúster de Atlas)

### Backend (`/BackEnd`)
1.  Navega al directorio: `cd BackEnd`
2.  Instala las dependencias: `npm install`
3.  Crea un archivo `.env` en la raíz de `/BackEnd` y configura las siguientes variables:
    ```
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    FRONTEND_URL=http://localhost:5173
    MASTER_ADMIN_CODE=your_super_secret_code
    ```
4.  Inicia el servidor: `npm run dev`

### Frontend (`/FrontEnd`)
1.  Navega al directorio: `cd FrontEnd`
2.  Instala las dependencias: `npm install`
3.  Crea un archivo `.env` en la raíz de `/FrontEnd` y configura la variable de la API:
    ```
    VITE_API_URL=http://localhost:5000/api
    ```
4.  Inicia la aplicación: `npm run dev`

La aplicación estará disponible en `http://localhost:5173`.

## 5. Convenciones y Guías de Estilo

Todas las contribuciones de código deben adherirse a las reglas definidas en el siguiente documento. El incumplimiento de estas reglas puede causar que el hook `pre-commit` falle.

➡️ **[Leer las Reglas de Código](./AGENTS.md)**
