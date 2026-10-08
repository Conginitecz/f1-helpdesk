import { MigrationInterface, QueryRunner } from "typeorm";

export class M4PartnerInventory1791479985733 implements MigrationInterface {
    name = 'M4PartnerInventory1791479985733'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "configurations" ("id" SERIAL NOT NULL, "config_key" character varying NOT NULL, "config_value" character varying NOT NULL, "description" character varying, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_super_admin_id" integer, CONSTRAINT "UQ_6097f4eebe65f95387e87e525a8" UNIQUE ("config_key"), CONSTRAINT "PK_ef9fc29709cc5fc66610fc6a664" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "inventory_items" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "units" integer NOT NULL DEFAULT '0', "price_per_unit" numeric(10,2) NOT NULL, "tax_applicable" boolean NOT NULL DEFAULT false, "tax_percentage" numeric(5,2), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "type_id" integer, "category_id" integer, "location_id" integer NOT NULL, "created_by_admin_id" integer, "created_by_super_admin_id" integer, CONSTRAINT "PK_cf2f451407242e132547ac19169" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "status_change_requests" ("id" SERIAL NOT NULL, "entity_type" character varying NOT NULL, "entity_id" integer NOT NULL, "requested_action" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "resolved_at" TIMESTAMP, "requested_by_admin_id" integer NOT NULL, "resolved_by_super_admin_id" integer, CONSTRAINT "PK_f9d2ca860c79d6196574f01b084" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "partners" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "phone_number" character varying NOT NULL, "email" character varying, "address" text, "reference_id" integer, "is_active" boolean NOT NULL DEFAULT true, "is_deleted" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "partner_type_id" integer NOT NULL, "skill_id" integer, "category_id" integer, "reference_type_id" integer, "created_by_admin_id" integer NOT NULL, CONSTRAINT "PK_998645b20820e4ab99aeae03b41" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "configurations" ADD CONSTRAINT "FK_19f493859dc0c17ca1785832090" FOREIGN KEY ("updated_by_super_admin_id") REFERENCES "super_admins"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_items" ADD CONSTRAINT "FK_d415cd69df0a02b5b9c1de5e624" FOREIGN KEY ("type_id") REFERENCES "master_data"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_items" ADD CONSTRAINT "FK_934d5a332b6870c7bb95643ab41" FOREIGN KEY ("category_id") REFERENCES "master_data"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_items" ADD CONSTRAINT "FK_45ed0784af22d38041d680da269" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_items" ADD CONSTRAINT "FK_617971aaa3a2227b55286681bf9" FOREIGN KEY ("created_by_admin_id") REFERENCES "admins"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_items" ADD CONSTRAINT "FK_b705adee9ea930f94a8d679c9f9" FOREIGN KEY ("created_by_super_admin_id") REFERENCES "super_admins"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "status_change_requests" ADD CONSTRAINT "FK_2a9083fefa57aefc8d0cb06857c" FOREIGN KEY ("requested_by_admin_id") REFERENCES "admins"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "status_change_requests" ADD CONSTRAINT "FK_5c072dd62bb67be71d76eb7c8e8" FOREIGN KEY ("resolved_by_super_admin_id") REFERENCES "super_admins"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "partners" ADD CONSTRAINT "FK_dac618372500894d838b215c8db" FOREIGN KEY ("partner_type_id") REFERENCES "master_data"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "partners" ADD CONSTRAINT "FK_a7b02cb0c8e372732459a567b73" FOREIGN KEY ("skill_id") REFERENCES "master_data"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "partners" ADD CONSTRAINT "FK_006a6abd79a0b9ee3214329d56e" FOREIGN KEY ("category_id") REFERENCES "master_data"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "partners" ADD CONSTRAINT "FK_301e68d6bdb337beaa072256f8e" FOREIGN KEY ("reference_type_id") REFERENCES "master_data"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "partners" ADD CONSTRAINT "FK_4eee49bc64f0a9327729aa4803c" FOREIGN KEY ("created_by_admin_id") REFERENCES "admins"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "partners" DROP CONSTRAINT "FK_4eee49bc64f0a9327729aa4803c"`);
        await queryRunner.query(`ALTER TABLE "partners" DROP CONSTRAINT "FK_301e68d6bdb337beaa072256f8e"`);
        await queryRunner.query(`ALTER TABLE "partners" DROP CONSTRAINT "FK_006a6abd79a0b9ee3214329d56e"`);
        await queryRunner.query(`ALTER TABLE "partners" DROP CONSTRAINT "FK_a7b02cb0c8e372732459a567b73"`);
        await queryRunner.query(`ALTER TABLE "partners" DROP CONSTRAINT "FK_dac618372500894d838b215c8db"`);
        await queryRunner.query(`ALTER TABLE "status_change_requests" DROP CONSTRAINT "FK_5c072dd62bb67be71d76eb7c8e8"`);
        await queryRunner.query(`ALTER TABLE "status_change_requests" DROP CONSTRAINT "FK_2a9083fefa57aefc8d0cb06857c"`);
        await queryRunner.query(`ALTER TABLE "inventory_items" DROP CONSTRAINT "FK_b705adee9ea930f94a8d679c9f9"`);
        await queryRunner.query(`ALTER TABLE "inventory_items" DROP CONSTRAINT "FK_617971aaa3a2227b55286681bf9"`);
        await queryRunner.query(`ALTER TABLE "inventory_items" DROP CONSTRAINT "FK_45ed0784af22d38041d680da269"`);
        await queryRunner.query(`ALTER TABLE "inventory_items" DROP CONSTRAINT "FK_934d5a332b6870c7bb95643ab41"`);
        await queryRunner.query(`ALTER TABLE "inventory_items" DROP CONSTRAINT "FK_d415cd69df0a02b5b9c1de5e624"`);
        await queryRunner.query(`ALTER TABLE "configurations" DROP CONSTRAINT "FK_19f493859dc0c17ca1785832090"`);
        await queryRunner.query(`DROP TABLE "partners"`);
        await queryRunner.query(`DROP TABLE "status_change_requests"`);
        await queryRunner.query(`DROP TABLE "inventory_items"`);
        await queryRunner.query(`DROP TABLE "configurations"`);
    }

}
