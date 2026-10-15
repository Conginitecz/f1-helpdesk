import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStatusRequestModelFoundation1791482000000 implements MigrationInterface {
  name = 'AddStatusRequestModelFoundation1791482000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "status_change_requests" ADD "request_type" character varying',
    );
    await queryRunner.query(
      'ALTER TABLE "status_change_requests" ADD "reason" character varying',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_status_requests_pending_target_type" ON "status_change_requests" ("entity_type", "entity_id", "request_type") WHERE "status" = \'pending\' AND "request_type" IS NOT NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX "UQ_status_requests_pending_target_type"',
    );
    await queryRunner.query(
      'ALTER TABLE "status_change_requests" DROP COLUMN "reason"',
    );
    await queryRunner.query(
      'ALTER TABLE "status_change_requests" DROP COLUMN "request_type"',
    );
  }
}
