import { promises as fs } from 'fs';
import * as path from 'path';
import { IMediaUpload } from '@eatfit247-shared-lib';
import { Env } from '@server_1/core';
import { PocketGuideFileUtil } from './pocket-guide-file.util';

const upload = (webUrl: string): IMediaUpload => ({
  fieldName: 'file',
  originalName: path.basename(webUrl),
  encoding: '7bit',
  mimetype: 'application/pdf',
  fileName: path.basename(webUrl),
  size: 10,
  webUrl,
});

describe('PocketGuideFileUtil', () => {
  const folder = path.join(Env.privateAssetPath, 'pocket-guide');

  beforeAll(async () => {
    await fs.mkdir(path.join(folder, 'a-folder.pdf'), { recursive: true });
    await fs.writeFile(path.join(folder, 'DetoxDiet.pdf'), 'pdf-bytes');
  });

  afterAll(async () => {
    await fs.rm(Env.privateAssetPath, { recursive: true, force: true });
  });

  describe('hasFile', () => {
    it.each([
      [[upload('private://pocket-guide/DetoxDiet.pdf')], true],
      [[upload('media-files/pocket-guide/DetoxDiet.pdf')], false],
      [[], false],
      [null, false],
    ])('%j → %p', (filePath, expected) => {
      expect(PocketGuideFileUtil.hasFile(filePath)).toBe(expected);
    });
  });

  describe('downloadFileName', () => {
    it('uses the guide title with the stored extension', () => {
      const reference = upload('private://pocket-guide/1694279594335-390517095.pdf');
      expect(PocketGuideFileUtil.downloadFileName('Khichdi Diet R', reference)).toBe('Khichdi Diet R.pdf');
    });

    it('strips characters that are illegal in file names and collapses spaces', () => {
      const reference = upload('private://pocket-guide/x.PDF');
      expect(PocketGuideFileUtil.downloadFileName(' Travel / guide:  "Keto" ', reference)).toBe('Travel guide Keto.pdf');
    });

    it('falls back when the title is empty', () => {
      expect(PocketGuideFileUtil.downloadFileName('', upload('private://pocket-guide/x.pdf'))).toBe('pocket-guide.pdf');
    });
  });

  describe('contentDisposition', () => {
    it('adds an ASCII fallback and a UTF-8 filename*', () => {
      expect(PocketGuideFileUtil.contentDisposition('Navratri — Guide.pdf')).toBe(
        `attachment; filename="Navratri _ Guide.pdf"; filename*=UTF-8''Navratri%20%E2%80%94%20Guide.pdf`,
      );
    });
  });

  describe('locate', () => {
    it('finds a private file with its size, type and friendly name', async () => {
      const lookup = await PocketGuideFileUtil.locate('Detox Diet', [upload('private://pocket-guide/DetoxDiet.pdf')]);
      expect(lookup).toEqual({
        found: true,
        file: {
          absolutePath: path.join(folder, 'DetoxDiet.pdf'),
          downloadFileName: 'Detox Diet.pdf',
          contentType: 'application/pdf',
          size: 'pdf-bytes'.length,
        },
      });
    });

    it('reports no-file for a guide without a private reference', async () => {
      expect(await PocketGuideFileUtil.locate('x', [upload('media-files/pocket-guide/DetoxDiet.pdf')])).toEqual({
        found: false,
        reason: 'no-file',
      });
    });

    it.each([
      ['private://pocket-guide/Gone.pdf'],
      ['private://pocket-guide/a-folder.pdf'],
      ['private://pocket-guide/../../etc/passwd'],
    ])('reports %p as missing', async (webUrl) => {
      expect(await PocketGuideFileUtil.locate('x', [upload(webUrl)])).toEqual({
        found: false,
        reason: 'missing',
        reference: webUrl,
      });
    });
  });
});
