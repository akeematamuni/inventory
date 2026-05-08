import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUnitCostToCycleCount1778255781367 implements MigrationInterface {
    name = 'AddUnitCostToCycleCount1778255781367'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cycle_count_lines" ADD "unit_cost" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cycle_count_lines" DROP COLUMN "unit_cost"`);
    }

}
