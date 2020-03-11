import { Node } from "./terraform-primitives";
export type ResourceElement = { type: "resource"; resourceId: string; resourceType: string; definition: Node };
export type VarElement = { type: "var"; name: string; definition: { [key: string]: string } };
export type CompositeElement = { type: "composite"; elements: TerraformElement[] };

export type TerraformElement = VarElement | ResourceElement | CompositeElement;
