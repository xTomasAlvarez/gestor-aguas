# Proposal: New Directory Structure based on Screaming Architecture

## Intent

The current source code structure is not explicitly defined. To improve scalability, maintainability, and developer onboarding, this proposal outlines a new structure for `FrontEnd/src` following the principles of "screaming architecture". This change will organize the code by business domain (features) instead of by technical type, making the application's purpose clear from its folder layout.

## Scope

### In Scope
- Define a new top-level directory structure under `FrontEnd/src`.
- Group code into modules based on the 9 identified business domains.
- Define a standard internal structure for each feature directory.
- Define a clear location for shared, core, and cross-cutting concerns (e.g., authentication, UI library, configuration).

### Out of Scope
- Moving any existing files into the new structure. This proposal only defines the target structure.
- Creating any new files (`index.ts`, etc.).
- Refactoring any existing code.

## Approach

The new structure will be organized around business domains, with most domains residing under a `features/` directory. Each domain will have its own folder containing all related code (components, hooks, services, types, etc.). A `core` directory will handle application-wide logic like authentication, and a `shared` directory will house truly generic, reusable components and utilities.

### Proposed Directory Tree

```
FrontEnd/src/
├── app/                   # App entry point, routing, global providers
|
├── core/                  # Cross-cutting concerns, singletons, app-wide logic
│   ├── auth/              # 7. Authentication services, contexts, hooks
│   ├── config/            # Environment variables, app configuration
│   └── http/              # Configured API client (e.g., Axios instance)
|
├── features/              # Business domain modules
│   ├── admin/             # 8. Administración y Configuración
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── services/
│   │
│   ├── customers/         # 2. Gestión de Clientes
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── services/
│   │
│   ├── daily-route/       # 3. Planilla / Hoja de Ruta Diaria
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── services/
│   │
│   ├── dashboard/         # 9. Dashboard y Estadísticas
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── services/
│   │
│   ├── expenses/          # 6. Gestión de Gastos
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── services/
│   │
│   ├── inventory/         # 4. Gestión de Inventario
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── services/
│   │
│   ├── refills/           # 5. Gestión de Llenados
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── services/
│   │
│   └── sales/             # 1. Gestión de Ventas y Cobranzas
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       └── services/
│
└── shared/                # Truly generic code, reusable across all features
    ├── assets/            # Static assets (images, fonts, etc.)
    ├── components/        # Reusable UI components (Button, Input, Modal)
    ├── hooks/             # Generic, reusable hooks (useWindowSize)
    ├── lib/               # Third-party library configurations
    └── utils/             # Generic utility functions (date formatters, etc.)
```

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `FrontEnd/src` | New | This is a conceptual proposal for a new directory structure. No files will be moved or modified at this stage. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| The proposed structure may not perfectly fit all future requirements. | Low | The modular nature of the architecture allows for easy adaptation and refactoring as new requirements emerge. |

## Rollback Plan

As this proposal does not change any code, no rollback is necessary. If the proposal is rejected, we simply do not proceed with the implementation phase.

## Dependencies

- None.

## Success Criteria

- [ ] The development team formally accepts the proposal as the new standard for organizing the `FrontEnd/src` directory.
- [ ] New features developed follow the proposed structure.
