import { MigrationInterface, QueryRunner } from "typeorm";

export class InitCoreSchema1791477876792 implements MigrationInterface {
    name = 'InitCoreSchema1791477876792'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "locations" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7cc1c9e3853b94816c094825e74" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "super_admins" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "username" character varying NOT NULL, "password_hash" character varying NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "is_deleted" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_9719b4228e14e28a8253cb108f2" UNIQUE ("email"), CONSTRAINT "UQ_d1e1963352172c0fe368a40e2eb" UNIQUE ("username"), CONSTRAINT "PK_466d3b6370f0695b22d664e9dff" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "admins" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "username" character varying NOT NULL, "password_hash" character varying NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "phone_number" character varying NOT NULL, "address" text NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "is_deleted" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "location_id" integer NOT NULL, "created_by_super_admin_id" integer, CONSTRAINT "UQ_051db7d37d478a69a7432df1479" UNIQUE ("email"), CONSTRAINT "UQ_4ba6d0c734d53f8e1b2e24b6c56" UNIQUE ("username"), CONSTRAINT "PK_e3b38270c97a854c48d2e80874e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "master_data" ("id" SERIAL NOT NULL, "type" character varying NOT NULL, "text" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ed55f1736986cf68b330d92bfee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "admins" ADD CONSTRAINT "FK_e2602bde77d8d32e632da6c475c" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "admins" ADD CONSTRAINT "FK_b4c5be46c04d9d074cc28a72867" FOREIGN KEY ("created_by_super_admin_id") REFERENCES "super_admins"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "admins" DROP CONSTRAINT "FK_b4c5be46c04d9d074cc28a72867"`);
        await queryRunner.query(`ALTER TABLE "admins" DROP CONSTRAINT "FK_e2602bde77d8d32e632da6c475c"`);
        await queryRunner.query(`DROP TABLE "master_data"`);
        await queryRunner.query(`DROP TABLE "admins"`);
        await queryRunner.query(`DROP TABLE "super_admins"`);
        await queryRunner.query(`DROP TABLE "locations"`);
    }

}
