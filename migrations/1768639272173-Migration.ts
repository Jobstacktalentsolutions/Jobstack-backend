import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1768639272173 implements MigrationInterface {
    name = 'Migration1768639272173'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "skills" ADD "subcategory" character varying`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "subcategory" character varying`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "performCustomScreening" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TYPE "public"."skills_category_enum" RENAME TO "skills_category_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."skills_category_enum" AS ENUM('HIGH_SKILL', 'LOW_SKILL')`);
        await queryRunner.query(`ALTER TABLE "skills" ALTER COLUMN "category" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "skills" ALTER COLUMN "category" TYPE "public"."skills_category_enum" USING "category"::"text"::"public"."skills_category_enum"`);
        await queryRunner.query(`ALTER TABLE "skills" ALTER COLUMN "category" SET DEFAULT 'LOW_SKILL'`);
        await queryRunner.query(`DROP TYPE "public"."skills_category_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."jobs_category_enum" RENAME TO "jobs_category_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."jobs_category_enum" AS ENUM('HIGH_SKILL', 'LOW_SKILL')`);
        await queryRunner.query(`ALTER TABLE "jobs" ALTER COLUMN "category" TYPE "public"."jobs_category_enum" USING "category"::"text"::"public"."jobs_category_enum"`);
        await queryRunner.query(`DROP TYPE "public"."jobs_category_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."jobs_category_enum_old" AS ENUM('TECHNICAL', 'DATABASE', 'BUSINESS', 'DESIGN', 'FINANCE_ACCOUNTING', 'SALES_MARKETING', 'OPERATIONS', 'COMMUNICATION', 'SOCIAL_MEDIA', 'SOFTWARE_DEVELOPMENT', 'HOME_SUPPORT', 'MAINTENANCE_TRADES', 'HOSPITALITY', 'SECURITY', 'TRANSPORT_LOGISTICS', 'OTHERS')`);
        await queryRunner.query(`ALTER TABLE "jobs" ALTER COLUMN "category" TYPE "public"."jobs_category_enum_old" USING "category"::"text"::"public"."jobs_category_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."jobs_category_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."jobs_category_enum_old" RENAME TO "jobs_category_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."skills_category_enum_old" AS ENUM('TECHNICAL', 'DATABASE', 'BUSINESS', 'DESIGN', 'FINANCE_ACCOUNTING', 'SALES_MARKETING', 'OPERATIONS', 'COMMUNICATION', 'SOCIAL_MEDIA', 'SOFTWARE_DEVELOPMENT', 'HOME_SUPPORT', 'MAINTENANCE_TRADES', 'HOSPITALITY', 'SECURITY', 'TRANSPORT_LOGISTICS', 'OTHERS')`);
        await queryRunner.query(`ALTER TABLE "skills" ALTER COLUMN "category" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "skills" ALTER COLUMN "category" TYPE "public"."skills_category_enum_old" USING "category"::"text"::"public"."skills_category_enum_old"`);
        await queryRunner.query(`ALTER TABLE "skills" ALTER COLUMN "category" SET DEFAULT 'OTHERS'`);
        await queryRunner.query(`DROP TYPE "public"."skills_category_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."skills_category_enum_old" RENAME TO "skills_category_enum"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "performCustomScreening"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "subcategory"`);
        await queryRunner.query(`ALTER TABLE "skills" DROP COLUMN "subcategory"`);
    }

}
