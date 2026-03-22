# 🚚 H2APP (SaaS B2B)

**Gestión logística y ventas en ruta para distribuidores de agua y soda. Simple para el repartidor, potente para el administrador.**

---

[![Estado del Build](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/) 
[![Versión](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/) 
[![Licencia](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

**H2APP** es una plataforma integral (Software as a Service) diseñada para digitalizar y optimizar la operación de empresas de reparto. Construida con un enfoque _Mobile-First_, erradica el uso de papel, libretas de deudores y planillas manuales, centralizando toda la logística y finanzas en la nube.

🔴 **[VER DEMO EN VIVO](https://h2app-one.vercel.app)** 🔴

---

## 🚀 El Impacto en Producción
Este sistema **opera activamente en un entorno real**. Actualmente, es utilizado a diario por un repartidor independiente en su ruta, logrando **eliminar el 100% del uso de papel** en su operación. La iteración continua basada en feedback directo de la calle resultó en una adopción exitosa y una lógica financiera sin discrepancias.

## ✨ Arquitectura Modular y Lógica de Negocio

- 🔐 **Gestión de Roles (RBAC) y Seguridad:** Control de acceso estricto. El administrador tiene visibilidad total; el empleado solo accede a su ruta. Los empleados se unen mediante códigos de invitación únicos y pueden ser suspendidos en tiempo real por el administrador (Kill Switch).
- 🚚 **Módulo de Ruta Diaria (Mobile-First):** Agilidad extrema para el repartidor. Registro de entregas, cobros (efectivo/transferencia) y fiados con interfaces de alto contraste para uso en movimiento.
- 💰 **Cuentas Corrientes y Deudas:** Reemplaza la libreta de papel. Calcula automáticamente saldos históricos ("fiados"), gestiona entregas parciales y mantiene un historial inmutable.
- 📊 **Dashboard Financiero:** Exclusivo para administradores. Contrasta en tiempo real la **Caja Real** (dinero a rendir deduciendo gastos operativos) vs. la **Deuda Viva** (capital en la calle).
- 💧 **Módulo de Llenados:** Registro de recarga de mercadería (producción o compra mayorista) para costeo y control de márgenes.
- 📦 **Control Patrimonial (Inventario):** Visión del capital total del negocio. Seguimiento del patrimonio completo: bidones, sifones y dispensadores (frío/calor), tanto en depósito como prestados (comodato).
- 🏢 **Arquitectura Multi-Tenant:** Múltiples empresas operan simultáneamente con sus datos estricta y criptográficamente aislados.

## 🛠️ Stack Tecnológico y Prácticas

- **Frontend:** React 19 + Vite, Zustand (estado global), Tailwind CSS, Recharts. Empaquetado como **PWA** para instalación nativa.
- **Backend:** Node.js, Express 5. Arquitectura RESTful en capas (Controllers, Services, Models).
- **Base de Datos:** MongoDB + Mongoose (NoSQL) en MongoDB Atlas.
- **Seguridad:** Autenticación con **Cookies HttpOnly** (mitigación XSS), Helmet.js, Rate Limiting y CORS dinámico.
- **Infraestructura:** CI/CD con despliegues en Vercel (Front) y Render (Back).

---

## 🚀 Comenzando

### ¿Eres el dueño o un repartidor?
Toda la información sobre cómo usar la plataforma se encuentra en nuestro manual completo.

➡️ **[Leer el Manual de Usuario](./MANUAL_DE_USUARIO.md)**

### ¿Eres desarrollador?
La guía de arquitectura, instalación y contribución está en el README técnico.

➡️ **[Ver el README Técnico](./README_TECNICO.md)**

Para una instalación rápida en un entorno local:

1.  **Backend:**
    ```bash
    cd BackEnd
    npm install
    # Crear y configurar .env basado en .env.example
    npm run dev
    ```
2.  **Frontend:**
    ```bash
    cd FrontEnd
    npm install
    # Crear y configurar .env basado en .env.example
    npm run dev
    ```

---

*Desarrollado para optimizar hasta el último recurso del distribuidor.* 💧