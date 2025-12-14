import type { HttpClient } from './client';
import type { ApiResult } from '../types';

export interface StorageFile {
  id: string;
  bucket: string;
  path: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

export interface StorageListItem {
  name: string;
  size: number;
  createdAt: string;
}

export interface UploadOptions {
  cacheControl?: string;
  upsert?: boolean;
}

export class StorageClient {
  constructor(private client: HttpClient) {}

  /**
   * Get a bucket client for performing operations
   */
  from(bucket: string): StorageBucket {
    return new StorageBucket(this.client, bucket);
  }
}

export class StorageBucket {
  constructor(
    private client: HttpClient,
    private bucket: string
  ) {}

  private get basePath(): string {
    return `/api/project/${this.client.getProjectSlug()}/storage/${this.bucket}`;
  }

  /**
   * Upload a file to the bucket
   */
  async upload(
    path: string,
    file: Blob | Buffer | ArrayBuffer,
    options?: UploadOptions
  ): Promise<ApiResult<StorageFile>> {
    const formData = new FormData();

    // Convert to Blob if needed
    let blob: Blob;
    if (file instanceof Blob) {
      blob = file;
    } else if (file instanceof ArrayBuffer) {
      blob = new Blob([file]);
    } else if (Buffer.isBuffer(file)) {
      blob = new Blob([file as any]);
    } else {
      blob = new Blob([file]);
    }

    formData.append('file', blob, path.split('/').pop() || 'file');
    formData.append('path', path);
    if (options?.upsert) {
      formData.append('upsert', 'true');
    }

    const baseUrl = (this.client as any).baseUrl || 'https://api.orbitnest.io';
    const url = `${baseUrl}${this.basePath}/upload`;

    console.log('[StorageBucket] Upload request:', { url, path, bucketName: this.bucket });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${(this.client as any).apiKey}`,
        },
        body: formData,
      });

      let data: any;
      try {
        data = await response.json();
      } catch (jsonErr) {
        const responseText = await response.text();
        console.error('[StorageBucket] Failed to parse response as JSON:', {
          status: response.status,
          statusText: response.statusText,
          responsePreview: responseText.substring(0, 200),
        });
        return {
          data: null,
          error: {
            message: `Upload failed: ${response.status} ${response.statusText}`,
            status: response.status,
            code: 'INVALID_RESPONSE',
          },
        };
      }

      if (!response.ok) {
        return {
          data: null,
          error: {
            message: data?.message || 'Upload failed',
            status: response.status,
          },
        };
      }

      return { data: data.data, error: null };
    } catch (err) {
      console.error('[StorageBucket] Upload error:', err);
      return {
        data: null,
        error: {
          message: err instanceof Error ? err.message : 'Upload failed',
          code: 'UPLOAD_ERROR',
        },
      };
    }
  }

  /**
   * Download a file from the bucket
   */
  async download(path: string): Promise<ApiResult<Blob>> {
    const baseUrl = (this.client as any).baseUrl || 'https://api.orbitnest.io';
    const url = `${baseUrl}${this.basePath}/${path}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${(this.client as any).apiKey}`,
        },
      });

      if (!response.ok) {
        return {
          data: null,
          error: {
            message: 'Download failed',
            status: response.status,
          },
        };
      }

      const blob = await response.blob();
      return { data: blob, error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          message: err instanceof Error ? err.message : 'Download failed',
          code: 'DOWNLOAD_ERROR',
        },
      };
    }
  }

  /**
   * Delete files from the bucket
   */
  async remove(paths: string[]): Promise<ApiResult<{ deleted: string[]; errors: string[] }>> {
    return this.client.request<{ deleted: string[]; errors: string[] }>(this.basePath, {
      method: 'DELETE',
      body: { paths },
    });
  }

  /**
   * List files in the bucket
   */
  async list(
    prefix?: string,
    options?: { limit?: number }
  ): Promise<ApiResult<StorageListItem[]>> {
    const params = new URLSearchParams();
    if (prefix) params.set('prefix', prefix);
    if (options?.limit) params.set('limit', options.limit.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.client.request<StorageListItem[]>(`${this.basePath}${query}`);
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(path: string): { data: { publicUrl: string } } {
    const baseUrl = (this.client as any).baseUrl || 'https://api.orbitnest.io';
    const projectSlug = this.client.getProjectSlug();
    // Use public endpoint that doesn't require authentication
    const publicUrl = `${baseUrl}/api/public/${projectSlug}/storage/${this.bucket}/${path}`;

    return {
      data: { publicUrl },
    };
  }

  /**
   * Create the bucket (if it doesn't exist)
   */
  async createBucket(): Promise<ApiResult<{ bucket: string; created: boolean }>> {
    return this.client.request<{ bucket: string; created: boolean }>(
      `${this.basePath}/create`,
      { method: 'POST' }
    );
  }
}
