import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('User Identity API')
    .setDescription(
      'Resolves an id1 and id2 combination to a persistent UUID v4 userID.',
    )
    .setVersion('1.0')
    .build();

  const openAPIDocument = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, openAPIDocument, {
    jsonDocumentUrl: 'docs/openapi.json',
  });


  await app.listen(process.env.PORT ?? 3000);
}

await bootstrap();