# Refactor Plan: Migrating to Screaming Architecture

This document outlines the tasks required to refactor the `FrontEnd/src` directory to the new proposed architecture.

## Phase 1: Create New Directory Structure

- [ ] Create root directories:
  ```bash
  mkdir -p FrontEnd/src/app FrontEnd/src/core FrontEnd/src/features FrontEnd/src/shared
  ```
- [ ] Create `core` subdirectories:
  ```bash
  mkdir -p FrontEnd/src/core/auth/components FrontEnd/src/core/auth/pages FrontEnd/src/core/auth/services FrontEnd/src/core/config FrontEnd/src/core/http
  ```
- [ ] Create `features` subdirectories:
  ```bash
  mkdir -p FrontEnd/src/features/admin/components FrontEnd/src/features/admin/hooks FrontEnd/src/features/admin/pages FrontEnd/src/features/admin/services
  mkdir -p FrontEnd/src/features/customers/components FrontEnd/src/features/customers/hooks FrontEnd/src/features/customers/pages FrontEnd/src/features/customers/services
  mkdir -p FrontEnd/src/features/daily-route/components FrontEnd/src/features/daily-route/hooks FrontEnd/src/features/daily-route/pages FrontEnd/src/features/daily-route/services
  mkdir -p FrontEnd/src/features/dashboard/components FrontEnd/src/features/dashboard/hooks FrontEnd/src/features/dashboard/pages FrontEnd/src/features/dashboard/services
  mkdir -p FrontEnd/src/features/expenses/components FrontEnd/src/features/expenses/hooks FrontEnd/src/features/expenses/pages FrontEnd/src/features/expenses/services
  mkdir -p FrontEnd/src/features/inventory/components FrontEnd/src/features/inventory/hooks FrontEnd/src/features/inventory/pages FrontEnd/src/features/inventory/services
  mkdir -p FrontEnd/src/features/refills/components FrontEnd/src/features/refills/hooks FrontEnd/src/features/refills/pages FrontEnd/src/features/refills/services
  mkdir -p FrontEnd/src/features/sales/components FrontEnd/src/features/sales/hooks FrontEnd/src/features/sales/pages FrontEnd/src/features/sales/services
  ```
- [ ] Create `shared` subdirectories:
  ```bash
  mkdir -p FrontEnd/src/shared/assets FrontEnd/src/shared/components FrontEnd/src/shared/hooks FrontEnd/src/shared/lib FrontEnd/src/shared/services FrontEnd/src/shared/styles FrontEnd/src/shared/utils
  ```

## Phase 2: Move Files to New Structure

### App & Core
- [ ] **App Entry:**
    - [ ] Move `FrontEnd/src/App.jsx` to `FrontEnd/src/app/App.jsx`
    - [ ] Move `FrontEnd/src/main.jsx` to `FrontEnd/src/app/main.jsx`
    - [ ] Move `FrontEnd/src/index.css` to `FrontEnd/src/app/index.css`
- [ ] **Core - Auth:**
    - [ ] Move `FrontEnd/src/context/AuthContext.jsx` to `FrontEnd/src/core/auth/AuthContext.jsx`
    - [ ] Move `FrontEnd/src/services/authService.js` to `FrontEnd/src/core/auth/services/authService.js`
    - [ ] Move `FrontEnd/src/pages/LoginPage.jsx` to `FrontEnd/src/core/auth/pages/LoginPage.jsx`
    - [ ] Move `FrontEnd/src/pages/RegisterPage.jsx` to `FrontEnd/src/core/auth/pages/RegisterPage.jsx`
    - [ ] Move `FrontEnd/src/pages/OnboardingPage.jsx` to `FrontEnd/src/core/auth/pages/OnboardingPage.jsx`
    - [ ] Move `FrontEnd/src/pages/SuspendedPage.jsx` to `FrontEnd/src/core/auth/pages/SuspendedPage.jsx`
    - [ ] Move `FrontEnd/src/components/ProtectedRoute.jsx` to `FrontEnd/src/core/auth/components/ProtectedRoute.jsx`
