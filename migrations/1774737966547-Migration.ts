import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1774737966547 implements MigrationInterface {
    name = 'Migration1774737966547'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."jobseeker_profiles_worksector_enum" AS ENUM('SOFTWARE_DEVELOPMENT', 'DESIGN', 'ACCOUNTING_FINANCE', 'SALES_MARKETING', 'OPERATIONS', 'BUSINESS_ADMIN', 'CUSTOMER_SERVICE', 'HEALTHCARE_PHARMA', 'EDUCATION_TRAINING', 'MEDIA_CREATIVE', 'HR_ADMIN', 'LEGAL_COMPLIANCE', 'CONSTRUCTION_REAL_ESTATE', 'MAINTENANCE_TRADES', 'HOSPITALITY', 'SECURITY', 'TRANSPORT_LOGISTICS', 'AGRICULTURE')`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ADD "workSector" "public"."jobseeker_profiles_worksector_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."skills_category_enum" RENAME TO "skills_category_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."skills_category_enum" AS ENUM('SOFTWARE_DEVELOPMENT', 'DESIGN', 'ACCOUNTING_FINANCE', 'SALES_MARKETING', 'OPERATIONS', 'BUSINESS_ADMIN', 'CUSTOMER_SERVICE', 'HEALTHCARE_PHARMA', 'EDUCATION_TRAINING', 'MEDIA_CREATIVE', 'HR_ADMIN', 'LEGAL_COMPLIANCE', 'CONSTRUCTION_REAL_ESTATE', 'MAINTENANCE_TRADES', 'HOSPITALITY', 'SECURITY', 'TRANSPORT_LOGISTICS', 'AGRICULTURE')`);
        await queryRunner.query(`ALTER TABLE "skills" ALTER COLUMN "category" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "skills" ALTER COLUMN "category" TYPE "public"."skills_category_enum" USING "category"::"text"::"public"."skills_category_enum"`);
        await queryRunner.query(`ALTER TABLE "skills" ALTER COLUMN "category" SET DEFAULT 'SOFTWARE_DEVELOPMENT'`);
        await queryRunner.query(`DROP TYPE "public"."skills_category_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."jobs_category_enum" RENAME TO "jobs_category_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."jobs_category_enum" AS ENUM('SOFTWARE_DEVELOPMENT', 'DESIGN', 'ACCOUNTING_FINANCE', 'SALES_MARKETING', 'OPERATIONS', 'BUSINESS_ADMIN', 'CUSTOMER_SERVICE', 'HEALTHCARE_PHARMA', 'EDUCATION_TRAINING', 'MEDIA_CREATIVE', 'HR_ADMIN', 'LEGAL_COMPLIANCE', 'CONSTRUCTION_REAL_ESTATE', 'MAINTENANCE_TRADES', 'HOSPITALITY', 'SECURITY', 'TRANSPORT_LOGISTICS', 'AGRICULTURE')`);
        await queryRunner.query(`ALTER TABLE "jobs" ALTER COLUMN "category" TYPE "public"."jobs_category_enum" USING "category"::"text"::"public"."jobs_category_enum"`);
        await queryRunner.query(`DROP TYPE "public"."jobs_category_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."jobs_category_enum_old" AS ENUM('BUSINESS', 'COMMUNICATION', 'DATABASE', 'DESIGN', 'FINANCE_ACCOUNTING', 'HOME_SUPPORT', 'HOSPITALITY', 'MAINTENANCE_TRADES', 'OPERATIONS', 'OTHERS', 'SALES_MARKETING', 'SECURITY', 'SOCIAL_MEDIA', 'SOFTWARE_DEVELOPMENT', 'TECHNICAL', 'TRANSPORT_LOGISTICS')`);
        await queryRunner.query(`ALTER TABLE "jobs" ALTER COLUMN "category" TYPE "public"."jobs_category_enum_old" USING "category"::"text"::"public"."jobs_category_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."jobs_category_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."jobs_category_enum_old" RENAME TO "jobs_category_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."skills_category_enum_old" AS ENUM('BUSINESS', 'COMMUNICATION', 'DATABASE', 'DESIGN', 'FINANCE_ACCOUNTING', 'HOME_SUPPORT', 'HOSPITALITY', 'MAINTENANCE_TRADES', 'OPERATIONS', 'OTHERS', 'SALES_MARKETING', 'SECURITY', 'SOCIAL_MEDIA', 'SOFTWARE_DEVELOPMENT', 'TECHNICAL', 'TRANSPORT_LOGISTICS')`);
        await queryRunner.query(`ALTER TABLE "skills" ALTER COLUMN "category" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "skills" ALTER COLUMN "category" TYPE "public"."skills_category_enum_old" USING "category"::"text"::"public"."skills_category_enum_old"`);
        await queryRunner.query(`ALTER TABLE "skills" ALTER COLUMN "category" SET DEFAULT 'OTHERS'`);
        await queryRunner.query(`DROP TYPE "public"."skills_category_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."skills_category_enum_old" RENAME TO "skills_category_enum"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" DROP COLUMN "workSector"`);
        await queryRunner.query(`DROP TYPE "public"."jobseeker_profiles_worksector_enum"`);
    }

}
