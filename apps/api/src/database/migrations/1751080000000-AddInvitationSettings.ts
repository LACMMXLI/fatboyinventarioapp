import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInvitationSettings1751080000000 implements MigrationInterface {
  name = 'AddInvitationSettings1751080000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invitation_settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "admin_invitation_code" character varying(100) NOT NULL DEFAULT '',
        "encargado_invitation_code" character varying(100) NOT NULL DEFAULT '',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_invitation_settings_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "invitation_settings"');
  }
}
