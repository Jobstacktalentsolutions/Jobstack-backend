import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1775875364105 implements MigrationInterface {
    name = 'Migration1775875364105'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "system_configs" DROP CONSTRAINT "FK_c68ce5afbd6b6b40fe077e7d729"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ADD "idDocumentId" uuid`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ADD CONSTRAINT "UQ_75d595356b80b7acdd33c46aecf" UNIQUE ("idDocumentId")`);
        await queryRunner.query(`CREATE TYPE "public"."jobseeker_profiles_iddocumenttype_enum" AS ENUM('NIN', 'PASSPORT', 'VOTERS_CARD')`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ADD "idDocumentType" "public"."jobseeker_profiles_iddocumenttype_enum"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ADD "idDocumentNumber" character varying`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ADD "idDocumentVerified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ADD "idDocumentVerifiedByAdminId" uuid`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ADD "idDocumentVerifiedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ADD "approvalRejectionReason" character varying`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ADD "approvalReviewedByAdminId" uuid`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ADD "approvalReviewedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "system_configs" ADD CONSTRAINT "FK_c68ce5afbd6b6b40fe077e7d729" FOREIGN KEY ("updatedBy") REFERENCES "admin_auth"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ADD CONSTRAINT "FK_75d595356b80b7acdd33c46aecf" FOREIGN KEY ("idDocumentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" DROP CONSTRAINT "FK_75d595356b80b7acdd33c46aecf"`);
        await queryRunner.query(`ALTER TABLE "system_configs" DROP CONSTRAINT "FK_c68ce5afbd6b6b40fe077e7d729"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" DROP COLUMN "approvalReviewedAt"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" DROP COLUMN "approvalReviewedByAdminId"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" DROP COLUMN "approvalRejectionReason"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" DROP COLUMN "idDocumentVerifiedAt"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" DROP COLUMN "idDocumentVerifiedByAdminId"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" DROP COLUMN "idDocumentVerified"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" DROP COLUMN "idDocumentNumber"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" DROP COLUMN "idDocumentType"`);
        await queryRunner.query(`DROP TYPE "public"."jobseeker_profiles_iddocumenttype_enum"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" DROP CONSTRAINT "UQ_75d595356b80b7acdd33c46aecf"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" DROP COLUMN "idDocumentId"`);
        await queryRunner.query(`ALTER TABLE "system_configs" ADD CONSTRAINT "FK_c68ce5afbd6b6b40fe077e7d729" FOREIGN KEY ("updatedBy") REFERENCES "admin_auth"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
