import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1777769491759 implements MigrationInterface {
    name = 'Migration1777769491759'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ALTER COLUMN "industry" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "jobs" ALTER COLUMN "industry" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" ALTER COLUMN "industry" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employer_profiles" ALTER COLUMN "industry" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "jobs" ALTER COLUMN "industry" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ALTER COLUMN "industry" DROP NOT NULL`);
    }

}
