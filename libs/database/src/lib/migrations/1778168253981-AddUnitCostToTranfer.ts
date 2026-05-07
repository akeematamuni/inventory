import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUnitCostToTranfer1778168253981 implements MigrationInterface {
    name = 'AddUnitCostToTranfer1778168253981'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stock_transfer_lines" ADD "unit_cost" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stock_transfer_lines" DROP COLUMN "unit_cost"`);
    }

}
