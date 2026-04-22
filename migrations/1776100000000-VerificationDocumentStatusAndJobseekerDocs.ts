import { MigrationInterface, QueryRunner } from 'typeorm';

export class VerificationDocumentStatusAndJobseekerDocs1776100000000
  implements MigrationInterface
{
  name = 'VerificationDocumentStatusAndJobseekerDocs1776100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."verification_document_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."jobseeker_verification_document_kind_enum" AS ENUM('ID_DOCUMENT')`,
    );

    await queryRunner.query(
      `ALTER TABLE "employer_verification_documents" ADD "status" "public"."verification_document_status_enum" NOT NULL DEFAULT 'PENDING'`,
    );
    await queryRunner.query(
      `ALTER TABLE "employer_verification_documents" ADD "rejectionReason" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "employer_verification_documents" ADD "reviewedByAdminId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "employer_verification_documents" ADD "reviewedAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `UPDATE "employer_verification_documents" SET "status" = 'APPROVED' WHERE "verified" = true`,
    );
    await queryRunner.query(
      `UPDATE "employer_verification_documents" SET "status" = 'PENDING' WHERE "verified" = false`,
    );
    await queryRunner.query(
      `ALTER TABLE "employer_verification_documents" DROP COLUMN "verified"`,
    );

    await queryRunner.query(`
            CREATE TABLE "jobseeker_verification_documents" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "jobseekerProfileId" uuid NOT NULL,
                "documentId" uuid NOT NULL,
                "documentKind" "public"."jobseeker_verification_document_kind_enum" NOT NULL,
                "idSubtype" "public"."jobseeker_profiles_iddocumenttype_enum",
                "documentNumber" character varying,
                "status" "public"."verification_document_status_enum" NOT NULL DEFAULT 'PENDING',
                "rejectionReason" character varying,
                "reviewedByAdminId" uuid,
                "reviewedAt" TIMESTAMP,
                CONSTRAINT "PK_jobseeker_verification_documents" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_jobseeker_profile_document_kind" UNIQUE ("jobseekerProfileId", "documentKind"),
                CONSTRAINT "FK_jsvd_profile" FOREIGN KEY ("jobseekerProfileId") REFERENCES "jobseeker_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_jsvd_document" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);

    await queryRunner.query(`
            INSERT INTO "jobseeker_verification_documents" (
                "id",
                "createdAt",
                "updatedAt",
                "jobseekerProfileId",
                "documentId",
                "documentKind",
                "idSubtype",
                "documentNumber",
                "status",
                "rejectionReason",
                "reviewedByAdminId",
                "reviewedAt"
            )
            SELECT
                gen_random_uuid(),
                NOW(),
                NOW(),
                p."id",
                p."idDocumentId",
                'ID_DOCUMENT'::"public"."jobseeker_verification_document_kind_enum",
                p."idDocumentType",
                p."idDocumentNumber",
                CASE
                    WHEN p."idDocumentVerified" = true THEN 'APPROVED'::"public"."verification_document_status_enum"
                    ELSE 'PENDING'::"public"."verification_document_status_enum"
                END,
                NULL,
                p."idDocumentVerifiedByAdminId",
                p."idDocumentVerifiedAt"
            FROM "jobseeker_profiles" p
            WHERE p."idDocumentId" IS NOT NULL
        `);

    await queryRunner.query(
      `ALTER TABLE "jobseeker_profiles" DROP CONSTRAINT "FK_75d595356b80b7acdd33c46aecf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobseeker_profiles" DROP CONSTRAINT "UQ_75d595356b80b7acdd33c46aecf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobseeker_profiles" DROP COLUMN "idDocumentVerifiedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobseeker_profiles" DROP COLUMN "idDocumentVerifiedByAdminId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobseeker_profiles" DROP COLUMN "idDocumentVerified"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobseeker_profiles" DROP COLUMN "idDocumentNumber"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobseeker_profiles" DROP COLUMN "idDocumentType"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobseeker_profiles" DROP COLUMN "idDocumentId"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "jobseeker_profiles" ADD "idDocumentId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobseeker_profiles" ADD CONSTRAINT "UQ_75d595356b80b7acdd33c46aecf" UNIQUE ("idDocumentId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobseeker_profiles" ADD "idDocumentType" "public"."jobseeker_profiles_iddocumenttype_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobseeker_profiles" ADD "idDocumentNumber" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobseeker_profiles" ADD "idDocumentVerified" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobseeker_profiles" ADD "idDocumentVerifiedByAdminId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobseeker_profiles" ADD "idDocumentVerifiedAt" TIMESTAMP`,
    );

    await queryRunner.query(`
            UPDATE "jobseeker_profiles" p
            SET
                "idDocumentId" = v."documentId",
                "idDocumentType" = v."idSubtype",
                "idDocumentNumber" = v."documentNumber",
                "idDocumentVerified" = (v."status" = 'APPROVED'),
                "idDocumentVerifiedByAdminId" = v."reviewedByAdminId",
                "idDocumentVerifiedAt" = v."reviewedAt"
            FROM "jobseeker_verification_documents" v
            WHERE v."jobseekerProfileId" = p."id" AND v."documentKind" = 'ID_DOCUMENT'
        `);

    await queryRunner.query(`DROP TABLE "jobseeker_verification_documents"`);

    await queryRunner.query(
      `ALTER TABLE "employer_verification_documents" ADD "verified" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `UPDATE "employer_verification_documents" SET "verified" = true WHERE "status" = 'APPROVED'`,
    );
    await queryRunner.query(
      `ALTER TABLE "employer_verification_documents" DROP COLUMN "reviewedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employer_verification_documents" DROP COLUMN "reviewedByAdminId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employer_verification_documents" DROP COLUMN "rejectionReason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employer_verification_documents" DROP COLUMN "status"`,
    );

    await queryRunner.query(
      `ALTER TABLE "jobseeker_profiles" ADD CONSTRAINT "FK_75d595356b80b7acdd33c46aecf" FOREIGN KEY ("idDocumentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `DROP TYPE "public"."jobseeker_verification_document_kind_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."verification_document_status_enum"`,
    );
  }
}
