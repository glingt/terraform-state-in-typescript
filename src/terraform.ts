export type ResourceElement = { type: "resource"; resourceId: string; resourceType: string; definition: Node };
export type VarElement = { type: "var"; name: string; definition: { [key: string]: string } };
export type CompositeElement = { type: "composite"; elements: TerraformElement[] };

export type TerraformElement = VarElement | ResourceElement | CompositeElement;

export class CData {
  constructor(public name: string, public data: {}) {}
}

export const cdata = (name: string, content: {}): {} => new CData(name, content);

export type BaseNode = string | CData | { [key: string]: BaseNode };

export type Node = BaseNode | BaseNode[];

export const resource = (resourceType: string, resourceIdRaw: string, definition: any): ResourceElement => {
  const resourceId = resourceIdRaw.replace(/\./g, "_");
  return {
    type: "resource",
    resourceType,
    resourceId,
    definition,
  };
};

export const user_var = (name: string, definition: { [key: string]: string }): VarElement => ({
  type: "var",
  name,
  definition,
});

export const multiple = <T>(...items: T[]) => {
  (items as any).spread = true;
  return items;
};

export const compositeElement = (...elements: TerraformElement[]): TerraformElement => ({
  type: "composite",
  elements,
});

export const asValue = (b: object) => ({ ...b, _isValue: true });
