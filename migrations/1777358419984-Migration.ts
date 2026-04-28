import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1777358419984 implements MigrationInterface {
    name = 'Migration1777358419984'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employer_profiles" DROP COLUMN "businessAddress"`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" DROP COLUMN "companyAddress"`);
        await queryRunner.query(`ALTER TYPE "public"."skills_category_enum" RENAME TO "skills_category_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."skills_category_enum" AS ENUM('SOFTWARE_DEVELOPMENT', 'DESIGN', 'ACCOUNTING_FINANCE', 'SALES_MARKETING', 'OPERATIONS', 'BUSINESS_ADMIN', 'CUSTOMER_SERVICE', 'HEALTHCARE_PHARMA', 'EDUCATION_TRAINING', 'MEDIA_CREATIVE', 'HR_ADMIN', 'LEGAL_COMPLIANCE', 'CONSTRUCTION_REAL_ESTATE', 'MAINTENANCE_TRADES', 'HOSPITALITY', 'SECURITY', 'TRANSPORT_LOGISTICS', 'AGRICULTURE', 'RETAIL_MERCHANDISING', 'PERSONAL_SERVICES', 'PET_CARE', 'EVENT_SERVICES')`);
        await queryRunner.query(`ALTER TABLE "skills" ALTER COLUMN "category" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "skills" ALTER COLUMN "category" TYPE "public"."skills_category_enum" USING "category"::"text"::"public"."skills_category_enum"`);
        await queryRunner.query(`ALTER TABLE "skills" ALTER COLUMN "category" SET DEFAULT 'SOFTWARE_DEVELOPMENT'`);
        await queryRunner.query(`DROP TYPE "public"."skills_category_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."jobseeker_profiles_worksector_enum" RENAME TO "jobseeker_profiles_worksector_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."jobseeker_profiles_worksector_enum" AS ENUM('SOFTWARE_DEVELOPMENT', 'DESIGN', 'ACCOUNTING_FINANCE', 'SALES_MARKETING', 'OPERATIONS', 'BUSINESS_ADMIN', 'CUSTOMER_SERVICE', 'HEALTHCARE_PHARMA', 'EDUCATION_TRAINING', 'MEDIA_CREATIVE', 'HR_ADMIN', 'LEGAL_COMPLIANCE', 'CONSTRUCTION_REAL_ESTATE', 'MAINTENANCE_TRADES', 'HOSPITALITY', 'SECURITY', 'TRANSPORT_LOGISTICS', 'AGRICULTURE', 'RETAIL_MERCHANDISING', 'PERSONAL_SERVICES', 'PET_CARE', 'EVENT_SERVICES')`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ALTER COLUMN "workSector" TYPE "public"."jobseeker_profiles_worksector_enum" USING "workSector"::"text"::"public"."jobseeker_profiles_worksector_enum"`);
        await queryRunner.query(`DROP TYPE "public"."jobseeker_profiles_worksector_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."jobs_category_enum" RENAME TO "jobs_category_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."jobs_category_enum" AS ENUM('SOFTWARE_DEVELOPMENT', 'DESIGN', 'ACCOUNTING_FINANCE', 'SALES_MARKETING', 'OPERATIONS', 'BUSINESS_ADMIN', 'CUSTOMER_SERVICE', 'HEALTHCARE_PHARMA', 'EDUCATION_TRAINING', 'MEDIA_CREATIVE', 'HR_ADMIN', 'LEGAL_COMPLIANCE', 'CONSTRUCTION_REAL_ESTATE', 'MAINTENANCE_TRADES', 'HOSPITALITY', 'SECURITY', 'TRANSPORT_LOGISTICS', 'AGRICULTURE', 'RETAIL_MERCHANDISING', 'PERSONAL_SERVICES', 'PET_CARE', 'EVENT_SERVICES')`);
        await queryRunner.query(`ALTER TABLE "jobs" ALTER COLUMN "category" TYPE "public"."jobs_category_enum" USING "category"::"text"::"public"."jobs_category_enum"`);
        await queryRunner.query(`DROP TYPE "public"."jobs_category_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."employer_profiles_industry_enum" RENAME TO "employer_profiles_industry_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."employer_profiles_industry_enum" AS ENUM('SOFTWARE_DEVELOPMENT', 'DESIGN', 'ACCOUNTING_FINANCE', 'SALES_MARKETING', 'OPERATIONS', 'BUSINESS_ADMIN', 'CUSTOMER_SERVICE', 'HEALTHCARE_PHARMA', 'EDUCATION_TRAINING', 'MEDIA_CREATIVE', 'HR_ADMIN', 'LEGAL_COMPLIANCE', 'CONSTRUCTION_REAL_ESTATE', 'MAINTENANCE_TRADES', 'HOSPITALITY', 'SECURITY', 'TRANSPORT_LOGISTICS', 'AGRICULTURE', 'RETAIL_MERCHANDISING', 'PERSONAL_SERVICES', 'PET_CARE', 'EVENT_SERVICES')`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" ALTER COLUMN "industry" TYPE "public"."employer_profiles_industry_enum" USING "industry"::"text"::"public"."employer_profiles_industry_enum"`);
        await queryRunner.query(`DROP TYPE "public"."employer_profiles_industry_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."employer_profiles_industry_enum_old" AS ENUM('ACCOUNTING_FINANCE', 'AGRICULTURE', 'BUSINESS_ADMIN', 'CONSTRUCTION_REAL_ESTATE', 'CUSTOMER_SERVICE', 'DESIGN', 'EDUCATION_TRAINING', 'HEALTHCARE_PHARMA', 'HOSPITALITY', 'HR_ADMIN', 'LEGAL_COMPLIANCE', 'MAINTENANCE_TRADES', 'MEDIA_CREATIVE', 'OPERATIONS', 'SALES_MARKETING', 'SECURITY', 'SOFTWARE_DEVELOPMENT', 'TRANSPORT_LOGISTICS')`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" ALTER COLUMN "industry" TYPE "public"."employer_profiles_industry_enum_old" USING "industry"::"text"::"public"."employer_profiles_industry_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."employer_profiles_industry_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."employer_profiles_industry_enum_old" RENAME TO "employer_profiles_industry_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."jobs_category_enum_old" AS ENUM('ACCOUNTING_FINANCE', 'AGRICULTURE', 'BUSINESS_ADMIN', 'CONSTRUCTION_REAL_ESTATE', 'CUSTOMER_SERVICE', 'DESIGN', 'EDUCATION_TRAINING', 'HEALTHCARE_PHARMA', 'HOSPITALITY', 'HR_ADMIN', 'LEGAL_COMPLIANCE', 'MAINTENANCE_TRADES', 'MEDIA_CREATIVE', 'OPERATIONS', 'SALES_MARKETING', 'SECURITY', 'SOFTWARE_DEVELOPMENT', 'TRANSPORT_LOGISTICS')`);
        await queryRunner.query(`ALTER TABLE "jobs" ALTER COLUMN "category" TYPE "public"."jobs_category_enum_old" USING "category"::"text"::"public"."jobs_category_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."jobs_category_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."jobs_category_enum_old" RENAME TO "jobs_category_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."jobseeker_profiles_worksector_enum_old" AS ENUM('ACCOUNTING_FINANCE', 'AGRICULTURE', 'BUSINESS_ADMIN', 'CONSTRUCTION_REAL_ESTATE', 'CUSTOMER_SERVICE', 'DESIGN', 'EDUCATION_TRAINING', 'HEALTHCARE_PHARMA', 'HOSPITALITY', 'HR_ADMIN', 'LEGAL_COMPLIANCE', 'MAINTENANCE_TRADES', 'MEDIA_CREATIVE', 'OPERATIONS', 'SALES_MARKETING', 'SECURITY', 'SOFTWARE_DEVELOPMENT', 'TRANSPORT_LOGISTICS')`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ALTER COLUMN "workSector" TYPE "public"."jobseeker_profiles_worksector_enum_old" USING "workSector"::"text"::"public"."jobseeker_profiles_worksector_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."jobseeker_profiles_worksector_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."jobseeker_profiles_worksector_enum_old" RENAME TO "jobseeker_profiles_worksector_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."skills_category_enum_old" AS ENUM('ACCOUNTING_FINANCE', 'AGRICULTURE', 'BUSINESS_ADMIN', 'CONSTRUCTION_REAL_ESTATE', 'CUSTOMER_SERVICE', 'DESIGN', 'EDUCATION_TRAINING', 'HEALTHCARE_PHARMA', 'HOSPITALITY', 'HR_ADMIN', 'LEGAL_COMPLIANCE', 'MAINTENANCE_TRADES', 'MEDIA_CREATIVE', 'OPERATIONS', 'SALES_MARKETING', 'SECURITY', 'SOFTWARE_DEVELOPMENT', 'TRANSPORT_LOGISTICS')`);
        await queryRunner.query(`ALTER TABLE "skills" ALTER COLUMN "category" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "skills" ALTER COLUMN "category" TYPE "public"."skills_category_enum_old" USING "category"::"text"::"public"."skills_category_enum_old"`);
        await queryRunner.query(`ALTER TABLE "skills" ALTER COLUMN "category" SET DEFAULT 'SOFTWARE_DEVELOPMENT'`);
        await queryRunner.query(`DROP TYPE "public"."skills_category_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."skills_category_enum_old" RENAME TO "skills_category_enum"`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" ADD "companyAddress" character varying`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" ADD "businessAddress" character varying`);
    }

}
