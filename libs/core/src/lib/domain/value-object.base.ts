import { isEqual } from 'lodash';

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ValueObjectProps {
    [key: string]: any;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export abstract class ValueObject<T extends ValueObjectProps> {
    protected readonly props: T;

    protected constructor(props: T) {
        this.props = Object.freeze(props);
    }

    public equals(vo?: ValueObject<T>): boolean {
        if (vo === null || vo === undefined) return false;
        if (vo.constructor.name !== this.constructor.name) return false;
        return isEqual(this.props, vo.props);
        //return JSON.stringify(this.props) === JSON.stringify(vo.props);
    }
}

