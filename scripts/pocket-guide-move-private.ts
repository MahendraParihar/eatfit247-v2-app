/**
 * Moves pocket-guide PDFs out of the public static folder into private storage
 * (spec: specs/features/2026-10-04-pocket-guide-download, plan group 2.2).
 *
 *   <ASSET_PATH>/pocket-guide/*.pdf  →  <PRIVATE_ASSET_PATH>/pocket-guide/
 *
 * Dry run by default; pass --apply to move files. Idempotent: files already in
 * private storage are left alone, and existing files are never overwritten.
 *
 * - Every document in the public pocket-guide folder is moved, referenced or not, so
 *   nothing private stays public. Thumbnails (images) stay where they are.
 * - Each mst_pocket_guides.file_path reference (public `media-files/pocket-guide/x.pdf`,
 *   or `private://pocket-guide/x.pdf` after migration 136) is checked against disk.
 * - Linux is case-sensitive: when the DB says `PartyGuide.pdf` but the file is
 *   `Partyguide.pdf`, the file is renamed to the DB name so the reference resolves.
 * - Rows whose file can't be found, and name conflicts, are reported; the exit code is then 2.
 *
 * Run from server_1 (pg and dotenv resolve from its node_modules; server_1/.env is loaded):
 *   cd server_1
 *   node --experimental-strip-types ../scripts/pocket-guide-move-private.ts           # dry run
 *   node --experimental-strip-types ../scripts/pocket-guide-move-private.ts --apply
 *
 * On the VPS, run inside admin-api (it has both folders mounted and the DB env):
 *   docker cp scripts/pocket-guide-move-private.ts eatfit-admin-api:/home/app/server_1/
 *   docker exec -w /home/app/server_1 eatfit-admin-api node --experimental-strip-types pocket-guide-move-private.ts
 */

import { promises as fs, constants as fsConstants } from 'node:fs';
import { createRequire } from 'node:module';
import * as path from 'node:path';

interface PgClientConfig {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
}

interface PgClient {
  connect(): Promise<void>;
  query<T>(sql: string): Promise<{ rows: T[] }>;
  end(): Promise<void>;
}

interface PgModule {
  Client: new (config: PgClientConfig) => PgClient;
}

interface DotenvModule {
  config(): void;
}

interface MediaUpload {
  webUrl?: string;
  mimetype?: string;
}

interface PocketGuideRow {
  pocket_guide_id: number;
  pocket_guide: string;
  file_path: MediaUpload[] | null;
}

type FileAction = 'already-private' | 'rename-in-private' | 'move' | 'missing' | 'conflict';

interface FilePlan {
  name: string; // name the file must have in private storage
  action: FileAction;
  sourcePath?: string;
  guideIds: number[]; // rows referencing it (empty = unreferenced public file)
  note?: string;
}

const MEDIA_FOR = 'pocket-guide';
const PUBLIC_REF = /^\/?media-files\/pocket-guide\/([^/]+)$/;
const PRIVATE_REF = /^private:\/\/pocket-guide\/([^/]+)$/;
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']);

const apply = process.argv.includes('--apply');
const requireFromCwd = createRequire(path.join(process.cwd(), 'package.json'));
(requireFromCwd('dotenv') as DotenvModule).config();

function env(key: string, required = true): string {
  const value = process.env[key];
  if (!value && required) {
    throw new Error(`${key} is not set`);
  }
  return value || '';
}

function isInside(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return relative === '' || (relative.split(path.sep)[0] !== '..' && !path.isAbsolute(relative));
}

/** Same defaults and overlap rule as Env.privateAssetPath (server_1 config.utils). */
function resolveRoots(): { staticRoot: string; privateRoot: string } {
  const staticRoot = path.resolve(env('ASSET_PATH'));
  const privateRoot = path.resolve(env('PRIVATE_ASSET_PATH', false) || path.join(staticRoot, '..', 'private-files'));
  if (isInside(staticRoot, privateRoot) || isInside(privateRoot, staticRoot)) {
    throw new Error(`PRIVATE_ASSET_PATH (${privateRoot}) must not overlap ASSET_PATH (${staticRoot})`);
  }
  return { staticRoot, privateRoot };
}

function isDocument(fileName: string, mimetype?: string): boolean {
  const isImage =
    (mimetype === undefined || mimetype.toLowerCase().startsWith('image/')) &&
    IMAGE_EXTENSIONS.has(path.extname(fileName).toLowerCase());
  return !isImage;
}

function isSafeName(name: string): boolean {
  return name !== '.' && name !== '..' && !name.includes('/') && !name.includes('\\');
}

async function listFiles(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isFile() && !e.name.startsWith('.')).map((e) => e.name);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/** Exact name first; otherwise a single case-insensitive match. */
function findFile(files: string[], name: string): { found?: string; ambiguous: boolean } {
  if (files.includes(name)) {
    return { found: name, ambiguous: false };
  }
  const matches = files.filter((f) => f.toLowerCase() === name.toLowerCase());
  return { found: matches.length === 1 ? matches[0] : undefined, ambiguous: matches.length > 1 };
}

