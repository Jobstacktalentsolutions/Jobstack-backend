import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1768643604868 implements MigrationInterface {
    name = 'Migration1768643604868'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "admin_auth" ADD "suspended" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "admin_auth" ADD "suspendedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "admin_auth" ADD "suspensionReason" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "admin_auth" DROP COLUMN "suspensionReason"`);
        await queryRunner.query(`ALTER TABLE "admin_auth" DROP COLUMN "suspendedAt"`);
        await queryRunner.query(`ALTER TABLE "admin_auth" DROP COLUMN "suspended"`);
    }

}
