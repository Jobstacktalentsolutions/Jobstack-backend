import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1777773376257 implements MigrationInterface {
    name = 'Migration1777773376257'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" DROP COLUMN "yearsOfExperience"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ADD "yearsOfExperience" numeric(4,1) NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" DROP COLUMN "yearsOfExperience"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ADD "yearsOfExperience" integer`);
    }

}
