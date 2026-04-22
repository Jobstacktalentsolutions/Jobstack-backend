import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1775970153777 implements MigrationInterface {
    name = 'Migration1775970153777'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "job_bookmarks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "jobseekerProfileId" uuid NOT NULL, "jobId" uuid NOT NULL, CONSTRAINT "UQ_a09c16cc98e76ba4410d195f7c4" UNIQUE ("jobseekerProfileId", "jobId"), CONSTRAINT "PK_d2066eb71fda031b6f3d5773773" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6a48340a235f7325d6d2b45c8d" ON "job_bookmarks" ("jobseekerProfileId") `);
        await queryRunner.query(`CREATE TYPE "public"."employment_feedback_reviewerrole_enum" AS ENUM('EMPLOYER', 'JOBSEEKER')`);
        await queryRunner.query(`CREATE TABLE "employment_feedback" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "employeeId" uuid NOT NULL, "reviewerRole" "public"."employment_feedback_reviewerrole_enum" NOT NULL, "rating" smallint NOT NULL, "comment" text, CONSTRAINT "UQ_32c1026e26700ee2ab105f0ee60" UNIQUE ("employeeId", "reviewerRole"), CONSTRAINT "PK_df3ec14a022b03c136328764c2d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_98109b594917f6d36b7a9c620c" ON "employment_feedback" ("employeeId") `);
        await queryRunner.query(`CREATE TYPE "public"."employees_terminationhrmeaning_enum" AS ENUM('EMPLOYEE_RESIGNED', 'EMPLOYEE_TERMINATED', 'ROLE_REDUNDANT', 'MUTUAL_SEPARATION', 'OTHER')`);
        await queryRunner.query(`ALTER TABLE "employees" ADD "terminationHrMeaning" "public"."employees_terminationhrmeaning_enum"`);
        await queryRunner.query(`ALTER TABLE "employees" ADD "terminationDetail" text`);
        await queryRunner.query(`ALTER TABLE "employees" ADD "terminatedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "employees" ADD "employerDeclaredCompleteAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "employees" ADD "jobseekerDeclaredCompleteAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TYPE "public"."employees_status_enum" RENAME TO "employees_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."employees_status_enum" AS ENUM('ACTIVE', 'ONBOARDING', 'SUSPENDED', 'COMPLETED', 'TERMINATED', 'ENDED')`);
        await queryRunner.query(`ALTER TABLE "employees" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "employees" ALTER COLUMN "status" TYPE "public"."employees_status_enum" USING "status"::"text"::"public"."employees_status_enum"`);
        await queryRunner.query(`ALTER TABLE "employees" ALTER COLUMN "status" SET DEFAULT 'ONBOARDING'`);
        await queryRunner.query(`DROP TYPE "public"."employees_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "job_bookmarks" ADD CONSTRAINT "FK_6a48340a235f7325d6d2b45c8d1" FOREIGN KEY ("jobseekerProfileId") REFERENCES "jobseeker_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_bookmarks" ADD CONSTRAINT "FK_273432914fd47d0863491947d20" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "employment_feedback" ADD CONSTRAINT "FK_98109b594917f6d36b7a9c620c7" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employment_feedback" DROP CONSTRAINT "FK_98109b594917f6d36b7a9c620c7"`);
        await queryRunner.query(`ALTER TABLE "job_bookmarks" DROP CONSTRAINT "FK_273432914fd47d0863491947d20"`);
        await queryRunner.query(`ALTER TABLE "job_bookmarks" DROP CONSTRAINT "FK_6a48340a235f7325d6d2b45c8d1"`);
        await queryRunner.query(`CREATE TYPE "public"."employees_status_enum_old" AS ENUM('ACTIVE', 'COMPLETED', 'ONBOARDING', 'SUSPENDED', 'TERMINATED')`);
        await queryRunner.query(`ALTER TABLE "employees" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "employees" ALTER COLUMN "status" TYPE "public"."employees_status_enum_old" USING "status"::"text"::"public"."employees_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "employees" ALTER COLUMN "status" SET DEFAULT 'ONBOARDING'`);
        await queryRunner.query(`DROP TYPE "public"."employees_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."employees_status_enum_old" RENAME TO "employees_status_enum"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "jobseekerDeclaredCompleteAt"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "employerDeclaredCompleteAt"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "terminatedAt"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "terminationDetail"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "terminationHrMeaning"`);
        await queryRunner.query(`DROP TYPE "public"."employees_terminationhrmeaning_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_98109b594917f6d36b7a9c620c"`);
        await queryRunner.query(`DROP TABLE "employment_feedback"`);
        await queryRunner.query(`DROP TYPE "public"."employment_feedback_reviewerrole_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6a48340a235f7325d6d2b45c8d"`);
        await queryRunner.query(`DROP TABLE "job_bookmarks"`);
    }

}
