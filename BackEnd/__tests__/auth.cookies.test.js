import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import User from '../src/models/Usuario.js';
import Empresa from '../src/models/Empresa.js';

let mongoServer;
let agent; // Usaremos un supertest agent para persistir las cookies

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  agent = request.agent(app); // Crear el agent
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Empresa.deleteMany({});
});

describe('Cookie-Based Authentication Flow', () => {

  // Prepara un usuario de prueba antes de cada test en este bloque
  beforeEach(async () => {
    const business = new Empresa({ nombre: 'Test Business' });
    await business.save();
    const user = new User({
      nombre: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      rol: 'admin',
      activo: true,
      businessId: business._id,
    });
    await user.save();
  });

  it('1. POST /login should set a httpOnly cookie on successful login', async () => {
    const response = await agent
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('usuario');
    expect(response.body.usuario.email).toBe('test@example.com');
    expect(response.body.token).toBeUndefined(); // El token no debe estar en el body

    // Verificar la cookie
    const cookies = response.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toMatch(/token=.+/);
    expect(cookies[0]).toMatch(/HttpOnly/);
    expect(cookies[0]).toMatch(/Path=\//);
    expect(cookies[0]).toMatch(/SameSite=Strict/);
  });

  it('2. GET /me (protected) should succeed when cookie is sent automatically by the agent', async () => {
    // Primero, hacemos login para que el agent guarde la cookie
    await agent
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    // Ahora, hacemos una petición a la ruta protegida.
    // El 'agent' adjuntará la cookie automáticamente.
    const response = await agent.get('/api/auth/me');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('usuario');
    expect(response.body.usuario.email).toBe('test@example.com');
  });

  it('3. GET /me (protected) should fail with 401 if no cookie is present', async () => {
    // Usamos 'request(app)' directamente en lugar de 'agent' para no enviar cookies
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('No autorizado. Token requerido.');
  });

  it('4. POST /logout should clear the session cookie', async () => {
    // 1. Iniciar sesión para obtener la cookie
    await agent
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    // 2. Cerrar sesión
    const logoutResponse = await agent.post('/api/auth/logout');

    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.body.message).toBe('Sesión cerrada correctamente.');

    // Verificar que la cookie de 'token' ha sido eliminada
    const cookies = logoutResponse.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toMatch(/token=;/); // La cookie se limpia poniéndola en blanco
    expect(cookies[0]).toMatch(/Expires=Thu, 01 Jan 1970/); // Y con una fecha de expiración en el pasado

    // 3. Verificar que ya no se puede acceder a rutas protegidas
    const finalResponse = await agent.get('/api/auth/me');
    expect(finalResponse.status).toBe(401);
  });
});
