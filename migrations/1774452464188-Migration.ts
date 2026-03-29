import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1774452464188 implements MigrationInterface {
  name = 'Migration1774452464188';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."job_applications_status_enum" RENAME TO "job_applications_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."job_applications_status_enum" AS ENUM('APPLIED', 'VETTED', 'SELECTED_FOR_SCREENING', 'SELECTED_FOR_HIRE', 'OFFER_SENT', 'APPLICANT_ACCEPTED', 'PAYMENT_COMPLETE', 'CONTRACT_SIGNED', 'HIRED', 'REJECTED', 'WITHDRAWN')`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_applications" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_applications" ALTER COLUMN "status" TYPE "public"."job_applications_status_enum" USING "status"::"text"::"public"."job_applications_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_applications" ALTER COLUMN "status" SET DEFAULT 'APPLIED'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."job_applications_status_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."job_applications_status_enum_old" AS ENUM('APPLICANT_ACCEPTED', 'APPLIED', 'CONFIRMED', 'CONTRACT_SIGNED', 'HIRED', 'OFFER_SENT', 'PAYMENT_COMPLETE', 'PLACED_PROBATION', 'REJECTED', 'SELECTED_FOR_HIRE', 'SELECTED_FOR_SCREENING', 'VETTED', 'WITHDRAWN')`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_applications" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_applications" ALTER COLUMN "status" TYPE "public"."job_applications_status_enum_old" USING "status"::"text"::"public"."job_applications_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_applications" ALTER COLUMN "status" SET DEFAULT 'APPLIED'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."job_applications_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."job_applications_status_enum_old" RENAME TO "job_applications_status_enum"`,
    );
  }
}
