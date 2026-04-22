import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1775533874362 implements MigrationInterface {
    name = 'Migration1775533874362'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "system_configs" DROP CONSTRAINT "FK_c68ce5afbd6b6b40fe077e7d729"`);
        await queryRunner.query(`ALTER TABLE "system_configs" ADD CONSTRAINT "FK_c68ce5afbd6b6b40fe077e7d729" FOREIGN KEY ("updatedBy") REFERENCES "admin_auth"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "system_configs" DROP CONSTRAINT "FK_c68ce5afbd6b6b40fe077e7d729"`);
        await queryRunner.query(`ALTER TABLE "system_configs" ADD CONSTRAINT "FK_c68ce5afbd6b6b40fe077e7d729" FOREIGN KEY ("updatedBy") REFERENCES "admin_auth"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
