import { createReadStream, promises as fs } from 'fs';
import * as path from 'path';
import type { Response } from 'express';
import { IMediaUpload } from '@eatfit247-shared-lib';
import { PrivateStorageUtil } from '@server_1/core';

export interface IPocketGuideFile {
  absolutePath: string;
  downloadFileName: string;
  contentType: string;
  size: number;
}

export type PocketGuideFileLookup =
  | { found: true; file: IPocketGuideFile }
  | { found: false; reason: 'no-file' }
  | { found: false; reason: 'missing'; reference: string };

const CONTENT_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

/**
 * Pocket-guide PDFs live in private storage (see PrivateStorageUtil). Shared by the master
 * download, the member-scoped download and the assignment email attachments.
 */
export class PocketGuideFileUtil {
  /** The private file reference in file_path. Public (pre-migration) references don't count. */
  public static getReference(filePath: IMediaUpload[] | null | undefined): IMediaUpload | undefined {
    return Array.isArray(filePath) ? filePath.find((file) => PrivateStorageUtil.isReference(file?.webUrl)) : undefined;
  }

  public static hasFile(filePath: IMediaUpload[] | null | undefined): boolean {
    return !!PocketGuideFileUtil.getReference(filePath);
  }

  /** Guide title + stored extension, e.g. "Khichdi Diet R.pdf" instead of "1694279594335-390517095.pdf". */
  public static downloadFileName(title: string, reference: IMediaUpload): string {
    const extension = path.extname(reference.webUrl || '').toLowerCase() || '.pdf';
    const base = (title || '')
      .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return `${base || 'pocket-guide'}${extension}`;
  }

  public static downloadFileNameFor(title: string, filePath: IMediaUpload[] | null | undefined): string | undefined {
    const reference = PocketGuideFileUtil.getReference(filePath);
    return reference ? PocketGuideFileUtil.downloadFileName(title, reference) : undefined;
  }

  /** Finds the guide's file on disk. Never throws: a bad or escaping reference counts as missing. */
  public static async locate(title: string, filePath: IMediaUpload[] | null | undefined): Promise<PocketGuideFileLookup> {
    const reference = PocketGuideFileUtil.getReference(filePath);
    if (!reference) {
      return { found: false, reason: 'no-file' };
    }
    try {
      const absolutePath = PrivateStorageUtil.resolvePath(reference.webUrl);
      const stat = await fs.stat(absolutePath);
      if (!stat.isFile()) {
        return { found: false, reason: 'missing', reference: reference.webUrl };
      }
      return {
        found: true,
        file: {
          absolutePath,
          downloadFileName: PocketGuideFileUtil.downloadFileName(title, reference),
          contentType: CONTENT_TYPES[path.extname(absolutePath).toLowerCase()] || 'application/octet-stream',
          size: stat.size,
        },
      };
    } catch {
      return { found: false, reason: 'missing', reference: reference.webUrl };
    }
  }

  /** RFC 6266 header: ASCII fallback plus the UTF-8 name for browsers that support it. */
  public static contentDisposition(fileName: string): string {
    const asciiName = fileName.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
    return `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
  }

  /** Streams the file as an attachment. Used with @Res(), which bypasses TransformInterceptor. */
  public static send(res: Response, file: IPocketGuideFile): void {
    res.set({
      'Content-Type': file.contentType,
      'Content-Length': String(file.size),
      'Content-Disposition': PocketGuideFileUtil.contentDisposition(file.downloadFileName),
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    const stream = createReadStream(file.absolutePath);
    stream.on('error', () => {
      if (res.headersSent) {
        res.destroy();
      } else {
        res.removeHeader('Content-Type');
        res.removeHeader('Content-Disposition');
        res.removeHeader('Content-Length');
        res.status(500).json({ code: 500, message: 'Could not read the pocket guide file' });
      }
    });
    stream.pipe(res);
  }
}
