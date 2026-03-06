import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLegalAgreementTemplateTypes1772400000000
  implements MigrationInterface
{
  name = 'AddLegalAgreementTemplateTypes1772400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."contract_templates_type_enum" RENAME TO "contract_templates_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."contract_templates_type_enum" AS ENUM('PERMANENT_EMPLOYMENT', 'FIXED_TERM_CONTRACT', 'FREELANCE_CONTRACT', 'PROBATIONARY_CONTRACT', 'INTERNSHIP_AGREEMENT', 'NON_DISCLOSURE_AGREEMENT', 'NON_COMPETE_AGREEMENT', 'INTELLECTUAL_PROPERTY_ASSIGNMENT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract_templates" ALTER COLUMN "type" TYPE "public"."contract_templates_type_enum" USING "type"::text::"public"."contract_templates_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."contract_templates_type_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."contract_templates_type_enum" RENAME TO "contract_templates_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."contract_templates_type_enum" AS ENUM('PERMANENT_EMPLOYMENT', 'FIXED_TERM_CONTRACT', 'FREELANCE_CONTRACT', 'PROBATIONARY_CONTRACT', 'INTERNSHIP_AGREEMENT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract_templates" ALTER COLUMN "type" TYPE "public"."contract_templates_type_enum" USING "type"::text::"public"."contract_templates_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."contract_templates_type_enum_old"`,
    );
  }
}
