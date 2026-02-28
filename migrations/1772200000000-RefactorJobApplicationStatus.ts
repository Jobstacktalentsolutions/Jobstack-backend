import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorJobApplicationStatus1772200000000 implements MigrationInterface {
    name = 'RefactorJobApplicationStatus1772200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Rename EMPLOYER_ACCEPTED → OFFER_SENT
        await queryRunner.query(`ALTER TYPE "public"."job_applications_status_enum" RENAME VALUE 'EMPLOYER_ACCEPTED' TO 'OFFER_SENT'`);

        // Step 2: Remove AWAITING_PAYMENT and OFFERED.
        // PostgreSQL does not support DROP VALUE on an enum, so we recreate the type.
        // First update any rows that carry the dead statuses (safety net — should be zero in prod).
        await queryRunner.query(`UPDATE "job_applications" SET "status" = 'APPLICANT_ACCEPTED' WHERE "status" = 'AWAITING_PAYMENT'`);
        await queryRunner.query(`UPDATE "job_applications" SET "status" = 'OFFER_SENT' WHERE "status" = 'OFFERED'`);

        // Rename old type, create new clean type, swap column, drop old type
        await queryRunner.query(`ALTER TYPE "public"."job_applications_status_enum" RENAME TO "job_applications_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."job_applications_status_enum" AS ENUM('APPLIED', 'VETTED', 'SELECTED_FOR_SCREENING', 'SCREENING_COMPLETED', 'OFFER_SENT', 'APPLICANT_ACCEPTED', 'HIRED', 'REJECTED', 'WITHDRAWN')`);
        await queryRunner.query(`ALTER TABLE "job_applications" ALTER COLUMN "status" TYPE "public"."job_applications_status_enum" USING "status"::text::"public"."job_applications_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."job_applications_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Restore the original enum type
        await queryRunner.query(`ALTER TYPE "public"."job_applications_status_enum" RENAME TO "job_applications_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."job_applications_status_enum" AS ENUM('APPLIED', 'VETTED', 'SELECTED_FOR_SCREENING', 'SCREENING_COMPLETED', 'EMPLOYER_ACCEPTED', 'APPLICANT_ACCEPTED', 'AWAITING_PAYMENT', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN')`);
        await queryRunner.query(`UPDATE "job_applications" SET "status" = 'EMPLOYER_ACCEPTED' WHERE "status" = 'OFFER_SENT'`);
        await queryRunner.query(`ALTER TABLE "job_applications" ALTER COLUMN "status" TYPE "public"."job_applications_status_enum" USING "status"::text::"public"."job_applications_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."job_applications_status_enum_old"`);
    }
}
