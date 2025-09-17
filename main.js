"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parser_1 = require("@babel/parser");
const recast_1 = require("recast");
const node_process_1 = require("node:process");
const node_fs_1 = require("node:fs");
const code = (0, node_fs_1.readFileSync)(node_process_1.argv[2], 'utf8');
const bySourceValue = (a, b) => (typeof a.source.value !== 'string' || typeof b.source.value !== 'string')
    ? 0
    : a.source.value.localeCompare(b.source.value);
const ast = (0, recast_1.parse)(code, {
    parser: {
        parse: source => (0, parser_1.parse)(source, {
            sourceType: 'module',
            plugins: ['typescript'],
        }),
    },
});
const valueImportNodes = [];
const typeImportNodes = [];
recast_1.types.visit(ast, {
    visitImportDeclaration(path) {
        switch (path.node.importKind) {
            case 'value':
                valueImportNodes.push(path.node);
                break;
            case 'type':
                typeImportNodes.push(path.node);
                break;
            default:
                throw new Error(`unhandled import kind: ${path.node.importKind}`);
        }
        path.prune();
        return false;
    },
});
valueImportNodes.sort(bySourceValue);
typeImportNodes.sort(bySourceValue);
ast.program.body = [
    ...valueImportNodes,
    ...typeImportNodes,
    ...ast.program.body,
];
const output = (0, recast_1.print)(ast).code;
console.log(output);
