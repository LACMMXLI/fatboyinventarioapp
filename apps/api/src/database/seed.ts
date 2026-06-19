import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from monorepo root
config({ path: resolve(__dirname, '../../../../.env') });

async function seed() {
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

  // Check if admin already exists
  const userRepo = dataSource.getRepository('users');
  const existingAdmin = await userRepo.findOne({
    where: { email: 'admin@fatboy.com' },
  });

  if (existingAdmin) {
    console.log('⚠️  El usuario admin ya existe. Saltando seed.');
    await dataSource.destroy();
    return;
  }

  // Create admin user
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('admin123', salt);

  await userRepo.save({
    email: 'admin@fatboy.com',
    passwordHash,
    fullName: 'Administrador Fatboy',
    role: 'ADMIN',
    branchId: null,
    isActive: true,
  });

  console.log('✅ Usuario admin creado:');
  console.log('   Email: admin@fatboy.com');
  console.log('   Password: admin123');
  console.log('   ⚠️  ¡Cambia esta contraseña en producción!');

  await dataSource.destroy();
  console.log('🏁 Seed completado');
}

seed().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
