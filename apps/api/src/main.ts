import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from './app.module';
import { User } from './modules/users/entities/user.entity';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global prefix
  const prefix = configService.get<string>('API_PREFIX', 'api');
  app.setGlobalPrefix(prefix);

  const corsOrigin = configService.get<string>('CORS_ORIGIN', '*').trim();
  const allowedOrigins =
    corsOrigin === '*'
      ? true
      : corsOrigin
          .split(',')
          .map((origin) => origin.trim())
          .map((origin) => origin.replace(/\/$/, ''))
          .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('InventarioApp Fatboy')
    .setDescription('API para el sistema de conteo de inventario diario')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const dataSource = app.get(DataSource);
  const userRepository = dataSource.getRepository(User);
  const adminEmail = 'admin@fatboy.com';
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const existingAdmin = await userRepository.findOne({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    existingAdmin.passwordHash = adminPasswordHash;
    existingAdmin.role = 'ADMIN' as User['role'];
    existingAdmin.isActive = true;
    existingAdmin.fullName = existingAdmin.fullName || 'Administrador Fatboy';
    await userRepository.save(existingAdmin);
  } else {
    await userRepository.save({
      email: adminEmail,
      passwordHash: adminPasswordHash,
      fullName: 'Administrador Fatboy',
      role: 'ADMIN' as User['role'],
      branchId: null,
      isActive: true,
    });
  }

  // Start
  const port = configService.get<number>('API_PORT', 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 InventarioApp API running on http://localhost:${port}/${prefix}`);
  console.log(`📚 Swagger docs at http://localhost:${port}/docs`);
}
bootstrap();
