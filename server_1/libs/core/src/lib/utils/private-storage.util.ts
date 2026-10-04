import * as path from 'path';
import { MediaForEnum } from '@eatfit247-shared-lib';
import { Env } from '../config/env.values';

/**
 * Files under Env.privateAssetPath are never served statically. They are stored in
 * IMediaUpload.webUrl as `private://<mediaFor>/<fileName>`, which does not resolve to
 * any public URL, and are read back on the server only (authenticated downloads, email attachments).
 */
export class PrivateStorageUtil {
  public static readonly REFERENCE_PREFIX = 'private://';

  // Media categories whose documents are private. Their images (thumbnails) stay public.
  private static readonly PRIVATE_DOCUMENT_CATEGORIES: ReadonlySet<string> = new Set([MediaForEnum.POCKET_GUIDE]);
  private static readonly PUBLIC_IMAGE_EXTENSIONS: ReadonlySet<string> = new Set([
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
    '.svg',
  ]);

  /** Fails closed: in a private category, only a file that is an image by both mimetype and extension stays public. */
  public static isPrivateUpload(mediaFor: string, fileName: string, mimetype: string): boolean {
    if (!PrivateStorageUtil.PRIVATE_DOCUMENT_CATEGORIES.has(mediaFor)) {
      return false;
    }
    const isImage =
      (mimetype || '').toLowerCase().startsWith('image/') &&
      PrivateStorageUtil.PUBLIC_IMAGE_EXTENSIONS.has(path.extname(fileName).toLowerCase());
    return !isImage;
  }

  public static folderPath(mediaFor: string): string {
    return PrivateStorageUtil.resolveInsideRoot(mediaFor);
  }

  public static toReference(mediaFor: string, fileName: string): string {
    return `${PrivateStorageUtil.REFERENCE_PREFIX}${mediaFor}/${fileName}`;
  }

  public static isReference(webUrl: string | null | undefined): boolean {
    return !!webUrl && webUrl.startsWith(PrivateStorageUtil.REFERENCE_PREFIX);
  }

  /** Absolute path for a `private://` reference. Throws if it is not a reference or escapes the private root. */
  public static resolvePath(reference: string): string {
    if (!PrivateStorageUtil.isReference(reference)) {
      throw new Error('Not a private storage reference');
    }
    return PrivateStorageUtil.resolveInsideRoot(reference.substring(PrivateStorageUtil.REFERENCE_PREFIX.length));
  }

  private static resolveInsideRoot(relativePath: string): string {
    const root = path.resolve(Env.privateAssetPath);
    const resolved = path.resolve(root, relativePath);
    const relative = path.relative(root, resolved);
    if (!relative || relative.split(path.sep)[0] === '..' || path.isAbsolute(relative)) {
      throw new Error('Path escapes private storage root');
    }
    return resolved;
  }
}
