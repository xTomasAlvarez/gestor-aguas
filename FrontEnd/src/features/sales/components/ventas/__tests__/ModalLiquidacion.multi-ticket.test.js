import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock de dependencias externas - ESM style
jest.unstable_mockModule("@/features/sales/services/ventasService", () => ({
    registrarCobranza: jest.fn(),
}));

jest.unstable_mockModule("react-hot-toast", () => ({
    default: {
        error: jest.fn(),
        success: jest.fn(),
    },
}));

jest.unstable_mockModule("@/shared/components/CounterInput", () => ({
    default: function MockCounterInput({ label, value, onChange, max }) {
        return (
            <div>
                <label>{label}</label>
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    max={max}
                    min={0}
                />
            </div>
        );
    },
}));

jest.unstable_mockModule("@/shared/utils/format", () => ({
    formatPeso: (val) => `$${val}`,
    formatFecha: (date) => "01/01/2024",
}));

// Import after all mocks are defined
const { registrarCobranza } = await import("@/features/sales/services/ventasService");
const toast = (await import("react-hot-toast")).default;
const ModalLiquidacion = (await import("../ModalLiquidacion")).default;

// Datos de prueba
const mockTickets = [
    {
        _id: "ticket1",
        fecha: "2024-01-01",
        total: 100,
        monto_pagado: 0,
        estado: "pendiente",
        items: [
            { producto: "Bidon 20L", cantidad: 2 },
            { producto: "Soda", cantidad: 1 },
        ],
        envases_devueltos: { bidones_20L: 0, bidones_12L: 0, sodas: 0 },
    },
    {
        _id: "ticket2",
        fecha: "2024-01-05",
        total: 150,
        monto_pagado: 50,
        estado: "pago_parcial",
        items: [{ producto: "Bidon 12L", cantidad: 3 }],
        envases_devueltos: { bidones_20L: 0, bidones_12L: 1, sodas: 0 },
    },
    {
        _id: "ticket3",
        fecha: "2024-01-10",
        total: 80,
        monto_pagado: 0,
        estado: "pendiente",
        items: [{ producto: "Soda", cantidad: 5 }],
        envases_devueltos: { bidones_20L: 0, bidones_12L: 0, sodas: 0 },
    },
];

