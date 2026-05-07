import { StockTransferEntity, StockTransferLineEntity } from "../../../domain";
import { StockTransferLineEntityTypeOrm } from "../entities/stock-transfer-line.entity";
import { StockTransferEntityTypeOrm } from "../entities/stock-transfer.entity";

export class StockTransferMapper {
    public static toDomain(raw: StockTransferEntityTypeOrm): StockTransferEntity {
        return StockTransferEntity.reconstitute(
            {
                sourceWarehouseId: raw.sourceWarehouseId,
                destinationWarehouseId: raw.destinationWarehouseId,
                status: raw.status,
                lines: raw.lines.map((line) => StockTransferMapper.toLineDomain(line)),
                notes: raw.notes,
                createdBy: raw.createdBy,
                createdAt: raw.createdAt,
                updatedAt: raw.updatedAt
            },
            raw.id
        );
    }

    private static toLineDomain(raw: StockTransferLineEntityTypeOrm): StockTransferLineEntity {
        return StockTransferLineEntity.reconstitute(
            {
                productId: raw.productId,
                stockTransferId: raw.stockTransferId,
                unitCost: raw.unitCost,
                quantityRequested: raw.quantityRequested,
                quantityDispatched: raw.quantityDispatched,
                quantityReceived: raw.quantityReceived
            },
            raw.id
        );
    }

    public static toPersistence(domain: StockTransferEntity): StockTransferEntityTypeOrm {
        const entity = new StockTransferEntityTypeOrm();
        entity.id = domain.id;
        entity.sourceWarehouseId = domain.sourceWarehouseId;
        entity.destinationWarehouseId = domain.destinationWarehouseId;
        entity.status = domain.status;
        entity.lines = domain.lines.map((line) => StockTransferMapper.toLinePersistence(line));
        entity.notes = domain.notes;
        entity.createdBy = domain.createdBy;
        entity.createdAt = domain.createdAt;
        entity.updatedAt = domain.updatedAt;
        return entity;
    }

    private static toLinePersistence(domain: StockTransferLineEntity): StockTransferLineEntityTypeOrm {
        const entity = new StockTransferLineEntityTypeOrm();
        entity.id = domain.id;
        entity.productId = domain.productId;
        entity.unitCost = domain.unitCost;
        entity.stockTransferId = domain.stockTransferId;
        entity.quantityRequested = domain.quantityRequested;
        entity.quantityDispatched = domain.quantityDispatched;
        entity.quantityReceived = domain.quantityReceived;
        return entity;
    }
}
