import { MigrationInterface, QueryRunner } from "typeorm";

export class EmployerLedVettingSchema1776817609430 implements MigrationInterface {
    name = 'EmployerLedVettingSchema1776817609430'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "employerWillJoinScreening"`);
        await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "adminProposedScreeningTime"`);
        await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "employerProposedScreeningTime"`);
        await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "employerAccepted"`);
        await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "adminAccepted"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "performCustomScreening"`);
        await queryRunner.query(`ALTER TABLE "job_applications" ADD "piiUnlocked" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "job_applications" ADD "piiUnlockedAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "piiUnlockedAt"`);
        await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "piiUnlocked"`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "performCustomScreening" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "job_applications" ADD "adminAccepted" boolean`);
        await queryRunner.query(`ALTER TABLE "job_applications" ADD "employerAccepted" boolean`);
        await queryRunner.query(`ALTER TABLE "job_applications" ADD "employerProposedScreeningTime" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "job_applications" ADD "adminProposedScreeningTime" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "job_applications" ADD "employerWillJoinScreening" boolean`);
    }

}
