import { CycleCountEntity, CycleCountLineEntity } from "../../../domain";
import { CycleCountLineEntityTypeOrm } from "../entities/cycle-count-line.entity";
import { CycleCountEntityTypeOrm } from "../entities/cycle-count.entity";

export class CycleCountMapper {
    public static toDomain(raw: CycleCountEntityTypeOrm): CycleCountEntity {
        return CycleCountEntity.reconstitute(
            {
                warehouseId: raw.warehouseId,
                status: raw.status,
                lines: raw.lines.map((line) => CycleCountMapper.toLineDomain(line)),
                createdBy: raw.createdBy,
                approvedBy: raw.approvedBy,
                notes: raw.notes,
                createdAt: raw.createdAt,
                updatedAt: raw.updatedAt
            },
            raw.id
        );
    }

    private static toLineDomain(raw: CycleCountLineEntityTypeOrm): CycleCountLineEntity {
        return CycleCountLineEntity.reconstitute(
            {
                productId: raw.productId,
                cycleCountId: raw.cycleCountId,
                unitCost: raw.unitCost,
                systemQuantity: raw.systemQuantity,
                countedQuantity: raw.countedQuantity
            },
            raw.id
        );
    }

    public static toPersistence(domain: CycleCountEntity): CycleCountEntityTypeOrm {
        const entity = new CycleCountEntityTypeOrm();
        entity.warehouseId = domain.warehouseId;
        entity.status = domain.status;
        entity.lines = domain.lines.map((line) => CycleCountMapper.toLinePersistence(line));
        entity.createdBy = domain.createdBy;
        entity.approvedBy = domain.approvedBy;
        entity.notes = domain.notes;
        entity.createdAt = domain.createdAt;
        entity.updatedAt = domain.updatedAt
        return entity;
    }

    private static toLinePersistence(domain: CycleCountLineEntity): CycleCountLineEntityTypeOrm {
        const entity = new CycleCountLineEntityTypeOrm();
        entity.id = domain.id;
        entity.productId = domain.productId;
        entity.cycleCountId = domain.cycleCountId;
        entity.unitCost = domain.unitCost;
        entity.systemQuantity = domain.systemQuantity;
        entity.countedQuantity = domain.countedQuantity;
        return entity;
    }
}
