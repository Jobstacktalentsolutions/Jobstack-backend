import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1777769405075 implements MigrationInterface {
    name = 'Migration1777769405075'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" RENAME COLUMN "workSector" TO "industry"`);
        await queryRunner.query(`ALTER TYPE "public"."jobseeker_profiles_worksector_enum" RENAME TO "jobseeker_profiles_industry_enum"`);
        await queryRunner.query(`ALTER TABLE "skills" DROP COLUMN "category"`);
        await queryRunner.query(`DROP TYPE "public"."skills_category_enum"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "category"`);
        await queryRunner.query(`DROP TYPE "public"."jobs_category_enum"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "tags"`);
        await queryRunner.query(`ALTER TABLE "job_applications" ADD "vettingIndustryMatchScore" integer`);
        await queryRunner.query(`CREATE TYPE "public"."jobs_industry_enum" AS ENUM('SOFTWARE_DEVELOPMENT', 'DESIGN', 'ACCOUNTING_FINANCE', 'SALES_MARKETING', 'OPERATIONS', 'BUSINESS_ADMIN', 'CUSTOMER_SERVICE', 'HEALTHCARE_PHARMA', 'EDUCATION_TRAINING', 'MEDIA_CREATIVE', 'HR_ADMIN', 'LEGAL_COMPLIANCE', 'CONSTRUCTION_REAL_ESTATE', 'MAINTENANCE_TRADES', 'HOSPITALITY', 'SECURITY', 'TRANSPORT_LOGISTICS', 'AGRICULTURE', 'RETAIL_MERCHANDISING', 'PERSONAL_SERVICES', 'PET_CARE', 'EVENT_SERVICES', 'OTHERS')`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "industry" "public"."jobs_industry_enum" DEFAULT 'OTHERS'`);
        await queryRunner.query(`ALTER TYPE "public"."jobseeker_profiles_industry_enum" RENAME TO "jobseeker_profiles_industry_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."jobseeker_profiles_industry_enum" AS ENUM('SOFTWARE_DEVELOPMENT', 'DESIGN', 'ACCOUNTING_FINANCE', 'SALES_MARKETING', 'OPERATIONS', 'BUSINESS_ADMIN', 'CUSTOMER_SERVICE', 'HEALTHCARE_PHARMA', 'EDUCATION_TRAINING', 'MEDIA_CREATIVE', 'HR_ADMIN', 'LEGAL_COMPLIANCE', 'CONSTRUCTION_REAL_ESTATE', 'MAINTENANCE_TRADES', 'HOSPITALITY', 'SECURITY', 'TRANSPORT_LOGISTICS', 'AGRICULTURE', 'RETAIL_MERCHANDISING', 'PERSONAL_SERVICES', 'PET_CARE', 'EVENT_SERVICES', 'OTHERS')`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ALTER COLUMN "industry" TYPE "public"."jobseeker_profiles_industry_enum" USING "industry"::"text"::"public"."jobseeker_profiles_industry_enum"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ALTER COLUMN "industry" SET DEFAULT 'OTHERS'`);
        await queryRunner.query(`DROP TYPE "public"."jobseeker_profiles_industry_enum_old"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ALTER COLUMN "industry" SET DEFAULT 'OTHERS'`);
        await queryRunner.query(`ALTER TYPE "public"."employer_profiles_industry_enum" RENAME TO "employer_profiles_industry_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."employer_profiles_industry_enum" AS ENUM('SOFTWARE_DEVELOPMENT', 'DESIGN', 'ACCOUNTING_FINANCE', 'SALES_MARKETING', 'OPERATIONS', 'BUSINESS_ADMIN', 'CUSTOMER_SERVICE', 'HEALTHCARE_PHARMA', 'EDUCATION_TRAINING', 'MEDIA_CREATIVE', 'HR_ADMIN', 'LEGAL_COMPLIANCE', 'CONSTRUCTION_REAL_ESTATE', 'MAINTENANCE_TRADES', 'HOSPITALITY', 'SECURITY', 'TRANSPORT_LOGISTICS', 'AGRICULTURE', 'RETAIL_MERCHANDISING', 'PERSONAL_SERVICES', 'PET_CARE', 'EVENT_SERVICES', 'OTHERS')`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" ALTER COLUMN "industry" TYPE "public"."employer_profiles_industry_enum" USING "industry"::"text"::"public"."employer_profiles_industry_enum"`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" ALTER COLUMN "industry" SET DEFAULT 'OTHERS'`);
        await queryRunner.query(`DROP TYPE "public"."employer_profiles_industry_enum_old"`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" ALTER COLUMN "industry" SET DEFAULT 'OTHERS'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employer_profiles" ALTER COLUMN "industry" DROP DEFAULT`);
        await queryRunner.query(`CREATE TYPE "public"."employer_profiles_industry_enum_old" AS ENUM('ACCOUNTING_FINANCE', 'AGRICULTURE', 'BUSINESS_ADMIN', 'CONSTRUCTION_REAL_ESTATE', 'CUSTOMER_SERVICE', 'DESIGN', 'EDUCATION_TRAINING', 'EVENT_SERVICES', 'HEALTHCARE_PHARMA', 'HOSPITALITY', 'HR_ADMIN', 'LEGAL_COMPLIANCE', 'MAINTENANCE_TRADES', 'MEDIA_CREATIVE', 'OPERATIONS', 'PERSONAL_SERVICES', 'PET_CARE', 'RETAIL_MERCHANDISING', 'SALES_MARKETING', 'SECURITY', 'SOFTWARE_DEVELOPMENT', 'TRANSPORT_LOGISTICS')`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" ALTER COLUMN "industry" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" ALTER COLUMN "industry" TYPE "public"."employer_profiles_industry_enum_old" USING "industry"::"text"::"public"."employer_profiles_industry_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."employer_profiles_industry_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."employer_profiles_industry_enum_old" RENAME TO "employer_profiles_industry_enum"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ALTER COLUMN "industry" DROP DEFAULT`);
        await queryRunner.query(`CREATE TYPE "public"."jobseeker_profiles_industry_enum_old" AS ENUM('ACCOUNTING_FINANCE', 'AGRICULTURE', 'BUSINESS_ADMIN', 'CONSTRUCTION_REAL_ESTATE', 'CUSTOMER_SERVICE', 'DESIGN', 'EDUCATION_TRAINING', 'EVENT_SERVICES', 'HEALTHCARE_PHARMA', 'HOSPITALITY', 'HR_ADMIN', 'LEGAL_COMPLIANCE', 'MAINTENANCE_TRADES', 'MEDIA_CREATIVE', 'OPERATIONS', 'PERSONAL_SERVICES', 'PET_CARE', 'RETAIL_MERCHANDISING', 'SALES_MARKETING', 'SECURITY', 'SOFTWARE_DEVELOPMENT', 'TRANSPORT_LOGISTICS')`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ALTER COLUMN "industry" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ALTER COLUMN "industry" TYPE "public"."jobseeker_profiles_industry_enum_old" USING "industry"::"text"::"public"."jobseeker_profiles_industry_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."jobseeker_profiles_industry_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."jobseeker_profiles_industry_enum_old" RENAME TO "jobseeker_profiles_industry_enum"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "industry"`);
        await queryRunner.query(`DROP TYPE "public"."jobs_industry_enum"`);
        await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "vettingIndustryMatchScore"`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "tags" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`CREATE TYPE "public"."jobs_category_enum" AS ENUM('ACCOUNTING_FINANCE', 'AGRICULTURE', 'BUSINESS_ADMIN', 'CONSTRUCTION_REAL_ESTATE', 'CUSTOMER_SERVICE', 'DESIGN', 'EDUCATION_TRAINING', 'EVENT_SERVICES', 'HEALTHCARE_PHARMA', 'HOSPITALITY', 'HR_ADMIN', 'LEGAL_COMPLIANCE', 'MAINTENANCE_TRADES', 'MEDIA_CREATIVE', 'OPERATIONS', 'PERSONAL_SERVICES', 'PET_CARE', 'RETAIL_MERCHANDISING', 'SALES_MARKETING', 'SECURITY', 'SOFTWARE_DEVELOPMENT', 'TRANSPORT_LOGISTICS')`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "category" "public"."jobs_category_enum" NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."skills_category_enum" AS ENUM('ACCOUNTING_FINANCE', 'AGRICULTURE', 'BUSINESS_ADMIN', 'CONSTRUCTION_REAL_ESTATE', 'CUSTOMER_SERVICE', 'DESIGN', 'EDUCATION_TRAINING', 'EVENT_SERVICES', 'HEALTHCARE_PHARMA', 'HOSPITALITY', 'HR_ADMIN', 'LEGAL_COMPLIANCE', 'MAINTENANCE_TRADES', 'MEDIA_CREATIVE', 'OPERATIONS', 'PERSONAL_SERVICES', 'PET_CARE', 'RETAIL_MERCHANDISING', 'SALES_MARKETING', 'SECURITY', 'SOFTWARE_DEVELOPMENT', 'TRANSPORT_LOGISTICS')`);
        await queryRunner.query(`ALTER TABLE "skills" ADD "category" "public"."skills_category_enum" NOT NULL DEFAULT 'SOFTWARE_DEVELOPMENT'`);
        await queryRunner.query(`ALTER TYPE "public"."jobseeker_profiles_industry_enum" RENAME TO "jobseeker_profiles_worksector_enum"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" RENAME COLUMN "industry" TO "workSector"`);
    }

}
