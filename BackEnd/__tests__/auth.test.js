import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import User from '../src/models/Usuario.js';
import bcrypt from 'bcryptjs';
import Empresa from '../src/models/Empresa.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Empresa.deleteMany({});
});

describe('POST /api/auth/login', () => {
  it('should return 401 for invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Credenciales incorrectas.');
  });

  it('should return 200 and a token for valid credentials', async () => {
    // 1. Create a business for the user
    const business = new Empresa({ nombre: 'Test Business' });
    await business.save();

    // 2. Create a user and hash the password
const user = new User({
      nombre: 'Test User',
      email: 'test@example.com',
      password: 'password123', // Pass plain password, model will hash it
      rol: 'admin',
      activo: true,
      businessId: business._id,
    });
    await user.save();

    // 3. Attempt to log in
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    // 4. Assertions
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.usuario.email).toBe('test@example.com');
  });
});
