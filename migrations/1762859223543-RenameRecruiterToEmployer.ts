import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameRecruiterToEmployer1762859223543
  implements MigrationInterface
{
  name = 'RenameRecruiterToEmployer1762859223543';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename enum types first
    await queryRunner.query(
      `ALTER TYPE "public"."recruiter_profiles_type_enum" RENAME TO "employer_profiles_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."recruiter_verification_documents_documenttype_enum" RENAME TO "employer_verification_documents_documenttype_enum"`,
    );

    // Rename tables
    await queryRunner.query(
      `ALTER TABLE "recruiter_auth" RENAME TO "employer_auth"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recruiter_profiles" RENAME TO "employer_profiles"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recruiter_sessions" RENAME TO "employer_sessions"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recruiter_verification" RENAME TO "employer_verification"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recruiter_verification_documents" RENAME TO "employer_verification_documents"`,
    );

    // Rename foreign key columns in employer_verification table
    await queryRunner.query(
      `ALTER TABLE "employer_verification" RENAME COLUMN "recruiterId" TO "employerId"`,
    );

    // Note: employer_verification_documents table does not have recruiterId column
    // It only has verificationId column

    // Rename foreign key columns in employer_sessions table
    await queryRunner.query(
      `ALTER TABLE "employer_sessions" RENAME COLUMN "recruiterId" TO "employerId"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rename foreign key columns back in employer_sessions table
    await queryRunner.query(
      `ALTER TABLE "employer_sessions" RENAME COLUMN "employerId" TO "recruiterId"`,
    );

    // Note: employer_verification_documents table does not have employerId column
    // It only has verificationId column

    // Rename foreign key columns back in employer_verification table
    await queryRunner.query(
      `ALTER TABLE "employer_verification" RENAME COLUMN "employerId" TO "recruiterId"`,
    );

    // Rename tables back
    await queryRunner.query(
      `ALTER TABLE "employer_verification_documents" RENAME TO "recruiter_verification_documents"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employer_verification" RENAME TO "recruiter_verification"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employer_sessions" RENAME TO "recruiter_sessions"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employer_profiles" RENAME TO "recruiter_profiles"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employer_auth" RENAME TO "recruiter_auth"`,
    );

    // Rename enum types back
    await queryRunner.query(
      `ALTER TYPE "public"."employer_verification_documents_documenttype_enum" RENAME TO "recruiter_verification_documents_documenttype_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."employer_profiles_type_enum" RENAME TO "recruiter_profiles_type_enum"`,
    );
  }
}
