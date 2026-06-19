import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductStores1750350000000 implements MigrationInterface {
  name = 'AddProductStores1750350000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_stores" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "address" character varying(500),
        "phone" character varying(50),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_product_stores_name" UNIQUE ("name"),
        CONSTRAINT "PK_product_stores_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "store_id" uuid
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_products_store_id'
        ) THEN
          ALTER TABLE "products"
          ADD CONSTRAINT "FK_products_store_id"
          FOREIGN KEY ("store_id") REFERENCES "product_stores"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      DROP CONSTRAINT IF EXISTS "FK_products_store_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "products"
      DROP COLUMN IF EXISTS "store_id"
    `);

    await queryRunner.query('DROP TABLE IF EXISTS "product_stores"');
  }
}
