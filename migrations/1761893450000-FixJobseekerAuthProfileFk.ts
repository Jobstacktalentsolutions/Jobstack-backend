import { MigrationInterface, QueryRunner } from "typeorm";

export class FixJobseekerAuthProfileFk1761893450000 implements MigrationInterface {
  name = 'FixJobseekerAuthProfileFk1761893450000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop incorrect FK where jobseeker_auth.id references jobseeker_profiles.id
    await queryRunner.query(
      `ALTER TABLE "jobseeker_auth" DROP CONSTRAINT IF EXISTS "FK_322e0ffce63e042a802badf44b5"`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate the dropped FK only if needed (not recommended). Keeping down empty to avoid reintroducing bad schema.
  }
}