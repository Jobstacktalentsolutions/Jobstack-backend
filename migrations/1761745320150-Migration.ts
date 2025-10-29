import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1761745320150 implements MigrationInterface {
    name = 'Migration1761745320150'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recruiter_verification" DROP CONSTRAINT "FK_b24b994ac0704a8dafdc8d65409"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_skills" DROP CONSTRAINT "FK_cfa1ce19f08e80c277d7ad98e6c"`);
        await queryRunner.query(`ALTER TABLE "admin_profiles" DROP CONSTRAINT "FK_4cfcbebd8da08da001dcb30fd41"`);
        await queryRunner.query(`CREATE TYPE "public"."recruiter_profiles_type_enum" AS ENUM('Individual', 'Organization')`);
        await queryRunner.query(`CREATE TABLE "recruiter_profiles" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "email" character varying NOT NULL, "phoneNumber" character varying NOT NULL, "profilePictureId" uuid, "address" character varying, "type" "public"."recruiter_profiles_type_enum" NOT NULL, CONSTRAINT "PK_5324ae181a3874c303eb1b5280b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."jobseeker_profiles_approvalstatus_enum" AS ENUM('Pending', 'Approved', 'Rejected')`);
        await queryRunner.query(`CREATE TABLE "jobseeker_profiles" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "email" character varying NOT NULL, "phoneNumber" character varying NOT NULL, "profilePictureUrl" character varying, "address" character varying, "jobTitle" text, "brief" text, "preferredLocation" text, "cvDocumentId" uuid, "approvalStatus" "public"."jobseeker_profiles_approvalstatus_enum" NOT NULL DEFAULT 'Pending', CONSTRAINT "REL_218ec8dab7dec0b8a6a7b031c0" UNIQUE ("cvDocumentId"), CONSTRAINT "PK_3577acdb974129bd25e2eed0502" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "admin_profiles" DROP CONSTRAINT "REL_2492b8ae1f3a6f5e7cfc17ec01"`);
        await queryRunner.query(`ALTER TABLE "admin_profiles" DROP COLUMN "authId"`);
        await queryRunner.query(`ALTER TABLE "admin_profiles" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "recruiter_auth" ADD CONSTRAINT "FK_ffd0f6fa5a5e9e9dd4fd5a2359e" FOREIGN KEY ("id") REFERENCES "recruiter_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recruiter_profiles" ADD CONSTRAINT "FK_20aa0acf4dc34445e3dfd82561a" FOREIGN KEY ("profilePictureId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recruiter_profiles" ADD CONSTRAINT "FK_5324ae181a3874c303eb1b5280b" FOREIGN KEY ("id") REFERENCES "recruiter_auth"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recruiter_verification" ADD CONSTRAINT "FK_b24b994ac0704a8dafdc8d65409" FOREIGN KEY ("recruiterId") REFERENCES "recruiter_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "jobseeker_skills" ADD CONSTRAINT "FK_cfa1ce19f08e80c277d7ad98e6c" FOREIGN KEY ("profileId") REFERENCES "jobseeker_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ADD CONSTRAINT "FK_218ec8dab7dec0b8a6a7b031c06" FOREIGN KEY ("cvDocumentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" ADD CONSTRAINT "FK_3577acdb974129bd25e2eed0502" FOREIGN KEY ("id") REFERENCES "jobseeker_auth"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "jobseeker_auth" ADD CONSTRAINT "FK_322e0ffce63e042a802badf44b5" FOREIGN KEY ("id") REFERENCES "jobseeker_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "admin_profiles" ADD CONSTRAINT "FK_89c52edc2b9c2178f1acd127f3a" FOREIGN KEY ("id") REFERENCES "admin_auth"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "admin_auth" ADD CONSTRAINT "FK_2499fca092b79710867f7e19eab" FOREIGN KEY ("id") REFERENCES "admin_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "admin_auth" DROP CONSTRAINT "FK_2499fca092b79710867f7e19eab"`);
        await queryRunner.query(`ALTER TABLE "admin_profiles" DROP CONSTRAINT "FK_89c52edc2b9c2178f1acd127f3a"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_auth" DROP CONSTRAINT "FK_322e0ffce63e042a802badf44b5"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" DROP CONSTRAINT "FK_3577acdb974129bd25e2eed0502"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_profiles" DROP CONSTRAINT "FK_218ec8dab7dec0b8a6a7b031c06"`);
        await queryRunner.query(`ALTER TABLE "jobseeker_skills" DROP CONSTRAINT "FK_cfa1ce19f08e80c277d7ad98e6c"`);
        await queryRunner.query(`ALTER TABLE "recruiter_verification" DROP CONSTRAINT "FK_b24b994ac0704a8dafdc8d65409"`);
        await queryRunner.query(`ALTER TABLE "recruiter_profiles" DROP CONSTRAINT "FK_5324ae181a3874c303eb1b5280b"`);
        await queryRunner.query(`ALTER TABLE "recruiter_profiles" DROP CONSTRAINT "FK_20aa0acf4dc34445e3dfd82561a"`);
        await queryRunner.query(`ALTER TABLE "recruiter_auth" DROP CONSTRAINT "FK_ffd0f6fa5a5e9e9dd4fd5a2359e"`);
        await queryRunner.query(`ALTER TABLE "admin_profiles" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "admin_profiles" ADD "authId" uuid`);
        await queryRunner.query(`ALTER TABLE "admin_profiles" ADD CONSTRAINT "REL_2492b8ae1f3a6f5e7cfc17ec01" UNIQUE ("authId")`);
        await queryRunner.query(`DROP TABLE "jobseeker_profiles"`);
        await queryRunner.query(`DROP TYPE "public"."jobseeker_profiles_approvalstatus_enum"`);
        await queryRunner.query(`DROP TABLE "recruiter_profiles"`);
        await queryRunner.query(`DROP TYPE "public"."recruiter_profiles_type_enum"`);
        await queryRunner.query(`ALTER TABLE "admin_profiles" ADD CONSTRAINT "FK_4cfcbebd8da08da001dcb30fd41" FOREIGN KEY ("authId") REFERENCES "admin_auth"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "jobseeker_skills" ADD CONSTRAINT "FK_cfa1ce19f08e80c277d7ad98e6c" FOREIGN KEY ("profileId") REFERENCES "job_seeker_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recruiter_verification" ADD CONSTRAINT "FK_b24b994ac0704a8dafdc8d65409" FOREIGN KEY ("recruiterId") REFERENCES "recruiter"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
