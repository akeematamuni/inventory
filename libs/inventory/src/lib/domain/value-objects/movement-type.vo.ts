/**
 * Describes the nature of a stock ledger entry.
 * Every unit of stock movement maps to exactly one MovementType.
*/
export enum MovementType {
    // Initial balance on CSV import
    OPENING_STOCK = 'OPENING_STOCK',
    // Stock in from procurement
    RECEIPT = 'RECEIPT',
    // Stock leaving a warehouse  
    TRANSFER_OUT = 'TRANSFER_OUT',
    // Stock arriving at a warehouse
    TRANSFER_IN = 'TRANSFER_IN',
    // Manual positive correction      
    ADJUSTMENT_UP = 'ADJUSTMENT_UP',
    // Manual negative correction    
    ADJUSTMENT_DOWN = 'ADJUSTMENT_DOWN',
    // Variance adjustment from cycle count
    CYCLE_COUNT_ADJ = 'CYCLE_COUNT_ADJ'
}
