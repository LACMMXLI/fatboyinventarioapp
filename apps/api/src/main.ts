import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { AppModule } from './app.module';
import { User } from './modules/users/entities/user.entity';
import { Branch } from './modules/branches/entities/branch.entity';
import { ProductCategory } from './modules/categories/entities/product-category.entity';
import { Product } from './modules/products/entities/product.entity';

function resolveProductsFilePath() {
  const candidatePaths = [
    resolve(process.cwd(), 'productos.md'),
    resolve(process.cwd(), '../../productos.md'),
    resolve(__dirname, '../../../productos.md'),
    resolve(__dirname, '../productos.md'),
  ];

  return candidatePaths.find((filePath) => existsSync(filePath));
}

async function ensureInitialCatalog(dataSource: DataSource) {
  const branchRepository = dataSource.getRepository(Branch);
  const categoryRepository = dataSource.getRepository(ProductCategory);
  const productRepository = dataSource.getRepository(Product);

  for (const branchName of ['Venecia', 'San Marcos']) {
    const existingBranch = await branchRepository.findOne({
      where: { name: branchName },
    });

    if (!existingBranch) {
      await branchRepository.save({ name: branchName, isActive: true });
    }
  }

  const productsFilePath = resolveProductsFilePath();
  if (!productsFilePath) {
    console.warn('No se encontró productos.md para cargar el catálogo inicial.');
    return;
  }

  const lines = readFileSync(productsFilePath, 'utf-8').split('\n');
  let currentCategory: ProductCategory | null = null;
  let categorySortOrder = 10;
  let productSortOrder = 10;
  let addedCategories = 0;
  let addedProducts = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (line.startsWith('-')) {
      if (!currentCategory) {
        continue;
      }

      const productName = line.substring(1).trim();
      const existingProduct = await productRepository.findOne({
        where: {
          name: productName,
          categoryId: currentCategory.id,
        },
      });

      if (!existingProduct) {
        await productRepository.save({
          name: productName,
          categoryId: currentCategory.id,
          unit: 'PZA',
          sortOrder: productSortOrder,
          isActive: true,
        });
        addedProducts += 1;
      }

      productSortOrder += 10;
      continue;
    }

    const categoryName = line;
    let category = await categoryRepository.findOne({
      where: { name: categoryName },
    });

    if (!category) {
      category = await categoryRepository.save({
        name: categoryName,
        sortOrder: categorySortOrder,
        isActive: true,
      });
      addedCategories += 1;
    }

    currentCategory = category;
    categorySortOrder += 10;
    productSortOrder = 10;
  }

  console.log(
    `Catálogo inicial verificado desde ${productsFilePath}: ${addedCategories} categorías nuevas, ${addedProducts} productos nuevos.`,
  );
}

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
  await ensureInitialCatalog(dataSource);

  // Start
  const port = configService.get<number>('API_PORT', 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 InventarioApp API running on http://localhost:${port}/${prefix}`);
  console.log(`📚 Swagger docs at http://localhost:${port}/docs`);
}
bootstrap();
