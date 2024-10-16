export type MetaTypeData = {
  isNonNullable?: boolean;
  isList?: boolean;
  isScalar?: boolean;
  isUnion?: boolean;
};

export abstract class BaseType<T> {
  protected name: string;
  protected pairs: { key: string; value: string; metaTypeData?: MetaTypeData }[] = [];
  protected separator: string;
  protected eol: string;

  constructor(protected type: T) {}

  keyValuePair(key: string, value: string) {
    return `${key}${this.separator}${value}${this.eol}`;
  }
}