- [ ] **Core - HTTP:**
    - [ ] Move `FrontEnd/src/services/api.js` to `FrontEnd/src/core/http/api.js`
- [ ] **Core - Config:**
    - [ ] Move `FrontEnd/src/context/ConfigContext.jsx` to `FrontEnd/src/core/config/ConfigContext.jsx`

### Features
- [ ] **Feature - Admin:**
    - [ ] Move `FrontEnd/src/pages/ConfigPage.jsx` to `FrontEnd/src/features/admin/pages/ConfigPage.jsx`
    - [ ] Move `FrontEnd/src/pages/SuperAdminPage.jsx` to `FrontEnd/src/features/admin/pages/SuperAdminPage.jsx`
    - [ ] Move `FrontEnd/src/pages/BroadcastPage.jsx` to `FrontEnd/src/features/admin/pages/BroadcastPage.jsx`
    - [ ] Move `FrontEnd/src/services/adminService.js` to `FrontEnd/src/features/admin/services/adminService.js`
    - [ ] Move `FrontEnd/src/services/superAdminService.js` to `FrontEnd/src/features/admin/services/superAdminService.js`
- [ ] **Feature - Customers:**
    - [ ] Move `FrontEnd/src/pages/ClientesPage.jsx` to `FrontEnd/src/features/customers/pages/ClientesPage.jsx`
    - [ ] Move `FrontEnd/src/services/clienteService.js` to `FrontEnd/src/features/customers/services/clienteService.js`
    - [ ] Move `FrontEnd/src/components/clientes/ClienteCard.jsx` to `FrontEnd/src/features/customers/components/ClienteCard.jsx`
    - [ ] Move `FrontEnd/src/components/clientes/FormCliente.jsx` to `FrontEnd/src/features/customers/components/FormCliente.jsx`
    - [ ] Move `FrontEnd/src/components/clientes/ModalHistorialFiados.jsx` to `FrontEnd/src/features/customers/components/ModalHistorialFiados.jsx`
    - [ ] Move `FrontEnd/src/components/clientes/ModalInactivos.jsx` to `FrontEnd/src/features/customers/components/ModalInactivos.jsx`
    - [ ] Move `FrontEnd/src/components/clientes/TelInput.jsx` to `FrontEnd/src/features/customers/components/TelInput.jsx`
- [ ] **Feature - Daily Route:**
    - [ ] Move `FrontEnd/src/pages/PlanillaPage.jsx` to `FrontEnd/src/features/daily-route/pages/PlanillaPage.jsx`
    - [ ] Move `FrontEnd/src/pages/__tests__/PlanillaPage.test.js` to `FrontEnd/src/features/daily-route/pages/__tests__/PlanillaPage.test.js`
- [ ] **Feature - Dashboard:**
    - [ ] Move `FrontEnd/src/pages/DashboardPage.jsx` to `FrontEnd/src/features/dashboard/pages/DashboardPage.jsx`
    - [ ] Move `FrontEnd/src/services/statsService.js` to `FrontEnd/src/features/dashboard/services/statsService.js`
- [ ] **Feature - Expenses:**
    - [ ] Move `FrontEnd/src/pages/GastosPage.jsx` to `FrontEnd/src/features/expenses/pages/GastosPage.jsx`
    - [ ] Move `FrontEnd/src/services/gastosService.js` to `FrontEnd/src/features/expenses/services/gastosService.js`
- [ ] **Feature - Inventory:**
    - [ ] Move `FrontEnd/src/pages/InventarioPage.jsx` to `FrontEnd/src/features/inventory/pages/InventarioPage.jsx`
    - [ ] Move `FrontEnd/src/services/inventarioService.js` to `FrontEnd/src/features/inventory/services/inventarioService.js`
