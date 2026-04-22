import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1775334909484 implements MigrationInterface {
    name = 'Migration1775334909484'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "expectedSalary"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "applicantsCount"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" DROP COLUMN "brief"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ADD "brief" character varying(3000)`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "description" character varying(3000)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "description" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" DROP COLUMN "brief"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ADD "brief" text`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "applicantsCount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "job_applications" ADD "expectedSalary" numeric(12,2)`);
    }

}
