import request from 'supertest';
import app from '../server';
import prisma from '../config/database';

describe('Properties API', () => {
  let authToken: string;
  let testPropertyId: string;

  beforeAll(async () => {
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@lodgexcrm.com',
        password: 'admin123',
      });

    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    // Clean up test data
    if (testPropertyId) {
      await prisma.property.deleteMany({
        where: { id: testPropertyId },
      });
    }
    await prisma.$disconnect();
  });

  describe('GET /api/properties', () => {
    it('should return list of properties', async () => {
      const response = await request(app)
        .get('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('properties');
      expect(Array.isArray(response.body.data.properties)).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/properties')
        .expect(401);
    });
  });

  describe('POST /api/properties', () => {
    it('should create a new property', async () => {
      const propertyData = {
        name: 'Test Property',
        code: 'TEST-001',
        address: '123 Test Street',
        city: 'Test City',
        country: 'UAE',
        propertyType: 'apartment',
        status: 'active',
      };

      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send(propertyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.property.name).toBe(propertyData.name);
      testPropertyId = response.body.data.property.id;
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Incomplete Property' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/properties/:id', () => {
    it('should return property details', async () => {
      if (!testPropertyId) {
        // Create a property first if testPropertyId is not set
        const createResponse = await request(app)
          .post('/api/properties')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Test Property for Get',
            code: 'TEST-GET',
            address: '123 Test Street',
            city: 'Test City',
            country: 'UAE',
            propertyType: 'apartment',
            status: 'active',
          });
        testPropertyId = createResponse.body.data.property.id;
      }

      const response = await request(app)
        .get(`/api/properties/${testPropertyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.property.id).toBe(testPropertyId);
    });

    it('should return 404 for non-existent property', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app)
        .get(`/api/properties/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});

