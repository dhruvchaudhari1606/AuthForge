import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeUserRoles1773800000001 implements MigrationInterface {
  name = 'NormalizeUserRoles1773800000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Backfill any users.role_id into user_roles join table
    await queryRunner.query(`
      INSERT INTO "user_roles" ("user_id", "role_id")
      SELECT "id", "role_id" FROM "users"
      WHERE "role_id" IS NOT NULL
      ON CONFLICT ("user_id", "role_id") DO NOTHING;
    `);

    // 2. Drop the foreign key constraint on users.role_id
    await queryRunner.query(
      'ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_role_id"',
    );

    // 3. Drop the redundant role_id column from users table
    await queryRunner.query(
      'ALTER TABLE "users" DROP COLUMN IF EXISTS "role_id"',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Re-add role_id column
    await queryRunner.query('ALTER TABLE "users" ADD COLUMN "role_id" uuid');

    // 2. Re-create foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "FK_users_role_id"
      FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL
    `);

    // 3. Populate role_id from user_roles join table
    await queryRunner.query(`
      UPDATE "users" u
      SET "role_id" = (
        SELECT ur."role_id"
        FROM "user_roles" ur
        WHERE ur."user_id" = u."id"
        LIMIT 1
      )
      WHERE u."role_id" IS NULL;
    `);
  }
}
