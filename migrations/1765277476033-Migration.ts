import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1765277476033 implements MigrationInterface {
    name = 'Migration1765277476033'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."jobseeker_profiles_preferredemploymenttype_enum" AS ENUM('FULL_TIME', 'PART_TIME')`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ADD "preferredEmploymentType" "public"."jobseeker_profiles_preferredemploymenttype_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."jobseeker_profiles_preferredworkmode_enum" AS ENUM('REMOTE', 'HYBRID', 'ON_SITE')`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ADD "preferredWorkMode" "public"."jobseeker_profiles_preferredworkmode_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."jobseeker_profiles_preferredemploymentarrangement_enum" AS ENUM('PERMANENT_EMPLOYEE', 'CONTRACT')`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ADD "preferredEmploymentArrangement" "public"."jobseeker_profiles_preferredemploymentarrangement_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."jobs_category_enum" RENAME TO "jobs_category_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."jobs_category_enum" AS ENUM('TECHNICAL', 'DATABASE', 'BUSINESS', 'DESIGN', 'FINANCE_ACCOUNTING', 'SALES_MARKETING', 'OPERATIONS', 'COMMUNICATION', 'SOCIAL_MEDIA', 'SOFTWARE_DEVELOPMENT', 'HOME_SUPPORT', 'MAINTENANCE_TRADES', 'HOSPITALITY', 'SECURITY', 'TRANSPORT_LOGISTICS', 'OTHERS')`);
        await queryRunner.query(`ALTER TABLE "jobs" ALTER COLUMN "category" TYPE "public"."jobs_category_enum" USING "category"::"text"::"public"."jobs_category_enum"`);
        await queryRunner.query(`DROP TYPE "public"."jobs_category_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."jobs_category_enum_old" AS ENUM('TECHNOLOGY', 'BUSINESS', 'OPERATIONS', 'DESIGN', 'MARKETING', 'FINANCE', 'CUSTOMER_SERVICE', 'HOME_SERVICES', 'MAINTENANCE', 'HOSPITALITY', 'SECURITY', 'TRANSPORT')`);
        await queryRunner.query(`ALTER TABLE "jobs" ALTER COLUMN "category" TYPE "public"."jobs_category_enum_old" USING "category"::"text"::"public"."jobs_category_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."jobs_category_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."jobs_category_enum_old" RENAME TO "jobs_category_enum"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" DROP COLUMN "preferredEmploymentArrangement"`);
        await queryRunner.query(`DROP TYPE "public"."jobseeker_profiles_preferredemploymentarrangement_enum"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" DROP COLUMN "preferredWorkMode"`);
        await queryRunner.query(`DROP TYPE "public"."jobseeker_profiles_preferredworkmode_enum"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" DROP COLUMN "preferredEmploymentType"`);
        await queryRunner.query(`DROP TYPE "public"."jobseeker_profiles_preferredemploymenttype_enum"`);
    }

}
