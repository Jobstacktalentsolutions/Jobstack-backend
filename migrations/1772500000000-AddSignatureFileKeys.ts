import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSignatureFileKeys1772500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "employerSignatureFileKey" varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "employeeSignatureFileKey" varchar`,
    );
    await queryRunner.query(
      `ALTER TYPE "document_type_enum" ADD VALUE IF NOT EXISTS 'SIGNATURE'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "contracts" DROP COLUMN IF EXISTS "employerSignatureFileKey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contracts" DROP COLUMN IF EXISTS "employeeSignatureFileKey"`,
    );
  }
}