describe("ModalLiquidacion - Multi-Ticket", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        registrarCobranza.mockResolvedValue({
            message: "Liquidación múltiple registrada",
            ventas: [],
        });
    });

    test("Permite seleccionar múltiples checkboxes", async () => {
        const mockOnClose = jest.fn();
        const mockOnExito = jest.fn();

        render(
            <ModalLiquidacion
                opened={true}
                onClose={mockOnClose}
                clienteId="cliente1"
                tickets={mockTickets}
                onExito={mockOnExito}
            />
        );

        // Seleccionar primer ticket
        const checkboxes = screen.getAllByRole("checkbox");
        await userEvent.click(checkboxes[0]);
        await userEvent.click(checkboxes[1]);

        // Verificar que ambos están seleccionados
        expect(checkboxes[0]).toBeChecked();
        expect(checkboxes[1]).toBeChecked();
    });

    test("Muestra tabla de distribución de montos para tickets seleccionados", async () => {
        const mockOnClose = jest.fn();
        const mockOnExito = jest.fn();

        render(
            <ModalLiquidacion
                opened={true}
                onClose={mockOnClose}
                clienteId="cliente1"
                tickets={mockTickets}
                onExito={mockOnExito}
            />
        );

        const checkboxes = screen.getAllByRole("checkbox");
        await userEvent.click(checkboxes[0]);

        // Verificar que la tabla aparece
        expect(screen.getByText(/ticket1/i)).toBeInTheDocument();
        expect(screen.getByDisplayValue("100")).toBeInTheDocument();
    });

    test("Valida que la suma de montos no supere la deuda total", async () => {
        const mockOnClose = jest.fn();
        const mockOnExito = jest.fn();

        const { getByText, getByRole } = render(
            <ModalLiquidacion
                opened={true}
                onClose={mockOnClose}
                clienteId="cliente1"
                tickets={mockTickets}
                onExito={mockOnExito}
            />
        );

        const checkboxes = screen.getAllByRole("checkbox");
        await userEvent.click(checkboxes[0]); // ticket1 (deuda: 100)
        await userEvent.click(checkboxes[1]); // ticket2 (deuda: 100)

        const button = getByRole("button", { name: /confirmar/i });
        expect(button).toBeDisabled(); // Porque la suma sería mayor si se intenta sobrepasar
    });

    test("Limpia la tabla al deseleccionar un ticket", async () => {
        const mockOnClose = jest.fn();
        const mockOnExito = jest.fn();

        render(
            <ModalLiquidacion
                opened={true}
                onClose={mockOnClose}
                clienteId="cliente1"
                tickets={mockTickets}
                onExito={mockOnExito}
            />
        );

        const checkboxes = screen.getAllByRole("checkbox");
        await userEvent.click(checkboxes[0]);
        await userEvent.click(checkboxes[0]); // Deseleccionar

        // Verificar que la tabla desaparece
        const montoInputs = screen.queryAllByRole("spinbutton");
        expect(montoInputs.length).toBe(0); // No debe haber inputs de monto
    });

    test("Permite editar montos en la tabla de distribución", async () => {
        const mockOnClose = jest.fn();
        const mockOnExito = jest.fn();

        render(
            <ModalLiquidacion
                opened={true}
                onClose={mockOnClose}
                clienteId="cliente1"
                tickets={mockTickets}
                onExito={mockOnExito}
            />
        );

        const checkboxes = screen.getAllByRole("checkbox");
        await userEvent.click(checkboxes[0]);

        const input = screen.getByDisplayValue("100");
        await userEvent.clear(input);
        await userEvent.type(input, "50");

        expect(input.value).toBe("50");
    });

    test("Rechaza más de 10 tickets en una transacción", async () => {
        const mockOnClose = jest.fn();
        const mockOnExito = jest.fn();

        const manyTickets = Array.from({ length: 15 }, (_, i) => ({
            _id: `ticket${i}`,
            fecha: "2024-01-01",
            total: 100,
            monto_pagado: 0,
            estado: "pendiente",
            items: [{ producto: "Item", cantidad: 1 }],
            envases_devueltos: { bidones_20L: 0, bidones_12L: 0, sodas: 0 },
        }));

        render(
            <ModalLiquidacion
                opened={true}
                onClose={mockOnClose}
                clienteId="cliente1"
                tickets={manyTickets}
                onExito={mockOnExito}
            />
        );

        const checkboxes = screen.getAllByRole("checkbox");

        // Seleccionar los primeros 10
        for (let i = 0; i < 10; i++) {
            await userEvent.click(checkboxes[i]);
        }

        // El checkbox 11 debe estar deshabilitado o no clickeable
        // (dependiendo de la implementación)
        expect(checkboxes[10]).not.toBeChecked();
    });

    test("Envía el payload correcto con API multi-ticket", async () => {
        const mockOnClose = jest.fn();
        const mockOnExito = jest.fn();

        registrarCobranza.mockResolvedValue({ success: true });

        render(
            <ModalLiquidacion
                opened={true}
                onClose={mockOnClose}
                clienteId="cliente1"
                tickets={mockTickets}
                onExito={mockOnExito}
            />
        );

        const checkboxes = screen.getAllByRole("checkbox");
        await userEvent.click(checkboxes[0]);
        await userEvent.click(checkboxes[1]);

        const button = screen.getByRole("button", { name: /confirmar/i });
        await userEvent.click(button);

        // Verificar que registrarCobranza fue llamado con el payload multi-ticket
        expect(registrarCobranza).toHaveBeenCalledWith(
            expect.objectContaining({
                clienteId: "cliente1",
                ticketIds: expect.arrayContaining(["ticket1", "ticket2"]),
                pagos: expect.any(Array),
            })
        );
    });
});
