import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import ts from 'typescript';

// IDL-15: the config and the game maths are split into small modules; this keeps them (and everything else under src) free of import cycles.
// Only value imports count: `import type` is erased and cannot cycle at runtime.

const ROOT = resolve(__dirname, '..');
const SRC = join(ROOT, 'src');

const sourceFiles = (dir: string): string[] =>
	readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return sourceFiles(path);
		return /\.tsx?$/.test(entry.name) ? [path] : [];
	});

const resolveSpecifier = (from: string, spec: string): string | null => {
	const base = spec.startsWith('@/') ? join(SRC, spec.slice(2)) : spec.startsWith('.') ? resolve(dirname(from), spec) : null;
	if (!base) return null;
	return [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')].find((candidate) => existsSync(candidate)) ?? null;
};

const valueImports = (file: string): string[] => {
	const sf = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
	const deps: string[] = [];
	sf.forEachChild((node) => {
		if (!(ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) || !node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) return;
		if (ts.isExportDeclaration(node) && node.isTypeOnly) return;
		if (ts.isImportDeclaration(node)) {
			const clause = node.importClause;
			if (clause?.isTypeOnly) return;
			const named = clause?.namedBindings;
			if (!clause?.name && named && ts.isNamedImports(named) && named.elements.every((e) => e.isTypeOnly)) return;
		}
		const target = resolveSpecifier(file, node.moduleSpecifier.text);
		if (target) deps.push(target);
	});
	return deps;
};

/** Strongly connected components with more than one file (Tarjan). */
const cycles = (graph: Map<string, string[]>): string[][] => {
	let counter = 0;
	const index = new Map<string, number>();
	const low = new Map<string, number>();
	const stack: string[] = [];
	const onStack = new Set<string>();
	const found: string[][] = [];
	const visit = (v: string): void => {
		index.set(v, counter);
		low.set(v, counter);
		counter++;
		stack.push(v);
		onStack.add(v);
		for (const w of graph.get(v) ?? []) {
			if (!index.has(w)) {
				visit(w);
				low.set(v, Math.min(low.get(v)!, low.get(w)!));
			} else if (onStack.has(w)) low.set(v, Math.min(low.get(v)!, index.get(w)!));
		}
		if (low.get(v) === index.get(v)) {
			const group: string[] = [];
			let w: string;
			do {
				w = stack.pop()!;
				onStack.delete(w);
				group.push(w);
			} while (w !== v);
			if (group.length > 1) found.push(group);
		}
	};
	for (const v of graph.keys()) if (!index.has(v)) visit(v);
	return found;
};

test('no import cycles under src (type-only imports excluded)', () => {
	const graph = new Map(sourceFiles(SRC).map((file) => [file, valueImports(file)] as const));
	const groups = cycles(graph).map((group) => group.map((file) => relative(ROOT, file)).sort());
	assert.deepEqual(groups, [], `import cycles:\n${groups.map((g) => g.join('\n  ')).join('\n\n')}`);
});

test('the cycle detector finds a cycle', () => {
	assert.equal(
		cycles(
			new Map([
				['a', ['b']],
				['b', ['c']],
				['c', ['a']],
				['d', ['a']],
			]),
		).length,
		1,
	);
	assert.equal(
		cycles(
			new Map([
				['a', ['b']],
				['b', []],
			]),
		).length,
		0,
	);
});
