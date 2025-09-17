import { readFileSync, writeFileSync } from 'node:fs';

import { parse as babelParse } from '@babel/parser';
import { argv } from 'node:process';
import { parse as recastParse, print, types } from 'recast';

import type { namedTypes } from 'ast-types';

const bySourceValue = (
  a: namedTypes.ImportDeclaration,
  b: namedTypes.ImportDeclaration,
) => (typeof a.source.value !== 'string' || typeof b.source.value !== 'string')
  ?  0
  : lexicographic(a.source.value, b.source.value);

const lexicographic = (a: string, b: string) => {
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

for (const filename of argv.slice(2)) {
  const code = readFileSync(filename, 'utf8');

  const ast = recastParse(code, {
    parser: {
      parse: source => babelParse(source, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
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

  writeFileSync(filename, print(ast).code.replace(/\n+$/, '\n'));
}
