import { Entity, BaseId } from "@inventory/core/domain";

export interface CycleCountLineProps {
    productId: string;
    cycleCountId: string;
    unitCost: number;
    systemQuantity: number;
    countedQuantity: number | null;
}

export interface CreateCycleCountLineProps {
    productId: string;
    cycleCountId: string;
    unitCost: number;
    systemQuantity: number;
}

/**
 * Represents a single product line within a cycle count session.
 * Tracks what the system expected vs what was physically counted.
 * Variance is derived, never stored directly.
*/
export class CycleCountLineEntity extends Entity<CycleCountLineProps> {
    private constructor(props: CycleCountLineProps, id: string) {
        super(props, id);
    }

    public static create(props: CreateCycleCountLineProps): CycleCountLineEntity {
        return new CycleCountLineEntity(
            {
                ...props,
                countedQuantity: null
            },
            BaseId.generate().value
        );
    }

    public static reconstitute(props: CycleCountLineProps, id: string): CycleCountLineEntity {
        return new CycleCountLineEntity(props, id);
    }

    public submitCount(counted: number): void {
        this.props.countedQuantity = counted;
    }

    public isCounted(): boolean {
        return this.props.countedQuantity !== null;
    }

    public variance(): number | null {
        if (this.props.countedQuantity === null) return null;
        return this.props.countedQuantity - this.props.systemQuantity;
    }

    public hasVariance(): boolean {
        if (this.variance()) return true;
        return false;
    }

    get productId(): string { return this.props.productId; }
    get cycleCountId(): string { return this.props.cycleCountId; }
    get unitCost(): number { return this.props.unitCost; }
    get systemQuantity(): number { return this.props.systemQuantity; }
    get countedQuantity(): number | null { return this.props.countedQuantity; }
}
