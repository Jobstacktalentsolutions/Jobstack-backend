import { MigrationInterface, QueryRunner } from "typeorm";

export class PaymentApplicationRelation1776818462691 implements MigrationInterface {
    name = 'PaymentApplicationRelation1776818462691'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "employerWillJoinScreening"`);
        await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "adminProposedScreeningTime"`);
        await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "employerProposedScreeningTime"`);
        await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "employerAccepted"`);
        await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "adminAccepted"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "performCustomScreening"`);
        await queryRunner.query(`ALTER TABLE "job_applications" ADD "piiUnlocked" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "job_applications" ADD "piiUnlockedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "applicationId" uuid`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_ac5b1622e8053d1320a5699e5cb"`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "employeeId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_ac5b1622e8053d1320a5699e5cb" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_821c8aaba70ef6b9698bbfb0693" FOREIGN KEY ("applicationId") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_821c8aaba70ef6b9698bbfb0693"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_ac5b1622e8053d1320a5699e5cb"`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "employeeId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_ac5b1622e8053d1320a5699e5cb" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "applicationId"`);
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
