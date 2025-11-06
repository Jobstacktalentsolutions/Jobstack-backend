import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSmeRecruiterType1762439378790 implements MigrationInterface {
    name = 'AddSmeRecruiterType1762439378790'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recruiter_auth" DROP CONSTRAINT "FK_ffd0f6fa5a5e9e9dd4fd5a2359e"`);
        await queryRunner.query(`ALTER TABLE "admin_auth" DROP CONSTRAINT "FK_2499fca092b79710867f7e19eab"`);
        await queryRunner.query(`ALTER TYPE "public"."recruiter_profiles_type_enum" RENAME TO "recruiter_profiles_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."recruiter_profiles_type_enum" AS ENUM('Individual', 'SME', 'Organization')`);
        await queryRunner.query(`ALTER TABLE "recruiter_profiles" ALTER COLUMN "type" TYPE "public"."recruiter_profiles_type_enum" USING "type"::"text"::"public"."recruiter_profiles_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."recruiter_profiles_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "recruiter_profiles" ALTER COLUMN "type" DROP NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."recruiter_verification_documents_documenttype_enum" RENAME TO "recruiter_verification_documents_documenttype_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."recruiter_verification_documents_documenttype_enum" AS ENUM('NATIONAL_ID', 'INTERNATIONAL_PASSPORT', 'PROOF_OF_ADDRESS', 'GUARANTOR_DETAILS', 'SERVICE_AGREEMENT', 'PAYMENT_METHOD', 'BUSINESS_REGISTRATION', 'COMPANY_ID', 'TAX_IDENTIFICATION', 'CORPORATE_PAYMENT_DETAILS', 'CERTIFICATE_OF_INCORPORATION', 'CORPORATE_PROFILE', 'AUTHORIZATION_LETTER', 'CORPORATE_ACCOUNT_DETAILS')`);
        await queryRunner.query(`ALTER TABLE "recruiter_verification_documents" ALTER COLUMN "documentType" TYPE "public"."recruiter_verification_documents_documenttype_enum" USING "documentType"::"text"::"public"."recruiter_verification_documents_documenttype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."recruiter_verification_documents_documenttype_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."recruiter_verification_documents_documenttype_enum_old" AS ENUM('NATIONAL_ID', 'DRIVERS_LICENSE', 'PASSPORT', 'VOTERS_CARD', 'UTILITY_BILL', 'TENANCY_AGREEMENT', 'CAC_RC', 'CAC_BN', 'CAC_IT', 'CAC_LP')`);
        await queryRunner.query(`ALTER TABLE "recruiter_verification_documents" ALTER COLUMN "documentType" TYPE "public"."recruiter_verification_documents_documenttype_enum_old" USING "documentType"::"text"::"public"."recruiter_verification_documents_documenttype_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."recruiter_verification_documents_documenttype_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."recruiter_verification_documents_documenttype_enum_old" RENAME TO "recruiter_verification_documents_documenttype_enum"`);
        await queryRunner.query(`ALTER TABLE "recruiter_profiles" ALTER COLUMN "type" SET NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."recruiter_profiles_type_enum_old" AS ENUM('Individual', 'Organization')`);
        await queryRunner.query(`ALTER TABLE "recruiter_profiles" ALTER COLUMN "type" TYPE "public"."recruiter_profiles_type_enum_old" USING "type"::"text"::"public"."recruiter_profiles_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."recruiter_profiles_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."recruiter_profiles_type_enum_old" RENAME TO "recruiter_profiles_type_enum"`);
        await queryRunner.query(`ALTER TABLE "admin_auth" ADD CONSTRAINT "FK_2499fca092b79710867f7e19eab" FOREIGN KEY ("id") REFERENCES "admin_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recruiter_auth" ADD CONSTRAINT "FK_ffd0f6fa5a5e9e9dd4fd5a2359e" FOREIGN KEY ("id") REFERENCES "recruiter_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
