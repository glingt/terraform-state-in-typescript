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

const writeObject = (indent: string, b: any) => {
  let str = "";
  str += " {\n";
  Object.keys(b).forEach(key => {
    str += writeVar(`${indent}  `, `${key}`, b[key]);
    str += "\n";
  });
  str += `${indent}}`;
  return str;
};
const writeVar = (indent: string = "", varName: string | undefined, b: Node) => {
  let str: string = "";
  if (b instanceof CData) {
    str += `${indent}${varName || ""}`;
    str += writeAssignment(varName);
    str += toString(b);
  } else if (b instanceof JsonEncode) {
    str += `${indent}${varName || ""}`;
    str += writeAssignment(varName);
    str += "<<EOF\n";
    str += JSON.stringify(b.data) + "\n";
    str += "EOF\n";
  } else if (b instanceof Multiple) {
    b.items.forEach(item => {
      str += `\n${writeVar(`${indent}`, varName, item)}`;
    });
  } else if (b instanceof Value) {
    str += `${indent}${varName || ""} = `;
    str += writeObject(indent, b.data);
  } else if (Array.isArray(b)) {
    str += `${indent}${varName || ""}`;
    str += writeAssignment(varName);
    str += "[";
    str += b.map(item => `\n${writeVar(`${indent}  `, undefined, item)},`).join("");
    str += `\n${indent}]`;
  } else if (isString(b)) {
    str += `${indent}${varName || ""}`;
    str += writeAssignment(varName);
    str += `\"${b}\"`;
  } else if (isNumber(b) || isBoolean(b)) {
    str += `${indent}${varName || ""}`;
    str += writeAssignment(varName);
    str += `${b}`;
  } else if (typeof b === "object") {
    str += `${indent}${varName || ""}`;
    str += writeObject(indent, b);
  } else {
    str += `${indent}${varName || ""}`;
    str += writeAssignment(varName);
    str += b;
  }
  return str;
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
