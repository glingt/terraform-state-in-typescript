import { ResourceElement, VarElement, TerraformElement } from "./terraform-elements";
import { JsonEncode, CData, Multiple, Value, Node } from "./terraform-primitives";

export const cdata = (name: string, content: {}): {} => new CData(name, content);
export const jsonencode = (content: {}): {} => new JsonEncode(content);
export const multiple = <T>(...items: T[]) => new Multiple(items);
export const asValue = (b: Node) => new Value(b);
export const resource = (resourceType: string, resourceIdRaw: string, definition: Node): ResourceElement => {
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

export const compositeElement = (...elements: TerraformElement[]): TerraformElement => ({
  type: "composite",
  elements,
});
