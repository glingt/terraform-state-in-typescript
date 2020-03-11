export class CData {
  constructor(public name: string, public data: {}) {}
}

export class JsonEncode {
  constructor(public data: {}) {}
}

export class Multiple<T> {
  constructor(public items: T[]) {}
}

export class Value {
  constructor(public data: Node) {}
}

export class Reference {
  constructor(public data: string) {}
}

export type BaseNode =
  | boolean
  | number
  | string
  | undefined
  | CData
  | JsonEncode
  | Value
  | Reference
  | Multiple<any>
  | { [key: string]: Node };

export type Node = BaseNode | BaseNode[];
