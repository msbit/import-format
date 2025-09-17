"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const recast = __importStar(require("recast"));
const babelParser = __importStar(require("@babel/parser"));
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
const importNodes = [];
recast.types.visit(ast, {
    visitImportDeclaration(path) {
        importNodes.push(path.node);
        path.prune(); // Remove it from AST
        return false;
    },
});
// Step 3: Sort imports (alphabetically by module name)
importNodes.sort((a, b) => a.source.value.localeCompare(b.source.value));
// Step 4: Reinsert sorted imports at the top
ast.program.body = [...importNodes, ...ast.program.body];
// Step 5: Generate code back
const output = recast.print(ast).code;
console.log(output);
