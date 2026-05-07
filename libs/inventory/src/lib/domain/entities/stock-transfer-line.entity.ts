import { Entity, BaseId } from '@inventory/core/domain';

export interface StockTransferLineProps {
    productId: string;
    stockTransferId: string;
    quantityRequested: number;
    quantityDispatched: number;
    quantityReceived: number;
    unitCost: number;
}

export interface CreateStockTransferLineProps {
    productId: string;
    stockTransferId: string;
    quantityRequested: number;
    unitCost: number;
}

/**
 * Represents a single product line within a Stock Transfer.
 * Tracks requested, dispatched, and received quantities independently to surface discrepancies at the line level.
*/
export class StockTransferLineEntity extends Entity<StockTransferLineProps> {
    private constructor(props: StockTransferLineProps, id: string) {
        super(props, id);
    }

    public static create(props: CreateStockTransferLineProps): StockTransferLineEntity {
        return new StockTransferLineEntity(
            {
                ...props,
                quantityDispatched: 0,
                quantityReceived: 0,
            },
            BaseId.generate().value
        );
    }

    public static reconstitute(props: StockTransferLineProps, id: string): StockTransferLineEntity {
        return new StockTransferLineEntity(props, id);
    }

    public dispatch(quantity: number): void {
        this.props.quantityDispatched = quantity;
    }

    public receive(quantity: number): void {
        this.props.quantityReceived += quantity;
    }

    get isFullyReceived(): boolean {
        return this.props.quantityReceived >= this.props.quantityRequested;
    }

    get variance(): number {
        // Variance could also be the difference between quantity received and requested 
        return this.props.quantityDispatched - this.props.quantityReceived;
    }

    get productId(): string { return this.props.productId; }
    get stockTransferId(): string { return this.props.stockTransferId; }
    get quantityRequested(): number { return this.props.quantityRequested; }
    get quantityDispatched(): number { return this.props.quantityDispatched; }
    get quantityReceived(): number { return this.props.quantityReceived; }
    get unitCost(): number { return this.props.unitCost; }
}
