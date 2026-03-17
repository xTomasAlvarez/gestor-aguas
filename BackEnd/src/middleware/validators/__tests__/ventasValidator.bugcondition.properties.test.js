import { validationResult } from 'express-validator';
import { validarRegistrarCobranza } from '../ventasValidator.js';

/**
 * Bug Condition Exploration Test
 * 
 * **Validates: Requirements 1.1, 1.2, 2.1, 2.2**
 * 
 * This test encodes the expected behavior for rejecting future dates.
 * It MUST FAIL on unfixed code to confirm the bug exists.
 * 
 * The bug: validarRegistrarCobranza accepts requests with future dates
 * The fix: validarRegistrarCobranza should reject requests with future dates with status 400
 */

describe('validarRegistrarCobranza - Bug Condition: Reject Future Dates', () => {
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
   * Helper function to get end of today in UTC
   * Returns the last moment of today (23:59:59.999 UTC)
   */
  const getEndOfTodayUTC = () => {
    const now = new Date();
    const endOfDay = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23, 59, 59, 999
    ));
    return endOfDay;
  };

  /**
   * Helper function to create a date string for a given number of days from today
   * @param {number} daysFromToday - positive for future, negative for past
   * @returns {string} ISO date string
   */
  const getDateString = (daysFromToday) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + daysFromToday);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  it('should reject request with future date (tomorrow) with status 400 and specific error message', async () => {
    const tomorrowDate = getDateString(1);
    
    req.body = {
      clienteId: '507f1f77bcf86cd799439011',
      ticketId: '507f1f77bcf86cd799439012',
      montoAbonado: 1000,
      metodoPago: 'efectivo',
      fecha: tomorrowDate
    };

    // Execute all validators in the chain
    for (const validator of validarRegistrarCobranza) {
      await validator(req, res, next);
    }

    // Check if middleware rejected the request
    expect(res.statusCode).toBe(400);
    expect(res.jsonData).toBeDefined();
    expect(res.jsonData.error).toBe('Error: No podés registrar un pago con una fecha futura. Revisá el calendario.');
  });

  it('should reject request with future date (next week) with status 400 and specific error message', async () => {
    const nextWeekDate = getDateString(7);
    
    req.body = {
      clienteId: '507f1f77bcf86cd799439011',
      ticketId: '507f1f77bcf86cd799439012',
      montoAbonado: 1000,
      metodoPago: 'efectivo',
      fecha: nextWeekDate
    };

    // Execute all validators in the chain
    for (const validator of validarRegistrarCobranza) {
      await validator(req, res, next);
    }

    // Check if middleware rejected the request
    expect(res.statusCode).toBe(400);
    expect(res.jsonData).toBeDefined();
    expect(res.jsonData.error).toBe('Error: No podés registrar un pago con una fecha futura. Revisá el calendario.');
  });

  it('should reject request with future date (next month) with status 400 and specific error message', async () => {
    const nextMonthDate = getDateString(30);
    
    req.body = {
      clienteId: '507f1f77bcf86cd799439011',
      ticketId: '507f1f77bcf86cd799439012',
      montoAbonado: 1000,
      metodoPago: 'efectivo',
      fecha: nextMonthDate
    };

    // Execute all validators in the chain
    for (const validator of validarRegistrarCobranza) {
      await validator(req, res, next);
    }

    // Check if middleware rejected the request
    expect(res.statusCode).toBe(400);
    expect(res.jsonData).toBeDefined();
    expect(res.jsonData.error).toBe('Error: No podés registrar un pago con una fecha futura. Revisá el calendario.');
  });

  it('should reject request with future date (edge case: tomorrow at 00:00:00 UTC) with status 400', async () => {
    const tomorrowDate = getDateString(1);
    
    req.body = {
      clienteId: '507f1f77bcf86cd799439011',
      ticketId: '507f1f77bcf86cd799439012',
      montoAbonado: 1000,
      metodoPago: 'efectivo',
      fecha: tomorrowDate
    };

    // Execute all validators in the chain
    for (const validator of validarRegistrarCobranza) {
      await validator(req, res, next);
    }

    // Check if middleware rejected the request
    expect(res.statusCode).toBe(400);
    expect(res.jsonData).toBeDefined();
    expect(res.jsonData.error).toBe('Error: No podés registrar un pago con una fecha futura. Revisá el calendario.');
  });
});
