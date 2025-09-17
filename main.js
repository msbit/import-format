"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const parser_1 = require("@babel/parser");
const node_process_1 = require("node:process");
const recast_1 = require("recast");
const bySourceValue = (a, b) => (typeof a.source.value !== 'string' || typeof b.source.value !== 'string')
    ? 0
    : lexicographic(a.source.value, b.source.value);
const lexicographic = (a, b) => {
    const aPoints = [...a].map(x => x.codePointAt(0));
    const bPoints = [...b].map(x => x.codePointAt(0));
    const len = Math.min(aPoints.length, bPoints.length);
    for (let i = 0; i < len; i++) {
        if (aPoints[i] !== bPoints[i]) {
            return aPoints[i] - bPoints[i];
        }
    }
    return aPoints.length - bPoints.length;
};
for (const filename of node_process_1.argv.slice(2)) {
    const code = (0, node_fs_1.readFileSync)(filename, 'utf8');
    const ast = (0, recast_1.parse)(code, {
        parser: {
            parse: source => (0, parser_1.parse)(source, {
                sourceType: 'module',
                plugins: ['jsx', 'typescript'],
            }),
        },
    });
    const importNodes = [];
    recast_1.types.visit(ast, {
        visitImportDeclaration(path) {
            importNodes.push(path.node);
            path.prune();
            return false;
        },
    });
    const libraryValueImportNodes = importNodes
        .filter(node => node.importKind === 'value' && node.source.value[0] !== '.');
    const projectValueImportNodes = importNodes
        .filter(node => node.importKind === 'value' && node.source.value[0] === '.');
    const libraryTypeImportNodes = importNodes
        .filter(node => node.importKind === 'type' && node.source.value[0] !== '.');
    const projectTypeImportNodes = importNodes
        .filter(node => node.importKind === 'type' && node.source.value[0] === '.');
    libraryValueImportNodes.sort(bySourceValue);
    projectValueImportNodes.sort(bySourceValue);
    libraryTypeImportNodes.sort(bySourceValue);
    projectTypeImportNodes.sort(bySourceValue);
    ast.program.body = [
        ...libraryValueImportNodes,
        ...projectValueImportNodes,
        ...libraryTypeImportNodes,
        ...projectTypeImportNodes,
        ...ast.program.body,
    ];
    (0, node_fs_1.writeFileSync)(filename, (0, recast_1.print)(ast).code.replace(/\n+$/, '\n'));
}
