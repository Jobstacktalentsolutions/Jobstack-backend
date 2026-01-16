import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVettingSystem1737983456789 implements MigrationInterface {
    name = 'AddVettingSystem1737983456789'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new JobApplicationStatus enum values
        await queryRunner.query(`ALTER TYPE "public"."job_applications_status_enum" ADD VALUE 'VETTED'`);
        await queryRunner.query(`ALTER TYPE "public"."job_applications_status_enum" ADD VALUE 'SELECTED_FOR_SCREENING'`);
        
        // Add vetting-related fields to jobs table
        await queryRunner.query(`ALTER TABLE "jobs" ADD "vettingCompletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "vettingCompletedBy" character varying`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "highlightedCandidateCount" integer`);
        
        // Add screening meeting details to job_applications table
        await queryRunner.query(`ALTER TABLE "job_applications" ADD "screeningMeetingLink" text`);
        await queryRunner.query(`ALTER TABLE "job_applications" ADD "screeningScheduledAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "job_applications" ADD "screeningPrepInfo" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove screening meeting details from job_applications table
        await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "screeningPrepInfo"`);
        await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "screeningScheduledAt"`);
        await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "screeningMeetingLink"`);
        
        // Remove vetting-related fields from jobs table
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "highlightedCandidateCount"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "vettingCompletedBy"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "vettingCompletedAt"`);
        
        // Note: PostgreSQL doesn't support removing enum values directly
        // In a production environment, you would need to:
        // 1. Create a new enum without the values
        // 2. Update all references to use the new enum
        // 3. Drop the old enum
        // For now, we'll leave the enum values as they are in the down migration
        // since removing them could cause issues if data exists with those values
    }
}