- [ ] **Feature - Refills:**
    - [ ] Move `FrontEnd/src/pages/LlenadosPage.jsx` to `FrontEnd/src/features/refills/pages/LlenadosPage.jsx`
    - [ ] Move `FrontEnd/src/services/llenadoService.js` to `FrontEnd/src/features/refills/services/llenadoService.js`
- [ ] **Feature - Sales:**
    - [ ] Move `FrontEnd/src/pages/VentasPage.jsx` to `FrontEnd/src/features/sales/pages/VentasPage.jsx`
    - [ ] Move `FrontEnd/src/services/ventasService.js` to `FrontEnd/src/features/sales/services/ventasService.js`
    - [ ] Move `FrontEnd/src/components/ventas/` to `FrontEnd/src/features/sales/components/` (move all contents)

### Shared Code
- [ ] **Shared - Components:**
    - [ ] Move `FrontEnd/src/components/CanvasWaterTrail.jsx` to `FrontEnd/src/shared/components/CanvasWaterTrail.jsx`
    - [ ] Move `FrontEnd/src/components/ConfirmModal.jsx` to `FrontEnd/src/shared/components/ConfirmModal.jsx`
    - [ ] Move `FrontEnd/src/components/CounterInput.jsx` to `FrontEnd/src/shared/components/CounterInput.jsx`
    - [ ] Move `FrontEnd/src/components/FiltroTiempo.jsx` to `FrontEnd/src/shared/components/FiltroTiempo.jsx`
    - [ ] Move `FrontEnd/src/components/Modal.jsx` to `FrontEnd/src/shared/components/Modal.jsx`
    - [ ] Move `FrontEnd/src/components/Navbar.jsx` to `FrontEnd/src/shared/components/Navbar.jsx`
    - [ ] Move `FrontEnd/src/components/OfflineIndicator.jsx` to `FrontEnd/src/shared/components/OfflineIndicator.jsx`
    - [ ] Move `FrontEnd/src/components/Pagination.jsx` to `FrontEnd/src/shared/components/Pagination.jsx`
    - [ ] Move `FrontEnd/src/components/SkeletonLoader.jsx` to `FrontEnd/src/shared/components/SkeletonLoader.jsx`
- [ ] **Shared - Hooks:**
    - [ ] Move `FrontEnd/src/hooks/useInstallPrompt.js` to `FrontEnd/src/shared/hooks/useInstallPrompt.js`
    - [ ] Move `FrontEnd/src/hooks/useListaCrud.js` to `FrontEnd/src/shared/hooks/useListaCrud.js`
    - [ ] Move `FrontEnd/src/hooks/usePagination.js` to `FrontEnd/src/shared/hooks/usePagination.js`
- [ ] **Shared - Services:**
    - [ ] Move `FrontEnd/src/services/crudService.js` to `FrontEnd/src/shared/services/crudService.js`
- [ ] **Shared - Styles:**
    - [ ] Move `FrontEnd/src/styles/cls.js` to `FrontEnd/src/shared/styles/cls.js`
- [ ] **Shared - Utils:**
    - [ ] Move `FrontEnd/src/utils/format.js` to `FrontEnd/src/shared/utils/format.js`
    - [ ] Move `FrontEnd/src/utils/productos.js` to `FrontEnd/src/shared/utils/productos.js`
    - [ ] Move `FrontEnd/src/utils/__tests__/` to `FrontEnd/src/shared/utils/__tests__/` (move all contents)

## Phase 3: Verification

- [ ] Run `npm install` to ensure all dependencies are correct.
- [ ] Run `npm run dev` to start the development server. Check the browser console for any import errors and fix them.
- [ ] Navigate through the application to ensure all pages and features work as expected.
- [ ] Run `npm run test` to execute all tests and ensure they pass in their new locations.
- [ ] Run `npm run build` to ensure the application compiles successfully for production.

## Phase 4: Cleanup

- [ ] Delete all the old, now empty, directories (`components`, `context`, `hooks`, `pages`, `services`, `styles`, `utils`).
