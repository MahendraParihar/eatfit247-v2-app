import { MediaForEnum } from '@eatfit247-shared-lib';
import { resolvePrivateAssetPath } from '../config/config.utils';
import { PrivateStorageUtil } from './private-storage.util';

jest.mock('../config/env.values', () => ({ Env: { privateAssetPath: '/srv/eatfit/private-files' } }));

describe('resolvePrivateAssetPath', () => {
  it('defaults to a private-files folder next to the static root', () => {
    expect(resolvePrivateAssetPath('/srv/eatfit/media-files')).toBe('/srv/eatfit/private-files');
  });

  it('uses the configured path when it is outside the static root', () => {
    expect(resolvePrivateAssetPath('/srv/eatfit/media-files', '/data/private')).toBe('/data/private');
  });

  it.each([
    ['/srv/eatfit/media-files'],
    ['/srv/eatfit/media-files/private'],
    ['/srv/eatfit/media-files/../media-files/x'],
    ['/srv/eatfit'],
  ])('rejects %p because it overlaps the static root', (configured) => {
    expect(() => resolvePrivateAssetPath('/srv/eatfit/media-files', configured)).toThrow();
  });

  it('accepts a sibling whose name only starts with the static folder name', () => {
    expect(resolvePrivateAssetPath('/srv/eatfit/media-files', '/srv/eatfit/media-files-private')).toBe(
      '/srv/eatfit/media-files-private',
    );
  });
});

describe('PrivateStorageUtil', () => {
  describe('isPrivateUpload', () => {
    it.each([
      [MediaForEnum.POCKET_GUIDE, 'DetoxDiet.pdf', 'application/pdf', true],
      [MediaForEnum.POCKET_GUIDE, 'DetoxDiet.docx', 'application/octet-stream', true],
      [MediaForEnum.POCKET_GUIDE, 'DetoxDiet.pdf', 'image/png', true],
      [MediaForEnum.POCKET_GUIDE, 'DetoxDiet.png', 'application/pdf', true],
      [MediaForEnum.POCKET_GUIDE, 'DetoxDiet.png', 'image/png', false],
      [MediaForEnum.POCKET_GUIDE, 'DetoxDiet.JPG', 'image/jpeg', false],
      [MediaForEnum.RECIPE, 'recipe.pdf', 'application/pdf', false],
      [MediaForEnum.BLOG, 'cover.png', 'image/png', false],
    ])('%p %p (%p) → %p', (mediaFor, fileName, mimetype, expected) => {
      expect(PrivateStorageUtil.isPrivateUpload(mediaFor, fileName, mimetype)).toBe(expected);
    });
  });

  it('builds and recognises references', () => {
    const reference = PrivateStorageUtil.toReference(MediaForEnum.POCKET_GUIDE, 'DetoxDiet.pdf');
    expect(reference).toBe('private://pocket-guide/DetoxDiet.pdf');
    expect(PrivateStorageUtil.isReference(reference)).toBe(true);
    expect(PrivateStorageUtil.isReference('media-files/pocket-guide/DetoxDiet.pdf')).toBe(false);
    expect(PrivateStorageUtil.isReference(undefined)).toBe(false);
  });

  it('resolves a reference inside the private root', () => {
    expect(PrivateStorageUtil.resolvePath('private://pocket-guide/DetoxDiet.pdf')).toBe(
      '/srv/eatfit/private-files/pocket-guide/DetoxDiet.pdf',
    );
    expect(PrivateStorageUtil.folderPath(MediaForEnum.POCKET_GUIDE)).toBe('/srv/eatfit/private-files/pocket-guide');
  });

  it.each([
    ['private://../media-files/x.pdf'],
    ['private://pocket-guide/../../etc/passwd'],
    ['private:///etc/passwd'],
    ['private://'],
    ['media-files/pocket-guide/DetoxDiet.pdf'],
  ])('refuses %p', (reference) => {
    expect(() => PrivateStorageUtil.resolvePath(reference)).toThrow();
  });
});
