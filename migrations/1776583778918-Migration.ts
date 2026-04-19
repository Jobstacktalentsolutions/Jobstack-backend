import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1776583778918 implements MigrationInterface {
    name = 'Migration1776583778918'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employer_verification_documents" DROP CONSTRAINT "FK_872b4440183a370510a11101bd0"`);
        await queryRunner.query(`ALTER TABLE "employer_verification_documents" RENAME COLUMN "verificationId" TO "employerProfileId"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ADD "dateOfBirth" date`);
        await queryRunner.query(`CREATE TYPE "public"."jobseeker_profiles_gender_enum" AS ENUM('MALE', 'FEMALE')`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ADD "gender" "public"."jobseeker_profiles_gender_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."jobseeker_profiles_availability_enum" AS ENUM('IMMEDIATE', 'NOTICE_PERIOD')`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ADD "availability" "public"."jobseeker_profiles_availability_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."employer_profiles_gender_enum" AS ENUM('MALE', 'FEMALE', 'OTHER')`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" ADD "gender" "public"."employer_profiles_gender_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."employer_profiles_industry_enum" AS ENUM('SOFTWARE_DEVELOPMENT', 'DESIGN', 'ACCOUNTING_FINANCE', 'SALES_MARKETING', 'OPERATIONS', 'BUSINESS_ADMIN', 'CUSTOMER_SERVICE', 'HEALTHCARE_PHARMA', 'EDUCATION_TRAINING', 'MEDIA_CREATIVE', 'HR_ADMIN', 'LEGAL_COMPLIANCE', 'CONSTRUCTION_REAL_ESTATE', 'MAINTENANCE_TRADES', 'HOSPITALITY', 'SECURITY', 'TRANSPORT_LOGISTICS', 'AGRICULTURE')`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" ADD "industry" "public"."employer_profiles_industry_enum"`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" ADD "contactPersonName" character varying`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" ADD "contactPersonJobTitle" character varying`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" ADD "workEmail" character varying`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" ADD "businessAddress" character varying`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" ADD "registeredBusinessAddress" character varying`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" ADD "declarationAccepted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`CREATE TYPE "public"."employer_profiles_governmentidtype_enum" AS ENUM('NIN_SLIP', 'INTERNATIONAL_PASSPORT', 'VOTERS_CARD')`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" ADD "governmentIdType" "public"."employer_profiles_governmentidtype_enum"`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" ADD "companyName" character varying`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" ADD "companyAddress" character varying`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" ADD "companyWebsite" character varying`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" ADD "companyDescription" character varying`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" ADD "state" character varying`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" ADD "city" character varying`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" ADD "companySize" character varying`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" ADD "socialOrWebsiteUrl" character varying`);
        await queryRunner.query(`CREATE TYPE "public"."employer_profiles_verificationstatus_enum" AS ENUM('NOT_STARTED', 'PENDING', 'APPROVED', 'REJECTED')`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" ADD "verificationStatus" "public"."employer_profiles_verificationstatus_enum" NOT NULL DEFAULT 'NOT_STARTED'`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" ADD "reviewedByAdminId" uuid`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" ADD "reviewedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" ADD "verificationRejectionReason" character varying`);
        await queryRunner.query(`ALTER TYPE "public"."employer_verification_documents_documenttype_enum" RENAME TO "employer_verification_documents_documenttype_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."employer_verification_documents_documenttype_enum" AS ENUM('GOVERNMENT_ISSUED_ID', 'UTILITY_BILL', 'CAC_REGISTRATION_CERTIFICATE', 'OWNER_GOVERNMENT_ID', 'DIRECTOR_GOVERNMENT_ID', 'SIGNED_LEGITIMATE_BUSINESS_DECLARATION')`);
        await queryRunner.query(`ALTER TABLE "employer_verification_documents" ALTER COLUMN "documentType" TYPE "public"."employer_verification_documents_documenttype_enum" USING "documentType"::"text"::"public"."employer_verification_documents_documenttype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."employer_verification_documents_documenttype_enum_old"`);
        await queryRunner.query(`ALTER TABLE "employer_verification_documents" ADD CONSTRAINT "FK_deb8effae6b194e22ca1693806d" FOREIGN KEY ("employerProfileId") REFERENCES "employer_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employer_verification_documents" DROP CONSTRAINT "FK_deb8effae6b194e22ca1693806d"`);
        await queryRunner.query(`CREATE TYPE "public"."employer_verification_documents_documenttype_enum_old" AS ENUM('AUTHORIZATION_LETTER', 'BUSINESS_REGISTRATION', 'CERTIFICATE_OF_INCORPORATION', 'COMPANY_ID', 'CORPORATE_ACCOUNT_DETAILS', 'CORPORATE_PAYMENT_DETAILS', 'CORPORATE_PROFILE', 'GUARANTOR_DETAILS', 'INTERNATIONAL_PASSPORT', 'NATIONAL_ID', 'PAYMENT_METHOD', 'PROOF_OF_ADDRESS', 'SERVICE_AGREEMENT', 'TAX_IDENTIFICATION')`);
        await queryRunner.query(`ALTER TABLE "employer_verification_documents" ALTER COLUMN "documentType" TYPE "public"."employer_verification_documents_documenttype_enum_old" USING "documentType"::"text"::"public"."employer_verification_documents_documenttype_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."employer_verification_documents_documenttype_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."employer_verification_documents_documenttype_enum_old" RENAME TO "employer_verification_documents_documenttype_enum"`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" DROP COLUMN "verificationRejectionReason"`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" DROP COLUMN "reviewedAt"`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" DROP COLUMN "reviewedByAdminId"`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" DROP COLUMN "verificationStatus"`);
        await queryRunner.query(`DROP TYPE "public"."employer_profiles_verificationstatus_enum"`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" DROP COLUMN "socialOrWebsiteUrl"`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" DROP COLUMN "companySize"`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" DROP COLUMN "city"`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" DROP COLUMN "state"`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" DROP COLUMN "companyDescription"`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" DROP COLUMN "companyWebsite"`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" DROP COLUMN "companyAddress"`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" DROP COLUMN "companyName"`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" DROP COLUMN "governmentIdType"`);
        await queryRunner.query(`DROP TYPE "public"."employer_profiles_governmentidtype_enum"`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" DROP COLUMN "declarationAccepted"`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" DROP COLUMN "registeredBusinessAddress"`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" DROP COLUMN "businessAddress"`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" DROP COLUMN "workEmail"`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" DROP COLUMN "contactPersonJobTitle"`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" DROP COLUMN "contactPersonName"`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" DROP COLUMN "industry"`);
        await queryRunner.query(`DROP TYPE "public"."employer_profiles_industry_enum"`);
        await queryRunner.query(`ALTER TABLE "employer_profiles" DROP COLUMN "gender"`);
        await queryRunner.query(`DROP TYPE "public"."employer_profiles_gender_enum"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" DROP COLUMN "availability"`);
        await queryRunner.query(`DROP TYPE "public"."jobseeker_profiles_availability_enum"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" DROP COLUMN "gender"`);
        await queryRunner.query(`DROP TYPE "public"."jobseeker_profiles_gender_enum"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" DROP COLUMN "dateOfBirth"`);
        await queryRunner.query(`ALTER TABLE "employer_verification_documents" RENAME COLUMN "employerProfileId" TO "verificationId"`);
        await queryRunner.query(`ALTER TABLE "employer_verification_documents" ADD CONSTRAINT "FK_872b4440183a370510a11101bd0" FOREIGN KEY ("verificationId") REFERENCES "employer_verification"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
