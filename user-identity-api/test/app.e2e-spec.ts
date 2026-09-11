import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('rejects a request with a missing id1', async () => {
    await request(app.getHttpServer())
      .post('/user')
      .send({ id2: 'XYZ456' })
      .expect(400);
  });

  it('rejects a request with a missing id2', async () => {
    await request(app.getHttpServer())
      .post('/user')
      .send({ id1: 'ABC123' })
      .expect(400);
  });

  it('rejects a request with both identifiers missing', async () => {
    await request(app.getHttpServer())
      .post('/user')
      .send({})
      .expect(400);
  });

  it('rejects non-string identifiers', async () => {
    await request(app.getHttpServer())
      .post('/user')
      .send({
        id1: 123,
        id2: 'XYZ456',
      })
      .expect(400);
  });

  it('returns the same userID for repeated identity requests', async () => {
    const prisma = app.get(PrismaService);

    const body = {
      id1: `e2e-${randomUUID()}`,
      id2: `e2e-${randomUUID()}`,
    };

    try {
      const firstResponse = await request(app.getHttpServer())
        .post('/user')
        .send(body)
        .expect(201);

      expect(firstResponse.body.userID).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );

      const secondResponse = await request(app.getHttpServer())
        .post('/user')
        .send(body)
        .expect(201);

      expect(secondResponse.body.userID).toBe(firstResponse.body.userID);
    } finally {
      await prisma.user_identities.deleteMany({
        where: {
          id1: body.id1,
          id2: body.id2,
        },
      });
    }
  });

  afterEach(async () => {
    await app.close();
  });
});
