import { validationResult } from 'express-validator';
import { validarRegistrarCobranza } from '../ventasValidator.js';

/**
 * Preservation Property Tests
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 * 
 * These tests capture the baseline behavior that must be preserved after the fix.
 * They verify that the middleware continues to accept:
 * - Past dates
 * - Current date
 * - Requests without fecha field (using default date)
 * - Requests with valid other fields
 * 
 * EXPECTED OUTCOME: Tests PASS on unfixed code (confirms baseline behavior to preserve)
 */

describe('validarRegistrarCobranza - Preservation: Accept Past and Current Dates', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {}
    };
    res = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.jsonData = data;
        return this;
      }
    };
    next = () => {};
  });

  /**
   * Helper function to create a date string for a given number of days from today
   * @param {number} daysFromToday - positive for future, negative for past
   * @returns {string} ISO date string in YYYY-MM-DD format
   */
  const getDateString = (daysFromToday) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + daysFromToday);
    return date.toISOString().split('T')[0];
  };

  /**
   * Helper to execute all validators in the chain
   */
  const executeValidators = async () => {
    for (const validator of validarRegistrarCobranza) {
      await validator(req, res, next);
    }
  };

  describe('Past Date Preservation (Requirement 3.1)', () => {
    it('should accept request with past date (yesterday)', async () => {
      const yesterdayDate = getDateString(-1);
      
      req.body = {
        clienteId: '507f1f77bcf86cd799439011',
        ticketId: '507f1f77bcf86cd799439012',
        montoAbonado: 1000,
        metodoPago: 'efectivo',
        fecha: yesterdayDate
      };

      await executeValidators();

      // Should not have rejected with 400 status
      expect(res.statusCode).not.toBe(400);
    });

    it('should accept request with past date (one week ago)', async () => {
      const oneWeekAgoDate = getDateString(-7);
      
      req.body = {
        clienteId: '507f1f77bcf86cd799439011',
        ticketId: '507f1f77bcf86cd799439012',
        montoAbonado: 1000,
        metodoPago: 'efectivo',
        fecha: oneWeekAgoDate
      };

      await executeValidators();

      expect(res.statusCode).not.toBe(400);
    });

    it('should accept request with past date (one month ago)', async () => {
      const oneMonthAgoDate = getDateString(-30);
      
      req.body = {
        clienteId: '507f1f77bcf86cd799439011',
        ticketId: '507f1f77bcf86cd799439012',
        montoAbonado: 1000,
        metodoPago: 'efectivo',
        fecha: oneMonthAgoDate
      };

      await executeValidators();

      expect(res.statusCode).not.toBe(400);
    });

    it('should accept request with past date (several months ago)', async () => {
      const severalMonthsAgoDate = getDateString(-90);
      
      req.body = {
        clienteId: '507f1f77bcf86cd799439011',
        ticketId: '507f1f77bcf86cd799439012',
        montoAbonado: 1000,
        metodoPago: 'efectivo',
        fecha: severalMonthsAgoDate
      };

      await executeValidators();

      expect(res.statusCode).not.toBe(400);
    });
  });

  describe('Current Date Preservation (Requirement 3.2)', () => {
    it('should accept request with current date (today)', async () => {
      const todayDate = getDateString(0);
      
      req.body = {
        clienteId: '507f1f77bcf86cd799439011',
        ticketId: '507f1f77bcf86cd799439012',
        montoAbonado: 1000,
        metodoPago: 'efectivo',
        fecha: todayDate
      };

      await executeValidators();

      expect(res.statusCode).not.toBe(400);
    });
  });

  describe('Missing Date Field Preservation (Requirement 3.3)', () => {
    it('should accept request without fecha field (uses default date)', async () => {
      req.body = {
        clienteId: '507f1f77bcf86cd799439011',
        ticketId: '507f1f77bcf86cd799439012',
        montoAbonado: 1000,
        metodoPago: 'efectivo'
        // No fecha field
      };

      await executeValidators();

      expect(res.statusCode).not.toBe(400);
    });
  });

  describe('Other Fields Validation Preservation (Requirement 3.4)', () => {
    it('should continue validating clienteId as MongoId', async () => {
      const yesterdayDate = getDateString(-1);
      
      req.body = {
        clienteId: 'invalid-id', // Invalid MongoId
        ticketId: '507f1f77bcf86cd799439012',
        montoAbonado: 1000,
        metodoPago: 'efectivo',
        fecha: yesterdayDate
      };

      await executeValidators();

      // Should reject due to invalid clienteId
      expect(res.statusCode).toBe(400);
      expect(res.jsonData).toBeDefined();
      expect(res.jsonData.message).toBe('Datos de entrada inválidos.');
    });

    it('should continue validating ticketId as MongoId', async () => {
      const yesterdayDate = getDateString(-1);
      
      req.body = {
        clienteId: '507f1f77bcf86cd799439011',
        ticketId: 'invalid-id', // Invalid MongoId
        montoAbonado: 1000,
        metodoPago: 'efectivo',
        fecha: yesterdayDate
      };

      await executeValidators();

      // Should reject due to invalid ticketId
      expect(res.statusCode).toBe(400);
      expect(res.jsonData).toBeDefined();
      expect(res.jsonData.message).toBe('Datos de entrada inválidos.');
    });

    it('should continue validating montoAbonado as float >= 0', async () => {
      const yesterdayDate = getDateString(-1);
      
      req.body = {
        clienteId: '507f1f77bcf86cd799439011',
        ticketId: '507f1f77bcf86cd799439012',
        montoAbonado: -100, // Invalid: negative amount
        metodoPago: 'efectivo',
        fecha: yesterdayDate
      };

      await executeValidators();

      // Should reject due to invalid montoAbonado
      expect(res.statusCode).toBe(400);
      expect(res.jsonData).toBeDefined();
      expect(res.jsonData.message).toBe('Datos de entrada inválidos.');
    });

    it('should continue validating metodoPago as valid payment method', async () => {
      const yesterdayDate = getDateString(-1);
      
      req.body = {
        clienteId: '507f1f77bcf86cd799439011',
        ticketId: '507f1f77bcf86cd799439012',
        montoAbonado: 1000,
        metodoPago: 'invalid-method', // Invalid payment method
        fecha: yesterdayDate
      };

      await executeValidators();

      // Should reject due to invalid metodoPago
      expect(res.statusCode).toBe(400);
      expect(res.jsonData).toBeDefined();
      expect(res.jsonData.message).toBe('Datos de entrada inválidos.');
    });

    it('should accept request with valid envasesDevueltos object', async () => {
      const yesterdayDate = getDateString(-1);
      
      req.body = {
        clienteId: '507f1f77bcf86cd799439011',
        ticketId: '507f1f77bcf86cd799439012',
        montoAbonado: 1000,
        metodoPago: 'efectivo',
        fecha: yesterdayDate,
        envasesDevueltos: {
          bidones_20L: 2,
          bidones_12L: 1,
          sodas: 3
        }
      };

      await executeValidators();

      expect(res.statusCode).not.toBe(400);
    });

    it('should continue validating envasesDevueltos fields as integers >= 0', async () => {
      const yesterdayDate = getDateString(-1);
      
      req.body = {
        clienteId: '507f1f77bcf86cd799439011',
        ticketId: '507f1f77bcf86cd799439012',
        montoAbonado: 1000,
        metodoPago: 'efectivo',
        fecha: yesterdayDate,
        envasesDevueltos: {
          bidones_20L: -1 // Invalid: negative count
        }
      };

      await executeValidators();

      // Should reject due to invalid envasesDevueltos
      expect(res.statusCode).toBe(400);
      expect(res.jsonData).toBeDefined();
      expect(res.jsonData.message).toBe('Datos de entrada inválidos.');
    });
  });

  describe('Property-Based: Past Dates Acceptance', () => {
    it('should accept any past date (property-based)', async () => {
      // Test multiple past dates to ensure consistent behavior
      const pastDaysOffsets = [-1, -2, -7, -14, -30, -60, -90, -180, -365];
      
      for (const daysOffset of pastDaysOffsets) {
        // Reset for each iteration
        res.statusCode = undefined;
        res.jsonData = undefined;

        const pastDate = getDateString(daysOffset);
        
        req.body = {
          clienteId: '507f1f77bcf86cd799439011',
          ticketId: '507f1f77bcf86cd799439012',
          montoAbonado: 1000,
          metodoPago: 'efectivo',
          fecha: pastDate
        };

        await executeValidators();

        expect(res.statusCode).not.toBe(400);
      }
    });
  });

  describe('Property-Based: Current Date Acceptance', () => {
    it('should accept current date consistently (property-based)', async () => {
      // Test current date multiple times to ensure consistent behavior
      for (let i = 0; i < 3; i++) {
        res.statusCode = undefined;
        res.jsonData = undefined;

        const todayDate = getDateString(0);
        
        req.body = {
          clienteId: '507f1f77bcf86cd799439011',
          ticketId: '507f1f77bcf86cd799439012',
          montoAbonado: 1000,
          metodoPago: 'efectivo',
          fecha: todayDate
        };

        await executeValidators();

        expect(res.statusCode).not.toBe(400);
      }
    });
  });

  describe('Property-Based: Valid Amounts Acceptance', () => {
    it('should accept various valid amounts (property-based)', async () => {
      const validAmounts = [0, 1, 100, 1000, 10000, 99999.99];
      const yesterdayDate = getDateString(-1);
      
      for (const amount of validAmounts) {
        res.statusCode = undefined;
        res.jsonData = undefined;

        req.body = {
          clienteId: '507f1f77bcf86cd799439011',
          ticketId: '507f1f77bcf86cd799439012',
          montoAbonado: amount,
          metodoPago: 'efectivo',
          fecha: yesterdayDate
        };

        await executeValidators();

        expect(res.statusCode).not.toBe(400);
      }
    });
  });

  describe('Property-Based: Valid Payment Methods Acceptance', () => {
    it('should accept all valid payment methods (property-based)', async () => {
      const validMethods = ['efectivo', 'transferencia'];
      const yesterdayDate = getDateString(-1);
      
      for (const method of validMethods) {
        res.statusCode = undefined;
        res.jsonData = undefined;

        req.body = {
          clienteId: '507f1f77bcf86cd799439011',
          ticketId: '507f1f77bcf86cd799439012',
          montoAbonado: 1000,
          metodoPago: method,
          fecha: yesterdayDate
        };

        await executeValidators();

        expect(res.statusCode).not.toBe(400);
      }
    });
  });
});
