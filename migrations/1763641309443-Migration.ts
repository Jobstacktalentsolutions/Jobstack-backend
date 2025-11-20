import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1763641309443 implements MigrationInterface {
    name = 'Migration1763641309443'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."employees_employmenttype_enum" AS ENUM('FULL_TIME', 'PART_TIME')`);
        await queryRunner.query(`CREATE TYPE "public"."employees_employmentarrangement_enum" AS ENUM('FULL_TIME_EMPLOYEE', 'CONTRACT')`);
        await queryRunner.query(`CREATE TYPE "public"."employees_status_enum" AS ENUM('ACTIVE', 'ONBOARDING', 'SUSPENDED', 'COMPLETED', 'TERMINATED')`);
        await queryRunner.query(`CREATE TABLE "employees" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "employerId" uuid NOT NULL, "jobId" uuid NOT NULL, "jobseekerProfileId" uuid, "employmentType" "public"."employees_employmenttype_enum" NOT NULL, "employmentArrangement" "public"."employees_employmentarrangement_enum" NOT NULL, "status" "public"."employees_status_enum" NOT NULL DEFAULT 'ONBOARDING', "startDate" TIMESTAMP, "endDate" TIMESTAMP, "salaryOffered" numeric(12,2), "currency" character varying, "notes" text, CONSTRAINT "PK_b9535a98350d5b26e7eb0c26af4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."jobs_category_enum" AS ENUM('TECHNOLOGY', 'BUSINESS', 'OPERATIONS', 'DESIGN', 'MARKETING', 'FINANCE', 'CUSTOMER_SERVICE', 'HOME_SERVICES', 'MAINTENANCE', 'HOSPITALITY', 'SECURITY', 'TRANSPORT')`);
        await queryRunner.query(`CREATE TYPE "public"."jobs_employmenttype_enum" AS ENUM('FULL_TIME', 'PART_TIME')`);
        await queryRunner.query(`CREATE TYPE "public"."jobs_employmentarrangement_enum" AS ENUM('FULL_TIME_EMPLOYEE', 'CONTRACT')`);
        await queryRunner.query(`CREATE TYPE "public"."jobs_workmode_enum" AS ENUM('REMOTE', 'HYBRID', 'ON_SITE')`);
        await queryRunner.query(`CREATE TYPE "public"."jobs_startday_enum" AS ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY')`);
        await queryRunner.query(`CREATE TYPE "public"."jobs_endday_enum" AS ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY')`);
        await queryRunner.query(`CREATE TYPE "public"."jobs_status_enum" AS ENUM('DRAFT', 'PUBLISHED', 'CLOSED')`);
        await queryRunner.query(`CREATE TABLE "jobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "title" character varying NOT NULL, "description" text NOT NULL, "category" "public"."jobs_category_enum" NOT NULL, "employmentType" "public"."jobs_employmenttype_enum" NOT NULL, "employmentArrangement" "public"."jobs_employmentarrangement_enum" NOT NULL, "workMode" "public"."jobs_workmode_enum" NOT NULL, "salaryMin" numeric(12,2), "salaryMax" numeric(12,2), "state" character varying, "city" character varying, "address" text, "startDay" "public"."jobs_startday_enum", "endDay" "public"."jobs_endday_enum", "tags" jsonb NOT NULL DEFAULT '[]', "applicationDeadline" TIMESTAMP, "status" "public"."jobs_status_enum" NOT NULL DEFAULT 'DRAFT', "employerId" uuid NOT NULL, CONSTRAINT "PK_cf0a6c42b72fcc7f7c237def345" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."job_applications_status_enum" AS ENUM('APPLIED', 'SHORTLISTED', 'INTERVIEWING', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN')`);
        await queryRunner.query(`CREATE TABLE "job_applications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "jobId" uuid NOT NULL, "jobseekerProfileId" uuid NOT NULL, "status" "public"."job_applications_status_enum" NOT NULL DEFAULT 'APPLIED', "coverLetter" text, "expectedSalary" numeric(12,2), "note" text, "statusUpdatedAt" TIMESTAMP, CONSTRAINT "PK_c56a5e86707d0f0df18fa111280" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "job_skills" ("jobId" uuid NOT NULL, "skillId" uuid NOT NULL, CONSTRAINT "PK_d70ad55609812d9fde4fefe099f" PRIMARY KEY ("jobId", "skillId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_aef367731b3f3e78ea90892fd4" ON "job_skills" ("jobId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b8d0000c11602550abb8178841" ON "job_skills" ("skillId") `);
        await queryRunner.query(`CREATE TYPE "public"."skills_category_enum" AS ENUM('TECHNICAL', 'DATABASE', 'BUSINESS', 'DESIGN', 'FINANCE_ACCOUNTING', 'SALES_MARKETING', 'OPERATIONS', 'COMMUNICATION', 'SOCIAL_MEDIA', 'SOFTWARE_DEVELOPMENT', 'HOME_SUPPORT', 'MAINTENANCE_TRADES', 'HOSPITALITY', 'SECURITY', 'TRANSPORT_LOGISTICS', 'OTHERS')`);
        await queryRunner.query(`ALTER TABLE "skills" ADD "category" "public"."skills_category_enum" NOT NULL DEFAULT 'OTHERS'`);
        await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "FK_d8c7b6425560b798d7cfc0fedb8" FOREIGN KEY ("employerId") REFERENCES "employer_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "FK_bf9c02a9b9633d19f673c279176" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "FK_b56e024a54ac9734d05a077fb1f" FOREIGN KEY ("jobseekerProfileId") REFERENCES "jobseeker_profiles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD CONSTRAINT "FK_62e3afafda3cf7db0a08982a5b1" FOREIGN KEY ("employerId") REFERENCES "employer_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_applications" ADD CONSTRAINT "FK_800dbac1b41b16b232fbf42f100" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_applications" ADD CONSTRAINT "FK_84daca05c23c422add0bd583beb" FOREIGN KEY ("jobseekerProfileId") REFERENCES "jobseeker_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_skills" ADD CONSTRAINT "FK_aef367731b3f3e78ea90892fd47" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "job_skills" ADD CONSTRAINT "FK_b8d0000c11602550abb81788412" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job_skills" DROP CONSTRAINT "FK_b8d0000c11602550abb81788412"`);
        await queryRunner.query(`ALTER TABLE "job_skills" DROP CONSTRAINT "FK_aef367731b3f3e78ea90892fd47"`);
        await queryRunner.query(`ALTER TABLE "job_applications" DROP CONSTRAINT "FK_84daca05c23c422add0bd583beb"`);
        await queryRunner.query(`ALTER TABLE "job_applications" DROP CONSTRAINT "FK_800dbac1b41b16b232fbf42f100"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP CONSTRAINT "FK_62e3afafda3cf7db0a08982a5b1"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "FK_b56e024a54ac9734d05a077fb1f"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "FK_bf9c02a9b9633d19f673c279176"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "FK_d8c7b6425560b798d7cfc0fedb8"`);
        await queryRunner.query(`ALTER TABLE "skills" DROP COLUMN "category"`);
        await queryRunner.query(`DROP TYPE "public"."skills_category_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b8d0000c11602550abb8178841"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_aef367731b3f3e78ea90892fd4"`);
        await queryRunner.query(`DROP TABLE "job_skills"`);
        await queryRunner.query(`DROP TABLE "job_applications"`);
        await queryRunner.query(`DROP TYPE "public"."job_applications_status_enum"`);
        await queryRunner.query(`DROP TABLE "jobs"`);
        await queryRunner.query(`DROP TYPE "public"."jobs_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."jobs_endday_enum"`);
        await queryRunner.query(`DROP TYPE "public"."jobs_startday_enum"`);
        await queryRunner.query(`DROP TYPE "public"."jobs_workmode_enum"`);
        await queryRunner.query(`DROP TYPE "public"."jobs_employmentarrangement_enum"`);
        await queryRunner.query(`DROP TYPE "public"."jobs_employmenttype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."jobs_category_enum"`);
        await queryRunner.query(`DROP TABLE "employees"`);
        await queryRunner.query(`DROP TYPE "public"."employees_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."employees_employmentarrangement_enum"`);
        await queryRunner.query(`DROP TYPE "public"."employees_employmenttype_enum"`);
    }

}
