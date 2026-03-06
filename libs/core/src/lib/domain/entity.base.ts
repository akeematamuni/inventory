export abstract class Entity<T> {
    protected readonly props: T;
    protected readonly _id: string;

    protected constructor(props: T, id: string) {
        this.props = props;
        this._id = id;
    }

    public equals(entity?: Entity<T>): boolean {
        if (entity === null || entity === undefined) return false;
        if (this === entity) return true;
        return this._id === entity._id;
    }

    get id(): string {
        return this._id;
    }
}
