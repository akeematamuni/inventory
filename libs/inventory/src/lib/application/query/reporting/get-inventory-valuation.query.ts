import { ValuationMethod, ValuationScope } from "../../dtos/reporting.dto";

export class GetInventoryValuationQuery {
    constructor(
        public readonly method: ValuationMethod,
        public readonly scope: ValuationScope,
        public readonly warehouseId: string,
        public readonly productId?: string,
    ) {}
}
