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

const valueImportNodes: namedTypes.ImportDeclaration[] = [];
const typeImportNodes: namedTypes.ImportDeclaration[] = [];

types.visit(ast, {
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

writeFileSync(argv[2], print(ast).code.replace(/\n+$/, '\n'));
