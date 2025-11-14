import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSalaryFieldsToJobseekerProfile1763146137732
  implements MigrationInterface
{
  name = 'AddSalaryFieldsToJobseekerProfile1763146137732';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "jobseeker_profiles" ADD "minExpectedSalary" numeric(12,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobseeker_profiles" ADD "maxExpectedSalary" numeric(12,2)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "jobseeker_profiles" DROP COLUMN "maxExpectedSalary"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobseeker_profiles" DROP COLUMN "minExpectedSalary"`,
    );
  }
}