async function loadReferences(): Promise<Map<string, number[]>> {
  const { Client } = requireFromCwd('pg') as PgModule;
  const client = new Client({
    host: env('DB_HOST'),
    port: Number(env('DB_PORT', false) || 5432),
    user: env('DB_USER'),
    password: env('DB_PASSWORD', false),
    database: env('DB_NAME'),
  });
  const schema = env('DB_SCHEMA', false) || 'public';
  if (!/^[a-z_][a-z0-9_]*$/i.test(schema)) {
    throw new Error(`Invalid DB_SCHEMA: ${schema}`);
  }
  await client.connect();
  try {
    const { rows } = await client.query<PocketGuideRow>(
      `SELECT pocket_guide_id, pocket_guide, file_path FROM "${schema}".mst_pocket_guides ORDER BY pocket_guide_id`,
    );
    const references = new Map<string, number[]>();
    for (const row of rows) {
      for (const item of Array.isArray(row.file_path) ? row.file_path : []) {
        const webUrl = item.webUrl || '';
        const privateMatch = PRIVATE_REF.exec(webUrl);
        const publicMatch = PUBLIC_REF.exec(webUrl);
        const name = privateMatch?.[1] ?? (publicMatch && isDocument(publicMatch[1], item.mimetype) ? publicMatch[1] : undefined);
        if (!name) {
          if (webUrl && !publicMatch) {
            console.warn(`  ! pocket_guide_id ${row.pocket_guide_id}: unrecognised file reference "${webUrl}" (left alone)`);
          }
          continue;
        }
        if (!isSafeName(name)) {
          console.warn(`  ! pocket_guide_id ${row.pocket_guide_id}: unsafe file name "${name}" (skipped)`);
          continue;
        }
        references.set(name, [...(references.get(name) || []), row.pocket_guide_id]);
      }
    }
    return references;
  } finally {
    await client.end();
  }
}

function planFiles(references: Map<string, number[]>, privateFiles: string[], staticFiles: string[], dirs: { privateDir: string; staticDir: string }): FilePlan[] {
  const plans: FilePlan[] = [];
  const claimedStatic = new Set<string>();

  for (const [name, guideIds] of references) {
    const inPrivate = findFile(privateFiles, name);
    const inStatic = findFile(staticFiles, name);
    if (inPrivate.found === name) {
      plans.push({ name, action: 'already-private', guideIds });
    } else if (inPrivate.found) {
      plans.push({ name, action: 'rename-in-private', sourcePath: path.join(dirs.privateDir, inPrivate.found), guideIds, note: `case fix: ${inPrivate.found} → ${name}` });
    } else if (inStatic.found) {
      claimedStatic.add(inStatic.found);
      plans.push({
        name,
        action: 'move',
        sourcePath: path.join(dirs.staticDir, inStatic.found),
        guideIds,
        note: inStatic.found !== name ? `case fix: ${inStatic.found} → ${name}` : undefined,
      });
    } else {
      const ambiguous = inPrivate.ambiguous || inStatic.ambiguous;
      plans.push(
        ambiguous
          ? { name, action: 'conflict', guideIds, note: 'several files differ only by case; resolve by hand' }
          : { name, action: 'missing', guideIds },
      );
    }
  }

  // Unreferenced documents still sitting in the public folder: move them too
  for (const file of staticFiles) {
    if (claimedStatic.has(file) || !isDocument(file)) {
      continue;
    }
    if (privateFiles.includes(file) || plans.some((p) => p.name === file)) {
      plans.push({ name: file, action: 'conflict', guideIds: [], note: `public copy ${path.join(dirs.staticDir, file)} also exists in private storage; remove the public one by hand after comparing` });
      continue;
    }
    plans.push({ name: file, action: 'move', sourcePath: path.join(dirs.staticDir, file), guideIds: [], note: 'not referenced by any guide' });
  }
  return plans;
}

async function moveFile(source: string, target: string): Promise<void> {
  const caseOnlyRename = path.dirname(source) === path.dirname(target) && source.toLowerCase() === target.toLowerCase();
  if (!caseOnlyRename) {
    try {
      await fs.access(target);
      throw new Error(`refusing to overwrite ${target}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }
  try {
    await fs.rename(source, target);
  } catch (error) {
    // Separate Docker mounts are separate devices: copy, then remove the public original
    if ((error as NodeJS.ErrnoException).code !== 'EXDEV') {
      throw error;
    }
    await fs.copyFile(source, target, fsConstants.COPYFILE_EXCL);
    await fs.unlink(source);
  }
}

async function main(): Promise<void> {
  const { staticRoot, privateRoot } = resolveRoots();
  const staticDir = path.join(staticRoot, MEDIA_FOR);
  const privateDir = path.join(privateRoot, MEDIA_FOR);
  console.log(`${apply ? 'APPLY' : 'DRY RUN'}  ${staticDir}  →  ${privateDir}\n`);

  const references = await loadReferences();
  const plans = planFiles(references, await listFiles(privateDir), await listFiles(staticDir), { privateDir, staticDir });

  if (apply) {
    await fs.mkdir(privateDir, { recursive: true, mode: 0o750 });
  }
  for (const plan of plans) {
    const guides = plan.guideIds.length ? `guide ${plan.guideIds.join(', ')}` : 'unreferenced';
    const note = plan.note ? `  (${plan.note})` : '';
    console.log(`  ${plan.action.padEnd(17)} ${plan.name.padEnd(36)} ${guides}${note}`);
    if (apply && plan.sourcePath && (plan.action === 'move' || plan.action === 'rename-in-private')) {
      await moveFile(plan.sourcePath, path.join(privateDir, plan.name));
    }
  }

  const count = (action: FileAction) => plans.filter((p) => p.action === action).length;
  console.log(
    `\n${plans.length} files: ${count('already-private')} already private, ${count('move')} to move, ` +
      `${count('rename-in-private')} to rename, ${count('missing')} missing, ${count('conflict')} conflicts`,
  );
  if (!apply && (count('move') || count('rename-in-private'))) {
    console.log('Dry run only: re-run with --apply to move the files.');
  }
  if (count('missing') || count('conflict')) {
    process.exitCode = 2;
  }
}

main().catch((error: Error) => {
  console.error(`Failed: ${error.message}`);
  process.exitCode = 1;
});
