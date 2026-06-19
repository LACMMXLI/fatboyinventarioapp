import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../../../.env') });

async function seedBranches() {
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
  console.log('📦 Conexión a base de datos establecida');

  const branchRepo = dataSource.getRepository('branches');

  await branchRepo.save([
    { name: 'Venecia', isActive: true },
    { name: 'San Marcos', isActive: true },
  ]);

  console.log('✅ Sucursales Venecia y San Marcos agregadas con éxito');
  await dataSource.destroy();
}

seedBranches().catch(console.error);
