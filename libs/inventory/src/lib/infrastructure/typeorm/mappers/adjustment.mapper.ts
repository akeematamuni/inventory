import { AdjustmentEntity, AdjustmentReason } from "../../../domain";
import { AdjustmentEntityTypeOrm } from "../entities/adjustment.entity";

export class AdjustmentMapper {
    public static toDomain(raw: AdjustmentEntityTypeOrm): AdjustmentEntity {
        return AdjustmentEntity.reconstitute(
            {
                productId: raw.productId,
                warehouseId: raw.warehouseId,
                movementType: raw.movementType,
                unitCost: raw.unitCost,
                quantity: raw.quantity,
                reason: AdjustmentReason.create({ code: raw.reasonCode, notes: raw.reasonNotes }),
                notes: raw.notes,
                createdBy: raw.createdBy,
                createdAt: raw.createdAt
            },
            raw.id
        );
    }

    public static toPersistence(domain: AdjustmentEntity): AdjustmentEntityTypeOrm {
        const entity = new AdjustmentEntityTypeOrm();
        entity.id = domain.id;
        entity.productId = domain.productId;
        entity.warehouseId = domain.warehouseId;
        entity.movementType = domain.movementType;
        entity.unitCost = domain.unitCost;
        entity.quantity = domain.quantity;
        entity.reasonCode = domain.reason.code;
        entity.reasonNotes = domain.reason.notes;
        entity.notes = domain.notes;
        entity.createdBy = domain.createdBy;
        entity.createdAt = domain.createdAt;
        return entity;
    }
}
