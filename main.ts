import * as recast from "recast";
import { namedTypes as n } from "ast-types";
import * as babelParser from "@babel/parser";

// Sample code with comments and spacing
const code = `
// A comment before imports

import z from "z-lib";   // Z import
import a from "a-lib";   // A import

// Utility import
import { b } from "./utils";

const something = 42;
`;

// Step 1: Parse using Recast with Babel parser
const ast = recast.parse(code, {
  parser: {
    parse(source) {
      return babelParser.parse(source, {
        sourceType: "module",
        plugins: ["typescript"],
      });
    },
  },
});

// Step 2: Extract import declarations
const importNodes: n.ImportDeclaration[] = [];
recast.types.visit(ast, {
  visitImportDeclaration(path) {
    importNodes.push(path.node);
    path.prune(); // Remove it from AST
    return false;
  },
});

// Step 3: Sort imports (alphabetically by module name)
importNodes.sort((a, b) =>
  a.source.value.localeCompare(b.source.value)
);

// Step 4: Reinsert sorted imports at the top
ast.program.body = [...importNodes, ...ast.program.body];

// Step 5: Generate code back
const output = recast.print(ast).code;

console.log(output);
