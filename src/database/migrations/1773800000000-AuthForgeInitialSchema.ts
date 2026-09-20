import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuthForgeInitialSchema1773800000000 implements MigrationInterface {
  name = 'AuthForgeInitialSchema1773800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. UUID Extension
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // 2. Enum Types
    await queryRunner.query(
      `CREATE TYPE "user_status_enum" AS ENUM('active', 'locked', 'disabled', 'pending_verification')`,
    );

    // 3. Roles Table
    await queryRunner.query(
      `CREATE TABLE "roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "UQ_roles_name" UNIQUE ("name"),
        CONSTRAINT "PK_roles_id" PRIMARY KEY ("id")
      )`,
    );

    // 4. Permissions Table
    await queryRunner.query(
      `CREATE TABLE "permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "UQ_permissions_name" UNIQUE ("name"),
        CONSTRAINT "PK_permissions_id" PRIMARY KEY ("id")
      )`,
    );

    // 5. Users Table
    await queryRunner.query(
      `CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying,
        "first_name" character varying,
        "last_name" character varying,
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "status" "user_status_enum" NOT NULL DEFAULT 'active',
        "email_verified_at" TIMESTAMP,
        "last_login_at" TIMESTAMP,
        "language" character varying NOT NULL DEFAULT 'en',
        "role_id" uuid,
        "token_version" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_users_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL
      )`,
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_users_email" ON "users" ("email")',
    );

    // 6. User Roles Join Table
    await queryRunner.query(
      `CREATE TABLE "user_roles" (
        "user_id" uuid NOT NULL,
        "role_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_roles" PRIMARY KEY ("user_id", "role_id"),
        CONSTRAINT "FK_user_roles_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_roles_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE
      )`,
    );

    // 7. Role Permissions Join Table
    await queryRunner.query(
      `CREATE TABLE "role_permissions" (
        "role_id" uuid NOT NULL,
        "permission_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_role_permissions" PRIMARY KEY ("role_id", "permission_id"),
        CONSTRAINT "FK_role_permissions_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_role_permissions_permission_id" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE
      )`,
    );

    // 8. User Sessions Table
    await queryRunner.query(
      `CREATE TABLE "user_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "refresh_token_hash" character varying,
        "device_name" character varying,
        "device_type" character varying,
        "browser" character varying,
        "os" character varying,
        "user_agent" text,
        "ip_address" character varying(100),
        "last_active_at" TIMESTAMP,
        "expires_at" TIMESTAMP NOT NULL,
        "revoked_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_user_sessions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_sessions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_user_sessions_user_id" ON "user_sessions" ("user_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_user_sessions_expires_at" ON "user_sessions" ("expires_at")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_user_sessions_revoked_at" ON "user_sessions" ("revoked_at")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_user_sessions_user_id_revoked_at" ON "user_sessions" ("user_id", "revoked_at")',
    );

    // 9. Password Resets Table
    await queryRunner.query(
      `CREATE TABLE "password_resets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token_hash" character varying NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "used" boolean NOT NULL DEFAULT false,
        "used_at" TIMESTAMP,
        "ip_address" character varying(100),
        "user_agent" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_password_resets_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_password_resets_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_password_resets_user_id" ON "password_resets" ("user_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_password_resets_expires_at" ON "password_resets" ("expires_at")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_password_resets_user_id_used" ON "password_resets" ("user_id", "used")',
    );

    // 10. Email Verifications Table
    await queryRunner.query(
      `CREATE TABLE "email_verifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token_hash" character varying NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "verified_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_email_verifications_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_email_verifications_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_email_verifications_user_id" ON "email_verifications" ("user_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_email_verifications_expires_at" ON "email_verifications" ("expires_at")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_email_verifications_token_hash" ON "email_verifications" ("token_hash")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_email_verifications_user_id_verified_at" ON "email_verifications" ("user_id", "verified_at")',
    );

    // 11. Audit Logs Table
    await queryRunner.query(
      `CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "event" character varying(100) NOT NULL,
        "ip_address" character varying(100),
        "user_agent" text,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_audit_logs_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_audit_logs_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )`,
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_audit_logs_user_id" ON "audit_logs" ("user_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_audit_logs_event" ON "audit_logs" ("event")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_audit_logs_user_id_event" ON "audit_logs" ("user_id", "event")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "audit_logs"');
    await queryRunner.query('DROP TABLE IF EXISTS "email_verifications"');
    await queryRunner.query('DROP TABLE IF EXISTS "password_resets"');
    await queryRunner.query('DROP TABLE IF EXISTS "user_sessions"');
    await queryRunner.query('DROP TABLE IF EXISTS "role_permissions"');
    await queryRunner.query('DROP TABLE IF EXISTS "user_roles"');
    await queryRunner.query('DROP TABLE IF EXISTS "users"');
    await queryRunner.query('DROP TABLE IF EXISTS "permissions"');
    await queryRunner.query('DROP TABLE IF EXISTS "roles"');
    await queryRunner.query('DROP TYPE IF EXISTS "user_status_enum"');
  }
}
