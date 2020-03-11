import { TerraformElement } from "./terraform-elements";
import { isString, isNumber, isBoolean } from "util";
import { CData, JsonEncode, Node, Multiple, Value, Reference } from "./terraform-primitives";

const toString = (cd: CData) => `<<${cd.name}\n${JSON.stringify(cd.data, undefined, 2)}\n${cd.name}`;

const writeAssignment = (varName: string | undefined) => {
  if (varName !== undefined) {
    return " = ";
  }
  return "";
};

const writeObject = (indent: string, b: any) =>
  ["{", ...Object.keys(b).map(key => writeVar(`${indent}  `, key, b[key])), `${indent}}`].join("\n");

const writeVar = (indent: string = "", key: string | undefined, b: Node): string => {
  const varName = key !== undefined && key.indexOf(":") !== -1 ? `\"${key}\"` : key;

  if (b instanceof CData) {
    return `${indent}${varName || ""}${writeAssignment(varName)}${toString(b)}`;
  }

  if (b instanceof JsonEncode) {
    return [
      `${indent}${varName || ""}`,
      writeAssignment(varName),
      "<<EOF\n",
      JSON.stringify(b.data, null, 2) + "\n",
      "EOF\n",
    ].join("");
  }

  if (b instanceof Multiple) {
    return b.items.map(item => `\n${writeVar(`${indent}`, varName, item)}`).join("");
  }

  if (b instanceof Value) {
    return `${indent}${varName || ""} = ${writeObject(indent, b.data)}`;
  }

  if (b instanceof Reference) {
    return `${indent}${varName || ""} = ${b.data}`;
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
    return `${indent}${varName || ""}${writeAssignment(varName)}\"${b}\"`;
  }

  if (isNumber(b) || isBoolean(b)) {
    return `${indent}${varName || ""}${writeAssignment(varName)}${b}`;
  }

  if (typeof b === "object") {
    return `${indent}${varName || ""} ${writeObject(indent, b)}`;
  }

  return `${indent}${varName || ""}${writeAssignment(varName)}${b}`;
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
