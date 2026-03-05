import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentCompleteContractSigned1772300000000 implements MigrationInterface {
    name = 'AddPaymentCompleteContractSigned1772300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Rename old type, create new type with added values, swap column, drop old type
        await queryRunner.query(`ALTER TYPE "public"."job_applications_status_enum" RENAME TO "job_applications_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."job_applications_status_enum" AS ENUM('APPLIED', 'VETTED', 'SELECTED_FOR_SCREENING', 'SCREENING_COMPLETED', 'OFFER_SENT', 'APPLICANT_ACCEPTED', 'PAYMENT_COMPLETE', 'CONTRACT_SIGNED', 'HIRED', 'REJECTED', 'WITHDRAWN')`);
        await queryRunner.query(`ALTER TABLE "job_applications" ALTER COLUMN "status" TYPE "public"."job_applications_status_enum" USING "status"::text::"public"."job_applications_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."job_applications_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Move any rows with new statuses to nearest safe fallback before reverting
        await queryRunner.query(`UPDATE "job_applications" SET "status" = 'HIRED' WHERE "status" IN ('PAYMENT_COMPLETE', 'CONTRACT_SIGNED')`);
        await queryRunner.query(`ALTER TYPE "public"."job_applications_status_enum" RENAME TO "job_applications_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."job_applications_status_enum" AS ENUM('APPLIED', 'VETTED', 'SELECTED_FOR_SCREENING', 'SCREENING_COMPLETED', 'OFFER_SENT', 'APPLICANT_ACCEPTED', 'HIRED', 'REJECTED', 'WITHDRAWN')`);
        await queryRunner.query(`ALTER TABLE "job_applications" ALTER COLUMN "status" TYPE "public"."job_applications_status_enum" USING "status"::text::"public"."job_applications_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."job_applications_status_enum_old"`);
    }
}
