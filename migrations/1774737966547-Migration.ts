import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1774737966547 implements MigrationInterface {
    name = 'Migration1774737966547'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add workSector column to jobseeker_profiles
        await queryRunner.query(`CREATE TYPE "public"."jobseeker_profiles_worksector_enum" AS ENUM('SOFTWARE_DEVELOPMENT', 'DESIGN', 'ACCOUNTING_FINANCE', 'SALES_MARKETING', 'OPERATIONS', 'BUSINESS_ADMIN', 'CUSTOMER_SERVICE', 'HEALTHCARE_PHARMA', 'EDUCATION_TRAINING', 'MEDIA_CREATIVE', 'HR_ADMIN', 'LEGAL_COMPLIANCE', 'CONSTRUCTION_REAL_ESTATE', 'MAINTENANCE_TRADES', 'HOSPITALITY', 'SECURITY', 'TRANSPORT_LOGISTICS', 'AGRICULTURE')`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ADD "workSector" "public"."jobseeker_profiles_worksector_enum"`);

        // 2. Migrate skills.category: cast to text, remap old values, cast to new enum
        await queryRunner.query(`ALTER TABLE "skills" ALTER COLUMN "category" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "skills" ALTER COLUMN "category" TYPE text USING "category"::text`);
        await queryRunner.query(`UPDATE "skills" SET "category" = 'SOFTWARE_DEVELOPMENT' WHERE "category" IN ('TECHNICAL', 'DATABASE', 'OTHERS')`);
        await queryRunner.query(`UPDATE "skills" SET "category" = 'BUSINESS_ADMIN' WHERE "category" = 'BUSINESS'`);
        await queryRunner.query(`UPDATE "skills" SET "category" = 'CUSTOMER_SERVICE' WHERE "category" IN ('COMMUNICATION', 'SOCIAL_MEDIA')`);
        await queryRunner.query(`UPDATE "skills" SET "category" = 'MAINTENANCE_TRADES' WHERE "category" = 'HOME_SUPPORT'`);
        await queryRunner.query(`UPDATE "skills" SET "category" = 'ACCOUNTING_FINANCE' WHERE "category" = 'FINANCE_ACCOUNTING'`);
        await queryRunner.query(`DROP TYPE "public"."skills_category_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."skills_category_enum" AS ENUM('SOFTWARE_DEVELOPMENT', 'DESIGN', 'ACCOUNTING_FINANCE', 'SALES_MARKETING', 'OPERATIONS', 'BUSINESS_ADMIN', 'CUSTOMER_SERVICE', 'HEALTHCARE_PHARMA', 'EDUCATION_TRAINING', 'MEDIA_CREATIVE', 'HR_ADMIN', 'LEGAL_COMPLIANCE', 'CONSTRUCTION_REAL_ESTATE', 'MAINTENANCE_TRADES', 'HOSPITALITY', 'SECURITY', 'TRANSPORT_LOGISTICS', 'AGRICULTURE')`);
        await queryRunner.query(`ALTER TABLE "skills" ALTER COLUMN "category" TYPE "public"."skills_category_enum" USING "category"::"public"."skills_category_enum"`);
        await queryRunner.query(`ALTER TABLE "skills" ALTER COLUMN "category" SET DEFAULT 'SOFTWARE_DEVELOPMENT'`);

        // 3. Migrate jobs.category: same approach
        await queryRunner.query(`ALTER TABLE "jobs" ALTER COLUMN "category" TYPE text USING "category"::text`);
        await queryRunner.query(`UPDATE "jobs" SET "category" = 'SOFTWARE_DEVELOPMENT' WHERE "category" IN ('TECHNICAL', 'DATABASE', 'OTHERS')`);
        await queryRunner.query(`UPDATE "jobs" SET "category" = 'BUSINESS_ADMIN' WHERE "category" = 'BUSINESS'`);
        await queryRunner.query(`UPDATE "jobs" SET "category" = 'CUSTOMER_SERVICE' WHERE "category" IN ('COMMUNICATION', 'SOCIAL_MEDIA')`);
        await queryRunner.query(`UPDATE "jobs" SET "category" = 'MAINTENANCE_TRADES' WHERE "category" = 'HOME_SUPPORT'`);
        await queryRunner.query(`UPDATE "jobs" SET "category" = 'ACCOUNTING_FINANCE' WHERE "category" = 'FINANCE_ACCOUNTING'`);
        await queryRunner.query(`DROP TYPE "public"."jobs_category_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."jobs_category_enum" AS ENUM('SOFTWARE_DEVELOPMENT', 'DESIGN', 'ACCOUNTING_FINANCE', 'SALES_MARKETING', 'OPERATIONS', 'BUSINESS_ADMIN', 'CUSTOMER_SERVICE', 'HEALTHCARE_PHARMA', 'EDUCATION_TRAINING', 'MEDIA_CREATIVE', 'HR_ADMIN', 'LEGAL_COMPLIANCE', 'CONSTRUCTION_REAL_ESTATE', 'MAINTENANCE_TRADES', 'HOSPITALITY', 'SECURITY', 'TRANSPORT_LOGISTICS', 'AGRICULTURE')`);
        await queryRunner.query(`ALTER TABLE "jobs" ALTER COLUMN "category" TYPE "public"."jobs_category_enum" USING "category"::"public"."jobs_category_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert jobs.category
        await queryRunner.query(`ALTER TABLE "jobs" ALTER COLUMN "category" TYPE text USING "category"::text`);
        await queryRunner.query(`DROP TYPE "public"."jobs_category_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."jobs_category_enum" AS ENUM('BUSINESS', 'COMMUNICATION', 'DATABASE', 'DESIGN', 'FINANCE_ACCOUNTING', 'HOME_SUPPORT', 'HOSPITALITY', 'MAINTENANCE_TRADES', 'OPERATIONS', 'OTHERS', 'SALES_MARKETING', 'SECURITY', 'SOCIAL_MEDIA', 'SOFTWARE_DEVELOPMENT', 'TECHNICAL', 'TRANSPORT_LOGISTICS')`);
        await queryRunner.query(`UPDATE "jobs" SET "category" = 'SOFTWARE_DEVELOPMENT' WHERE "category" NOT IN ('BUSINESS', 'COMMUNICATION', 'DATABASE', 'DESIGN', 'FINANCE_ACCOUNTING', 'HOME_SUPPORT', 'HOSPITALITY', 'MAINTENANCE_TRADES', 'OPERATIONS', 'OTHERS', 'SALES_MARKETING', 'SECURITY', 'SOCIAL_MEDIA', 'SOFTWARE_DEVELOPMENT', 'TECHNICAL', 'TRANSPORT_LOGISTICS')`);
        await queryRunner.query(`ALTER TABLE "jobs" ALTER COLUMN "category" TYPE "public"."jobs_category_enum" USING "category"::"public"."jobs_category_enum"`);

        // Revert skills.category
        await queryRunner.query(`ALTER TABLE "skills" ALTER COLUMN "category" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "skills" ALTER COLUMN "category" TYPE text USING "category"::text`);
        await queryRunner.query(`DROP TYPE "public"."skills_category_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."skills_category_enum" AS ENUM('BUSINESS', 'COMMUNICATION', 'DATABASE', 'DESIGN', 'FINANCE_ACCOUNTING', 'HOME_SUPPORT', 'HOSPITALITY', 'MAINTENANCE_TRADES', 'OPERATIONS', 'OTHERS', 'SALES_MARKETING', 'SECURITY', 'SOCIAL_MEDIA', 'SOFTWARE_DEVELOPMENT', 'TECHNICAL', 'TRANSPORT_LOGISTICS')`);
        await queryRunner.query(`UPDATE "skills" SET "category" = 'OTHERS' WHERE "category" NOT IN ('BUSINESS', 'COMMUNICATION', 'DATABASE', 'DESIGN', 'FINANCE_ACCOUNTING', 'HOME_SUPPORT', 'HOSPITALITY', 'MAINTENANCE_TRADES', 'OPERATIONS', 'OTHERS', 'SALES_MARKETING', 'SECURITY', 'SOCIAL_MEDIA', 'SOFTWARE_DEVELOPMENT', 'TECHNICAL', 'TRANSPORT_LOGISTICS')`);
        await queryRunner.query(`ALTER TABLE "skills" ALTER COLUMN "category" TYPE "public"."skills_category_enum" USING "category"::"public"."skills_category_enum"`);
        await queryRunner.query(`ALTER TABLE "skills" ALTER COLUMN "category" SET DEFAULT 'OTHERS'`);

        // Drop workSector column
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" DROP COLUMN "workSector"`);
        await queryRunner.query(`DROP TYPE "public"."jobseeker_profiles_worksector_enum"`);
    }

}
