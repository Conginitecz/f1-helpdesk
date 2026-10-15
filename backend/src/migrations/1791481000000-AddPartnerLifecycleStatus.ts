import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPartnerLifecycleStatus1791481000000 implements MigrationInterface {
  name = 'AddPartnerLifecycleStatus1791481000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "partners" ADD "lifecycle_status" character varying',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "partners" DROP COLUMN "lifecycle_status"',
    );
  }
}
