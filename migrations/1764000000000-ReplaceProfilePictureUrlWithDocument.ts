import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReplaceProfilePictureUrlWithDocument1764000000000
  implements MigrationInterface
{
  name = 'ReplaceProfilePictureUrlWithDocument1764000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add profilePictureId column
    await queryRunner.query(
      `ALTER TABLE "jobseeker_profiles" ADD "profilePictureId" uuid`,
    );

    // Add foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "jobseeker_profiles" ADD CONSTRAINT "FK_jobseeker_profiles_profilePictureId" FOREIGN KEY ("profilePictureId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // Drop profilePictureUrl column
    await queryRunner.query(
      `ALTER TABLE "jobseeker_profiles" DROP COLUMN IF EXISTS "profilePictureUrl"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add profilePictureUrl column back
    await queryRunner.query(
      `ALTER TABLE "jobseeker_profiles" ADD "profilePictureUrl" character varying`,
    );

    // Drop foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "jobseeker_profiles" DROP CONSTRAINT IF EXISTS "FK_jobseeker_profiles_profilePictureId"`,
    );

    // Drop profilePictureId column
    await queryRunner.query(
      `ALTER TABLE "jobseeker_profiles" DROP COLUMN IF EXISTS "profilePictureId"`,
    );
  }
}
