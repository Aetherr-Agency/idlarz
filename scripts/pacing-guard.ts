// The pacing guard: fails (exit 1) when a key milestone of the sim moved by more than 15 % against a base.
//
//   npx tsx scripts/pacing-guard.ts --base=<baseline.json> [--current=docs/generated/sim-baseline.json]
//
// `--current` is what `npm run sim` just wrote; `--base` is the same file as it is on the branch the PR targets. CI extracts it with
// `git show origin/<base>:docs/generated/sim-baseline.json`, so a PR cannot pass by regenerating the baseline with its own numbers.
// An intended pacing change carries the `pacing-change` label: the guard still runs and prints the report but does not block the PR.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PACING_TOLERANCE, comparePacing, formatViolations, type PacingBaseline } from './pacingCompare';

const arg = (name: string): string | undefined => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const load = (path: string): PacingBaseline => JSON.parse(readFileSync(resolve(path), 'utf8')) as PacingBaseline;

const basePath = arg('base');
if (!basePath) {
	console.error('usage: pacing-guard.ts --base=<baseline.json> [--current=docs/generated/sim-baseline.json]');
	process.exit(2);
}
const currentPath = arg('current') ?? 'docs/generated/sim-baseline.json';

const violations = comparePacing(load(basePath), load(currentPath));
if (violations.length === 0) {
	console.log(`Pacing guard: every guarded milestone is within ±${PACING_TOLERANCE * 100} % of the base.`);
} else {
	console.error(
		`Pacing guard: ${violations.length} milestone(s) moved by more than ±${PACING_TOLERANCE * 100} % (game days, ${currentPath} against ${basePath}):`,
	);
	console.error(formatViolations(violations));
	console.error(
		'If this change is intended, add the `pacing-change` label to the PR (and re-run the job); the numbers are in docs/generated/sim-milestones.md.',
	);
	process.exit(1);
}
