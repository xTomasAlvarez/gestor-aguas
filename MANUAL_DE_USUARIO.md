# 📘 MANUAL DE USUARIO

Bienvenido al **Manual de Usuario** del Sistema Gestor de Reparto y Cobranzas. Esta guía está diseñada para ayudarte a entender y aprovechar al máximo todas las herramientas que ofrece la plataforma, un software integral (SaaS) pensado para optimizar la operativa y administración diaria de empresas distribuidoras de agua y soda.

---

## 1. INTRODUCCIÓN Y CONCEPTOS BÁSICOS

Este sistema centraliza el control total de tu distribuidora. Permite gestionar en tiempo real:
- El recorrido diario de los repartidores.
- Las ventas, cobros y el fiado de los clientes.
- El movimiento de envases prestados y retornados.
- El inventario físico y los procesos de llenado.
- Los gastos operativos y el cierre de caja.

Al funcionar bajo el modelo **SaaS (Software as a Service / Multi-tenant)**, la aplicación aloja a múltiples empresas de reparto de forma simultánea. Cada empresa cuenta con un entorno 100% privado y seguro; ninguna empresa tiene acceso a los datos, clientes o números de otra.

---

## 2. GESTIÓN DE ROLES Y EMPRESAS (El modelo SaaS)

El sistema opera con tres niveles de acceso: **Dueño/Admin**, **Empleado/Repartidor** y **SuperAdmin**.

### Registro de una Nueva Empresa (Rol: Admin)
Para dar de alta un negocio nuevo en la plataforma:
1. Accede a la pantalla de Registro.
2. Completa tus datos personales (Nombre, Email, Contraseña).
3. Ingresa el **Código de Administrador Maestro** (entregado por los proveedores del software) y el nombre de tu distribuidora.
4. Una vez registrado, tu cuenta será nivel **`admin`** y se creará automáticamente el entorno virtual exclusivo de tu empresa.

### Vincular Repartidores (Rol: Empleado)
El sistema facilita la incorporación de tu equipo de trabajo mediante un proceso automatizado con el **Código de Vinculación**:
1. El **Admin** debe buscar su **Código de Vinculación** (ej. `X8A9L`) en la pestaña de Configuración y entregárselo a sus repartidores.
2. El empleado ingresa a la pantalla de Registro, elige "Unirse a Empresa Existente" y digita sus datos junto con el código proporcionado.
3. Al registrarse, su cuenta quedará **Inactiva**. 
4. El Admin verá la solicitud pendiente en su panel y deberá **aprobarla**. A partir de ese momento, el usuario podrá ingresar al sistema con el rol **`empleado`**.

---

## 3. PLANILLA DE REPARTO (Ruta Diaria)

El módulo de **Planilla** es la herramienta principal que utiliza el repartidor en la calle. Reemplaza al clásico cuaderno o planilla de papel.

- **Organización del Recorrido:** Permite visualizar los clientes que corresponden visitar en el día, ordenados lógicamente.
- **Acceso Rápido:** Desde la planilla, el repartidor puede registrar rápidamente una nueva venta, anotar un pago o asentar envases devueltos con un par de clics, sin necesidad de navegar por menús complejos.
- **Seguimiento en Tiempo Real:** A medida que el repartidor visita clientes y registra operaciones, el administrador puede ver la evolución de la ruta y las ventas desde la central.

---

## 4. GESTIÓN DE CLIENTES Y VENTAS (FIADOS)

Este módulo es el corazón financiero de la aplicación. Te permite dar de alta nuevos clientes con sus datos de contacto, dirección y lista de precios personalizada.

### Registrar Ventas y Fiados
Cuando un repartidor deja productos en un domicilio:
- Registra una nueva Venta seleccionando los artículos.
- Si el cliente paga la totalidad en el momento, la venta queda en estado **Saldado**.
- Si el cliente no paga (o paga solo una parte), se selecciona la opción **Fiado**. El sistema sumará el monto adeudado a la cuenta corriente del cliente (Deuda en Dinero) y la venta figurará como **Pendiente** o **Pago Parcial**.
- Paralelamente, los bidones o cajones entregados se suman automáticamente a los **Envases Prestados** del cliente.

