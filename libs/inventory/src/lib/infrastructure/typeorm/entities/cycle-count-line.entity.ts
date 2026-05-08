import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
// import type { CycleCountEntityTypeOrm } from "./cycle-count.entity";

@Entity('cycle_count_lines')
export class CycleCountLineEntityTypeOrm {
    @PrimaryColumn('uuid')
    id!: string;

    @Column({ name: 'product_id', type: 'uuid' })
    productId!: string;

    @Column({ name: 'cycle_count_id', type: 'uuid' })
    cycleCountId!: string;

    @Column({ name: 'unit_cost', type: 'int', default: 0 })
    unitCost!: number;

    @Column({ name: 'system_quantity', type: 'int' })
    systemQuantity!: number;

    @Column({ name: 'counted_quantity', type: 'int', nullable: true })
    countedQuantity!: number | null;

    /* eslint-disable @typescript-eslint/no-explicit-any */
    @ManyToOne(
        () => require('./cycle-count.entity').CycleCountEntityTypeOrm,
        (_cycleCount: any) => _cycleCount.lines,
        { onDelete: 'CASCADE', onUpdate: 'CASCADE' }
    )
    @JoinColumn({ name: 'cycle_count_id' })
    cycleCount!: any;

    // @ManyToOne(
    //     'CycleCountEntityTypeOrm', 
    //     (x: CycleCountEntityTypeOrm) => x.lines,
    //     { onDelete: 'CASCADE', onUpdate: 'CASCADE' }
    // )
    // @JoinColumn({ name: 'cycle_count_id' })
    // cycleCount!: CycleCountEntityTypeOrm;
}
