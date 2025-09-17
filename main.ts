import { readFileSync, writeFileSync } from 'node:fs';

import { parse as babelParse } from '@babel/parser';
import { argv } from 'node:process';
import { parse as recastParse, print, types } from 'recast';

import type { namedTypes } from 'ast-types';

const code = readFileSync(argv[2], 'utf8');

const bySourceValue = (
  a: namedTypes.ImportDeclaration,
  b: namedTypes.ImportDeclaration,
) => (typeof a.source.value !== 'string' || typeof b.source.value !== 'string')
  ?  0
  : a.source.value.localeCompare(b.source.value);

const ast = recastParse(code, {
  parser: {
    parse: source => babelParse(source, {
      sourceType: 'module',
      plugins: ['typescript'],
    }),
  },
});

const importNodes: namedTypes.ImportDeclaration[] = [];

types.visit(ast, {
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

writeFileSync(argv[2], print(ast).code.replace(/\n+$/, '\n'));
