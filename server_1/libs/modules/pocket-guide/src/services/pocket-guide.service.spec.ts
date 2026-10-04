import { promises as fs } from 'fs';
import * as path from 'path';
import { NotFoundException } from '@nestjs/common';
import { IMediaUpload } from '@eatfit247-shared-lib';
import { AppConfigService, Env } from '@server_1/core';
import { MstPocketGuide } from '../models';
import { PocketGuideService } from './pocket-guide.service';

const upload = (webUrl: string): IMediaUpload => ({
  fieldName: 'file',
  originalName: path.basename(webUrl),
  encoding: '7bit',
  mimetype: 'application/pdf',
  fileName: path.basename(webUrl),
  size: 10,
  webUrl,
});

interface IGuideRow {
  pocketGuideId: number;
  pocketGuide: string;
  filePath: IMediaUpload[] | null;
  active: boolean;
}

describe('PocketGuideService', () => {
  const findOne = jest.fn<Promise<IGuideRow | null>, [unknown]>();
  const repository = { findOne, scope: jest.fn(() => ({ findOne })) };
  const service = new PocketGuideService(
    repository as unknown as typeof MstPocketGuide,
    {} as AppConfigService,
  );

  beforeAll(async () => {
    await fs.mkdir(path.join(Env.privateAssetPath, 'pocket-guide'), { recursive: true });
    await fs.writeFile(path.join(Env.privateAssetPath, 'pocket-guide', 'DetoxDiet.pdf'), 'pdf');
  });

  afterAll(async () => {
    await fs.rm(Env.privateAssetPath, { recursive: true, force: true });
  });

  beforeEach(() => findOne.mockReset());

  describe('fetchById', () => {
    it('flags a private file and gives its download name', async () => {
      findOne.mockResolvedValue({
        pocketGuideId: 9,
        pocketGuide: 'Detox Diet',
        filePath: [upload('private://pocket-guide/DetoxDiet.pdf')],
        active: true,
      });
      const guide = await service.fetchById(9);
      expect(guide.hasFile).toBe(true);
      expect(guide.downloadFileName).toBe('Detox Diet.pdf');
    });

    it('reports no file for a guide without one', async () => {
      findOne.mockResolvedValue({ pocketGuideId: 9, pocketGuide: 'Detox Diet', filePath: null, active: true });
      const guide = await service.fetchById(9);
      expect(guide.hasFile).toBe(false);
      expect(guide.downloadFileName).toBeUndefined();
    });
  });

  describe('getDownloadFile', () => {
    it('returns the file of an inactive guide too (no active filter)', async () => {
      findOne.mockResolvedValue({
        pocketGuideId: 9,
        pocketGuide: 'Detox Diet',
        filePath: [upload('private://pocket-guide/DetoxDiet.pdf')],
        active: false,
      });
      const file = await service.getDownloadFile(9);
      expect(file.downloadFileName).toBe('Detox Diet.pdf');
      expect(file.contentType).toBe('application/pdf');
      expect(findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { pocketGuideId: 9 } }));
    });

    it('404s for an unknown guide', async () => {
      findOne.mockResolvedValue(null);
      await expect(service.getDownloadFile(404)).rejects.toThrow(new NotFoundException('Pocket guide not found'));
    });

    it('404s when the guide has no private file (including pre-migration public paths)', async () => {
      findOne.mockResolvedValue({
        pocketGuideId: 9,
        pocketGuide: 'Detox Diet',
        filePath: [upload('media-files/pocket-guide/DetoxDiet.pdf')],
        active: true,
      });
      await expect(service.getDownloadFile(9)).rejects.toThrow('This pocket guide has no file');
    });

    it('404s with a clear message when the file is missing on disk', async () => {
      findOne.mockResolvedValue({
        pocketGuideId: 9,
        pocketGuide: 'Detox Diet',
        filePath: [upload('private://pocket-guide/Gone.pdf')],
        active: true,
      });
      await expect(service.getDownloadFile(9)).rejects.toThrow('Pocket guide file is missing on the server');
    });
  });
});
