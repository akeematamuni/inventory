import { Entity, BaseId } from '@inventory/core/domain';
import { StockTransferLineEntity, CreateStockTransferLineProps } from './stock-transfer-line.entity';

export enum StockTransferStatus {
    PENDING = 'PENDING',
    DISPATCHED = 'DISPATCHED',
    PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
    RECEIVED = 'RECEIVED',
    CANCELLED = 'CANCELLED',
}

export interface StockTransferProps {
    sourceWarehouseId: string;
    destinationWarehouseId: string;
    status: StockTransferStatus;
    lines: StockTransferLineEntity[];
    notes?: string | null;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateStockTransferProps {
    sourceWarehouseId: string;
    destinationWarehouseId: string;
    lines: Omit<CreateStockTransferLineProps, 'stockTransferId'>[];
    createdBy: string;
    notes?: string;
}

/**
 * Moves stock between two warehouses.
 * Status machine: PENDING → DISPATCHED → PARTIALLY_RECEIVED → RECEIVED
 * Status machine: PENDING → CANCELLED
*/
export class StockTransferEntity extends Entity<StockTransferProps> {
    private constructor(props: StockTransferProps, id: string) {
        super(props, id);
    }

    public static create(props: CreateStockTransferProps): StockTransferEntity {
        if (!props.lines.length) {
            throw new Error('Stock transfer must have at least one line');
        }

        if (props.sourceWarehouseId === props.destinationWarehouseId) {
            throw new Error('Source and destination warehouses must be different');
        }

        const now = new Date();
        const id = BaseId.generate().value;
        const lines = props.lines.map(line => StockTransferLineEntity.create({ 
            stockTransferId: id,
            productId: line.productId,
            quantityRequested: line.quantityRequested,
            unitCost: line.unitCost
        }));

        return new StockTransferEntity(
            {
                lines,
                sourceWarehouseId: props.sourceWarehouseId,
                destinationWarehouseId: props.destinationWarehouseId,
                status: StockTransferStatus.PENDING,
                notes: props.notes?.trim() ?? null,
                createdBy: props.createdBy,
                createdAt: now,
                updatedAt: now,
            },
            id
        );
    }

    public static reconstitute(props: StockTransferProps, id: string): StockTransferEntity {
        return new StockTransferEntity(props, id);
    }

    public dispatch(): StockTransferLineEntity[] {
        if (this.props.status !== StockTransferStatus.PENDING) {
            throw new Error('Only a PENDING transfer can be dispatched');
        }

        this.props.lines.forEach(line => line.dispatch(line.quantityRequested));
        this.props.status = StockTransferStatus.DISPATCHED;
        return this.props.lines;
    }

    public cancel(): void {
        if (this.props.status === StockTransferStatus.DISPATCHED) {
            throw new Error('A dispatched transfer cannot be cancelled. Receive it and adjust instead');
        }

        if (this.props.status === StockTransferStatus.RECEIVED) {
            throw new Error('A fully received transfer cannot be cancelled');
        }

        if (this.props.status === StockTransferStatus.CANCELLED) {
            throw new Error('Transfer is already cancelled');
        }

        this.props.status = StockTransferStatus.CANCELLED;
    }

    /**
     * Records received quantities at the destination warehouse.
     * Returns updated lines, application service uses these to:
     * 1. Write TRANSFER_IN ledger entries for quantityReceived
     * 2. Write ADJUSTMENT_DOWN ledger entries at source for any variance
    */
    public receiveLines(receipts: { lineId: string; quantity: number }[]): StockTransferLineEntity[] {
        const validStatus = [
            StockTransferStatus.DISPATCHED, 
            StockTransferStatus.PARTIALLY_RECEIVED
        ];

        if (!validStatus.includes(this.props.status)) {
            throw new Error('Only a DISPATCHED or PARTIALLY_RECEIVED transfer can be received');
        }

        const updatedLines: StockTransferLineEntity[] = [];

        for (const receipt of receipts) {
            const line = this.props.lines.find(_line => _line.id === receipt.lineId);

            if (!line) throw new Error(`Line "${receipt.lineId}" does not belong to this transfer`);
            
            line.receive(receipt.quantity);
            updatedLines.push(line);
        }

        this.props.status = !this.props.lines.every(line => line.isFullyReceived)
                    ?  StockTransferStatus.PARTIALLY_RECEIVED
                    :  StockTransferStatus.RECEIVED;

        return updatedLines;
    }

    get sourceWarehouseId(): string { return this.props.sourceWarehouseId; }
    get destinationWarehouseId(): string { return this.props.destinationWarehouseId; }
    get status(): StockTransferStatus { return this.props.status; }
    get lines(): StockTransferLineEntity[] { return this.props.lines; }
    get notes(): string | null | undefined { return this.props.notes; }
    get createdBy(): string { return this.props.createdBy; }
    get createdAt(): Date { return this.props.createdAt; }
    get updatedAt(): Date { return this.props.updatedAt; }
}
