import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1776474282773 implements MigrationInterface {
    name = 'Migration1776474282773'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jobseeker_verification_documents" DROP CONSTRAINT "FK_jsvd_document"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_verification_documents" DROP CONSTRAINT "FK_jsvd_profile"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_verification_documents" DROP CONSTRAINT "UQ_jobseeker_profile_document_kind"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ADD "referenceContacts" jsonb`);
        await queryRunner.query(`ALTER TYPE "public"."jobseeker_verification_document_kind_enum" RENAME TO "jobseeker_verification_document_kind_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."jobseeker_verification_document_kind_enum" AS ENUM('ID_DOCUMENT', 'PROOF_OF_ADDRESS')`);
        await queryRunner.query(`ALTER TABLE "jobseeker_verification_documents" ALTER COLUMN "documentKind" TYPE "public"."jobseeker_verification_document_kind_enum" USING "documentKind"::"text"::"public"."jobseeker_verification_document_kind_enum"`);
        await queryRunner.query(`DROP TYPE "public"."jobseeker_verification_document_kind_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."jobseeker_profiles_iddocumenttype_enum" RENAME TO "jobseeker_profiles_iddocumenttype_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."jobseeker_profiles_iddocumenttype_enum" AS ENUM('NIN', 'PASSPORT', 'DRIVERS_LICENSE', 'VOTERS_CARD')`);
        await queryRunner.query(`ALTER TABLE "jobseeker_verification_documents" ALTER COLUMN "idSubtype" TYPE "public"."jobseeker_profiles_iddocumenttype_enum" USING "idSubtype"::"text"::"public"."jobseeker_profiles_iddocumenttype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."jobseeker_profiles_iddocumenttype_enum_old"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_verification_documents" ADD CONSTRAINT "UQ_90cb442d47847b52f18ad687800" UNIQUE ("jobseekerProfileId", "documentKind")`);
        await queryRunner.query(`ALTER TABLE "jobseeker_verification_documents" ADD CONSTRAINT "FK_422b44a5bf1812129d72e65890b" FOREIGN KEY ("jobseekerProfileId") REFERENCES "jobseeker_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "jobseeker_verification_documents" ADD CONSTRAINT "FK_ece48dcc6ad5e1b54fe70c431fa" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jobseeker_verification_documents" DROP CONSTRAINT "FK_ece48dcc6ad5e1b54fe70c431fa"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_verification_documents" DROP CONSTRAINT "FK_422b44a5bf1812129d72e65890b"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_verification_documents" DROP CONSTRAINT "UQ_90cb442d47847b52f18ad687800"`);
        await queryRunner.query(`CREATE TYPE "public"."jobseeker_profiles_iddocumenttype_enum_old" AS ENUM('NIN', 'PASSPORT', 'VOTERS_CARD')`);
        await queryRunner.query(`ALTER TABLE "jobseeker_verification_documents" ALTER COLUMN "idSubtype" TYPE "public"."jobseeker_profiles_iddocumenttype_enum_old" USING "idSubtype"::"text"::"public"."jobseeker_profiles_iddocumenttype_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."jobseeker_profiles_iddocumenttype_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."jobseeker_profiles_iddocumenttype_enum_old" RENAME TO "jobseeker_profiles_iddocumenttype_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."jobseeker_verification_document_kind_enum_old" AS ENUM('ID_DOCUMENT')`);
        await queryRunner.query(`ALTER TABLE "jobseeker_verification_documents" ALTER COLUMN "documentKind" TYPE "public"."jobseeker_verification_document_kind_enum_old" USING "documentKind"::"text"::"public"."jobseeker_verification_document_kind_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."jobseeker_verification_document_kind_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."jobseeker_verification_document_kind_enum_old" RENAME TO "jobseeker_verification_document_kind_enum"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" DROP COLUMN "referenceContacts"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_verification_documents" ADD CONSTRAINT "UQ_jobseeker_profile_document_kind" UNIQUE ("jobseekerProfileId", "documentKind")`);
        await queryRunner.query(`ALTER TABLE "jobseeker_verification_documents" ADD CONSTRAINT "FK_jsvd_profile" FOREIGN KEY ("jobseekerProfileId") REFERENCES "jobseeker_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "jobseeker_verification_documents" ADD CONSTRAINT "FK_jsvd_document" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
