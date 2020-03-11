import { TerraformElement } from "./terraform-elements";
import { isString, isNumber, isBoolean } from "util";
import { CData, JsonEncode, Node, Multiple, Value } from "./terraform-primitives";

const toString = (cd: CData) => `<<${cd.name}\n${JSON.stringify(cd.data, undefined, 2)}\n${cd.name}`;

const writeAssignment = (varName: string | undefined) => {
  if (varName !== undefined) {
    return " = ";
  }
  return "";
};

const writeObject = (indent: string, b: any) =>
  [" {", ...Object.keys(b).map(key => writeVar(`${indent}  `, key, b[key])), `${indent}}`].join("\n");

const writeVar = (indent: string = "", varName: string | undefined, b: Node): string => {
  if (b instanceof CData) {
    return [`${indent}${varName || ""}`, writeAssignment(varName), toString(b)].join("");
  }

  if (b instanceof JsonEncode) {
    return [
      `${indent}${varName || ""}`,
      writeAssignment(varName),
      "<<EOF\n",
      JSON.stringify(b.data) + "\n",
      "EOF\n",
    ].join("");
  }

  if (b instanceof Multiple) {
    return b.items.map(item => `\n${writeVar(`${indent}`, varName, item)}`).join("");
  }

  if (b instanceof Value) {
    return [`${indent}${varName || ""} = `, writeObject(indent, b.data)].join("");
  }

  if (Array.isArray(b)) {
    return [
      `${indent}${varName || ""}`,
      writeAssignment(varName),
      "[",
      b.map(item => `\n${writeVar(`${indent}  `, undefined, item)},`).join(""),
      `\n${indent}]`,
    ].join("");
  }

  if (isString(b)) {
    return [`${indent}${varName || ""}`, writeAssignment(varName), `\"${b}\"`].join("");
  }

  if (isNumber(b) || isBoolean(b)) {
    return [`${indent}${varName || ""}`, writeAssignment(varName), `${b}`].join("");
  }

  if (typeof b === "object") {
    return [`${indent}${varName || ""}`, writeObject(indent, b)].join("");
  }

  return [`${indent}${varName || ""}`, writeAssignment(varName), b].join("");
};

export const createFileContent = (element: TerraformElement): string => {
  switch (element.type) {
    case "composite":
      return element.elements.map(element => createFileContent(element)).join("\n");
    case "resource":
      return writeVar("", `resource \"${element.resourceType}\" \"${element.resourceId}\"`, element.definition);
    case "var":
      return writeVar("", element.name, element.definition);
  }
};
