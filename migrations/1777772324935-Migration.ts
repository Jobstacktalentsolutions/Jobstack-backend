import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1777772324935 implements MigrationInterface {
    name = 'Migration1777772324935'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ADD "lastChangedFields" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" DROP COLUMN "lastChangedFields"`);
    }

}
