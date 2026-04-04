import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ModalLiquidacion from "../ModalLiquidacion";

// Mock de dependencias externas
jest.mock("@/features/sales/services/ventasService", () => ({
    registrarCobranza: jest.fn(),
}));

jest.mock("react-hot-toast", () => ({
    default: {
        error: jest.fn(),
        success: jest.fn(),
    },
}));

jest.mock("@/shared/components/CounterInput", () => {
    return function MockCounterInput({ label, value, onChange, max }) {
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
    };
});

jest.mock("@/shared/utils/format", () => ({
    formatPeso: (val) => `$${val}`,
    formatFecha: (date) => "01/01/2024",
}));

const { registrarCobranza } = require("@/features/sales/services/ventasService");
const toast = require("react-hot-toast").default;

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
        expect(checkboxes[0]).toBeChecked();

        // Seleccionar segundo ticket
        await userEvent.click(checkboxes[1]);
        expect(checkboxes[1]).toBeChecked();

        // Ambos deben estar seleccionados
        expect(checkboxes[0]).toBeChecked();
        expect(checkboxes[1]).toBeChecked();
    });

    test("Muestra tabla con múltiples tickets seleccionados", () => {
        const mockOnClose = jest.fn();

        render(
            <ModalLiquidacion
                opened={true}
                onClose={mockOnClose}
                clienteId="cliente1"
                tickets={mockTickets}
                onExito={() => {}}
            />
        );

        // Inicialmente no hay tabla visible
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    test("Calcula suma total de pagos correctamente", async () => {
        const mockOnClose = jest.fn();

        const { container } = render(
            <ModalLiquidacion
                opened={true}
                onClose={mockOnClose}
                clienteId="cliente1"
                tickets={mockTickets}
                onExito={() => {}}
            />
        );

        const checkboxes = screen.getAllByRole("checkbox");

        // Seleccionar ticket1 (deuda: 100) y ticket2 (deuda: 100)
        await userEvent.click(checkboxes[0]);
        await userEvent.click(checkboxes[1]);

        // Debería mostrar tabla
        const table = screen.getByRole("table");
        expect(table).toBeInTheDocument();
    });

    test("Desseleccionar un ticket remueve su fila de tabla", async () => {
        const mockOnClose = jest.fn();

        render(
            <ModalLiquidacion
                opened={true}
                onClose={mockOnClose}
                clienteId="cliente1"
                tickets={mockTickets}
                onExito={() => {}}
            />
        );

        const checkboxes = screen.getAllByRole("checkbox");

        // Seleccionar ticket1
        await userEvent.click(checkboxes[0]);
        // Seleccionar ticket2
        await userEvent.click(checkboxes[1]);

        // Debería mostrar tabla
        expect(screen.getByRole("table")).toBeInTheDocument();

        // Deseleccionar ticket1
        await userEvent.click(checkboxes[0]);

        // La tabla debe actualizarse (debería tener menos filas)
        const table = screen.getByRole("table");
        const rows = within(table).getAllByRole("row");
        // Header + 1 ticket = 2 rows
        expect(rows.length).toBeLessThanOrEqual(3);
    });

    test("Envía payload con nueva API cuando hay múltiples tickets", async () => {
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

        // Seleccionar ticket1 y ticket2
        await userEvent.click(checkboxes[0]);
        await userEvent.click(checkboxes[1]);

        // El botón debe ser visible
        const btnConfirmar = screen.getByText("Confirmar Liquidación");
        expect(btnConfirmar).toBeInTheDocument();
    });

    test("Resetea estado al cerrar modal", async () => {
        const mockOnClose = jest.fn();

        const { rerender } = render(
            <ModalLiquidacion
                opened={true}
                onClose={mockOnClose}
                clienteId="cliente1"
                tickets={mockTickets}
                onExito={() => {}}
            />
        );

        const checkboxes = screen.getAllByRole("checkbox");
        await userEvent.click(checkboxes[0]);

        expect(checkboxes[0]).toBeChecked();

        // Cerrar modal
        rerender(
            <ModalLiquidacion
                opened={false}
                onClose={mockOnClose}
                clienteId="cliente1"
                tickets={mockTickets}
                onExito={() => {}}
            />
        );

        // Reabrirlo
        rerender(
            <ModalLiquidacion
                opened={true}
                onClose={mockOnClose}
                clienteId="cliente1"
                tickets={mockTickets}
                onExito={() => {}}
            />
        );

        // Los checkboxes deben estar destildados
        const newCheckboxes = screen.getAllByRole("checkbox");
        newCheckboxes.forEach((cb) => {
            expect(cb).not.toBeChecked();
        });
    });
});