### ⚠️ DETALLE CRÍTICO SOBRE COBRANZAS Y ENVASES
Para mantener un arqueo de caja perfecto y evitar confusiones, el sistema procesa el dinero y los envases por vías transaccionales separadas:

1. **La "Cobranza" (Ingreso de Dinero):** Se usa exclusivamente cuando el cliente entrega dinero para pagar deudas viejas. Al registrar una cobranza, ese dinero entra a la caja del día y el saldo deudor del cliente disminuye.
2. **Los "Envases Devueltos" (Movimiento de Stock):** Se usa cuando el cliente devuelve bidones vacíos. Esto **NO** ingresa dinero a la caja, sino que descuenta la cantidad devuelta de los "Envases Prestados" que tiene a su nombre.

### Liquidación de Deudas (Múltiples Tickets)
Si un cliente tiene varios tickets fiados acumulados de diferentes fechas y desea saldarlos:
1. Entra al perfil del cliente.
2. Selecciona todos los tickets que el cliente va a pagar.
3. Presiona el botón **"Liquidar Deuda"**.
4. Ingresa el monto total de dinero que entrega el cliente y la cantidad de envases vacíos que está devolviendo.
5. El sistema aplicará de forma inteligente el pago y los envases a los tickets seleccionados, saldándolos del más antiguo al más nuevo.

---

## 5. INVENTARIO Y LLENADOS

Tener el control físico de tus productos es fundamental para evitar pérdidas.

- **Inventario:** Aquí podrás visualizar el stock actual de productos llenos listos para la venta (Bidones de 20L, 12L, Sodas, etc.) y el stock de envases vacíos disponibles en planta.
- **Módulo de Llenados:** Cada vez que la planta o el proveedor recarga envases vacíos para convertirlos en producto listo para vender, debes registrar un "Llenado". El sistema automáticamente descontará esa cantidad de tu stock de "envases vacíos" y la sumará a tu stock de "producto lleno".

---

## 6. CONTROL DE GASTOS

La aplicación te permite llevar el registro de todas las salidas de dinero (egresos) que ocurren durante la jornada laboral.

- En el módulo de **Gastos**, cualquier repartidor o administrador puede asentar el dinero utilizado para cargar combustible, comprar repuestos, pagar peajes o realizar mantenimiento de los vehículos.
- Cada gasto registrado se descontará automáticamente del cálculo final de la caja, asegurando que la ganancia neta reportada sea real.

---

## 7. CAJA Y ESTADÍSTICAS (Dashboard)

El panel principal (Dashboard) es tu centro de mando para visualizar la salud de tu negocio.

- **Caja Diaria:** Visualiza en tiempo real todo el dinero que entró hoy (tanto por ventas al contado como por cobranzas de fiados) menos los gastos del día.
- **Estadísticas Mensuales:** Gráficos y reportes con el balance general mensual, ingresos totales y gastos.
- **Capital en la Calle:** Podrás ver cuánto dinero total y cuántos envases tienes prestados y pendientes de cobro entre todos tus clientes, además de un ranking con tus principales compradores.

---

## 8. PANEL DE SUPERADMIN (Anexo de Uso Interno)

El software cuenta con un acceso especial de nivel **`superadmin`** diseñado exclusivamente para los dueños o administradores de la plataforma (no para los dueños de las distribuidoras).

**Funciones del SuperAdmin:**
- Tiene un panel global desde el cual puede visualizar el listado completo de todas las Empresas cliente (distribuidoras) que usan el sistema.
- Por privacidad, el SuperAdmin **NO tiene acceso** a las ventas, caja o listado de clientes de las distribuidoras.
- **Suspender Empresa (Kill Switch):** El SuperAdmin tiene la capacidad de bloquear o suspender el acceso de cualquier distribuidora (por ejemplo, en caso de falta de pago del servicio SaaS). Una vez suspendida, ni el administrador de esa empresa ni sus repartidores podrán ingresar a la aplicación hasta que la cuenta sea reactivada.
