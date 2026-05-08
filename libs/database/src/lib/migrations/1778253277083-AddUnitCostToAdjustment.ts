import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUnitCostToAdjustment1778253277083 implements MigrationInterface {
    name = 'AddUnitCostToAdjustment1778253277083'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "adjustments" ADD "unit_cost" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "adjustments" DROP COLUMN "unit_cost"`);
    }

}
