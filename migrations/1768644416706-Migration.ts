import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1768644416706 implements MigrationInterface {
    name = 'Migration1768644416706'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "system_configs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "key" character varying NOT NULL, "value" text NOT NULL, "description" text, "updatedBy" uuid, CONSTRAINT "UQ_5aff9a6d272a5cedf54d7aaf617" UNIQUE ("key"), CONSTRAINT "PK_29ac548e654c799fd885e1b9b71" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum" AS ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')`);
        await queryRunner.query(`CREATE TYPE "public"."payments_paymenttype_enum" AS ENUM('EMPLOYEE_ACTIVATION', 'CONTRACT_ACTIVATION')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "employeeId" uuid NOT NULL, "employerId" uuid NOT NULL, "amount" numeric(12,2) NOT NULL, "percentage" numeric(5,2) NOT NULL, "currency" character varying NOT NULL, "status" "public"."payments_status_enum" NOT NULL DEFAULT 'PENDING', "paystackReference" character varying, "paystackTransactionId" character varying, "paymentType" "public"."payments_paymenttype_enum" NOT NULL, "metadata" jsonb, "paidAt" TIMESTAMP, "processedByAdminId" uuid, CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "contractEndDate"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "contractStartDate"`);
        await queryRunner.query(`ALTER TABLE "admin_auth" ADD "suspended" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "admin_auth" ADD "suspendedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "admin_auth" ADD "suspensionReason" text`);
        await queryRunner.query(`ALTER TABLE "employer_auth" ADD "suspended" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "employer_auth" ADD "suspendedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "employer_auth" ADD "suspensionReason" text`);
        await queryRunner.query(`ALTER TABLE "jobseeker_auth" ADD "suspended" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "jobseeker_auth" ADD "suspendedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "jobseeker_auth" ADD "suspensionReason" text`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "contractDurationDays" integer`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "startDate" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "endDate" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "performCustomScreening" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "UQ_7b29cff5f6b88231f9141510ab9" UNIQUE ("paymentId")`);
        await queryRunner.query(`ALTER TABLE "system_configs" ADD CONSTRAINT "FK_c68ce5afbd6b6b40fe077e7d729" FOREIGN KEY ("updatedBy") REFERENCES "admin_auth"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "FK_7b29cff5f6b88231f9141510ab9" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_ac5b1622e8053d1320a5699e5cb" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_bf9db622550d85f4858b50e9c25" FOREIGN KEY ("employerId") REFERENCES "employer_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_881dbb9e2e4c23be47ca48e85ea" FOREIGN KEY ("processedByAdminId") REFERENCES "admin_auth"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_881dbb9e2e4c23be47ca48e85ea"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_bf9db622550d85f4858b50e9c25"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_ac5b1622e8053d1320a5699e5cb"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "FK_7b29cff5f6b88231f9141510ab9"`);
        await queryRunner.query(`ALTER TABLE "system_configs" DROP CONSTRAINT "FK_c68ce5afbd6b6b40fe077e7d729"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "UQ_7b29cff5f6b88231f9141510ab9"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "performCustomScreening"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "endDate"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "startDate"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "contractDurationDays"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_auth" DROP COLUMN "suspensionReason"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_auth" DROP COLUMN "suspendedAt"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_auth" DROP COLUMN "suspended"`);
        await queryRunner.query(`ALTER TABLE "employer_auth" DROP COLUMN "suspensionReason"`);
        await queryRunner.query(`ALTER TABLE "employer_auth" DROP COLUMN "suspendedAt"`);
        await queryRunner.query(`ALTER TABLE "employer_auth" DROP COLUMN "suspended"`);
        await queryRunner.query(`ALTER TABLE "admin_auth" DROP COLUMN "suspensionReason"`);
        await queryRunner.query(`ALTER TABLE "admin_auth" DROP COLUMN "suspendedAt"`);
        await queryRunner.query(`ALTER TABLE "admin_auth" DROP COLUMN "suspended"`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "contractStartDate" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "contractEndDate" TIMESTAMP`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "public"."payments_paymenttype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
        await queryRunner.query(`DROP TABLE "system_configs"`);
    }

}
