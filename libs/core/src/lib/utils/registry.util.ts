/* Leverage inversion of control pattern to prevent circular dependency */

// /* eslint-disable @typescript-eslint/no-explicit-any */
// export const allEntities: any[] = [];
// export const tenantMigrations: any[] = [];
// export const registeredControllers: any[] = [];

// export const registerEntities = (entity: any[]) => {
//     allEntities.push(...entity);
// }

// export const registerMigrations = (migration: any[]) => {
//     tenantMigrations.push(...migration);
// }

// // Registr all controllers for global middleware
// export const registerControllers = (controller: any[]) => {
//     registeredControllers.push(...controller);
// }
// /* eslint-enable @typescript-eslint/no-explicit-any */


/* eslint-disable @typescript-eslint/no-explicit-any */
export class GlobalRegistry {
    public static readonly entities: any[] = [];
    public static readonly migrations: any[] = [];
    public static readonly controllers: any[] = [];

    public static addEntities(entities: any[]) {
        this.entities.push(...entities);
    }

    public static addMigrations(migrations: any[]) {
        this.migrations.push(...migrations);
    }

    public static addControllers(controllers: any[]) {
        this.controllers.push(...controllers);
    }
}
