import { MigrationInterface, QueryRunner } from "typeorm";

export class DropEmploymentFeedbackUnique1777265857347 implements MigrationInterface {
    name = 'DropEmploymentFeedbackUnique1777265857347'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employment_feedback" DROP CONSTRAINT "UQ_32c1026e26700ee2ab105f0ee60"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employment_feedback" ADD CONSTRAINT "UQ_32c1026e26700ee2ab105f0ee60" UNIQUE ("employeeId", "reviewerRole")`);
    }

}
