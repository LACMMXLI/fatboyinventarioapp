import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Load .env from monorepo root
config({ path: resolve(__dirname, '../../../../.env') });

async function seedProducts() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'inventarioapp',
    synchronize: true,
    entities: [resolve(__dirname, '../modules/**/entities/*.entity{.ts,.js}')],
  });

  await dataSource.initialize();
  console.log('📦 Conexión a base de datos establecida para seed de productos');

  const categoryRepo = dataSource.getRepository('product_categories');
  const productRepo = dataSource.getRepository('products');

  const fileContent = readFileSync(resolve(__dirname, '../../../../productos.md'), 'utf-8');
  const lines = fileContent.split('\n');

  let currentCategory = null;
  let categorySortOrder = 10;
  let productSortOrder = 10;

  let addedCategories = 0;
  let addedProducts = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('-')) {
      // It's a product
      if (!currentCategory) {
        console.warn(`⚠️  Producto sin categoría encontrado: ${line}`);
        continue;
      }
      
      const productName = line.substring(1).trim();
      
      // Check if product exists in this category
      let product = await productRepo.findOne({
        where: { name: productName, categoryId: currentCategory.id }
      });

      if (!product) {
        product = await productRepo.save({
          name: productName,
          categoryId: currentCategory.id,
          unit: 'PZA',
          sortOrder: productSortOrder,
          isActive: true
        });
        addedProducts++;
      }
      productSortOrder += 10;
    } else {
      // It's a category
      const categoryName = line;
      
      let category = await categoryRepo.findOne({
        where: { name: categoryName }
      });

      if (!category) {
        category = await categoryRepo.save({
          name: categoryName,
          sortOrder: categorySortOrder,
          isActive: true
        });
        addedCategories++;
      }

      currentCategory = category;
      categorySortOrder += 10;
      productSortOrder = 10; // Reset product sort order for new category
    }
  }

  console.log(`✅ Seed completado: Se agregaron ${addedCategories} categorías y ${addedProducts} productos.`);
  await dataSource.destroy();
}

seedProducts().catch((err) => {
  console.error('❌ Error en seed de productos:', err);
  process.exit(1);
});
