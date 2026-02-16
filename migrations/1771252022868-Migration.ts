import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1771252022868 implements MigrationInterface {
    name = 'Migration1771252022868'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."contract_templates_type_enum" AS ENUM('PERMANENT_EMPLOYMENT', 'FIXED_TERM_CONTRACT', 'FREELANCE_CONTRACT', 'PROBATIONARY_CONTRACT', 'INTERNSHIP_AGREEMENT')`);
        await queryRunner.query(`CREATE TABLE "contract_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "description" text NOT NULL, "type" "public"."contract_templates_type_enum" NOT NULL, "templatePath" character varying NOT NULL, "requiredVariables" text NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "displayOrder" integer NOT NULL DEFAULT '0', "version" character varying NOT NULL DEFAULT '1.0', "exampleData" jsonb, CONSTRAINT "UQ_71fde319014b379c22ed301d560" UNIQUE ("name"), CONSTRAINT "PK_59af2fd9eadd293fe10fdb2c702" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."contracts_status_enum" AS ENUM('PENDING_SIGNATURES', 'EMPLOYER_SIGNED', 'EMPLOYEE_SIGNED', 'FULLY_EXECUTED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "contracts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "employeeId" uuid NOT NULL, "templateId" uuid, "contractDocumentId" uuid, "templateVersion" character varying, "status" "public"."contracts_status_enum" NOT NULL DEFAULT 'PENDING_SIGNATURES', "employerSignedAt" TIMESTAMP, "employerSignatureIp" character varying, "employerSignedById" uuid, "employeeSignedAt" TIMESTAMP, "employeeSignatureIp" character varying, "employeeSignedById" uuid, "metadata" jsonb, "notes" text, CONSTRAINT "REL_508472bf3f7c391fba374c09be" UNIQUE ("contractDocumentId"), CONSTRAINT "PK_2c7b8f3a7b1acdd49497d83d0fb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "contracts" ADD CONSTRAINT "FK_3681f79a2d6a77debddbfaad4e9" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contracts" ADD CONSTRAINT "FK_977cdac97a6522d9defb8ad8f2e" FOREIGN KEY ("templateId") REFERENCES "contract_templates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contracts" ADD CONSTRAINT "FK_508472bf3f7c391fba374c09be8" FOREIGN KEY ("contractDocumentId") REFERENCES "documents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contracts" DROP CONSTRAINT "FK_508472bf3f7c391fba374c09be8"`);
        await queryRunner.query(`ALTER TABLE "contracts" DROP CONSTRAINT "FK_977cdac97a6522d9defb8ad8f2e"`);
        await queryRunner.query(`ALTER TABLE "contracts" DROP CONSTRAINT "FK_3681f79a2d6a77debddbfaad4e9"`);
        await queryRunner.query(`DROP TABLE "contracts"`);
        await queryRunner.query(`DROP TYPE "public"."contracts_status_enum"`);
        await queryRunner.query(`DROP TABLE "contract_templates"`);
        await queryRunner.query(`DROP TYPE "public"."contract_templates_type_enum"`);
    }

}
