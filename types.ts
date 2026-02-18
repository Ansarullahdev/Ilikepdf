
export type AppView = 'IMAGE_TO_PDF' | 'PDF_TO_IMAGE' | 'PDF_SPLIT' | 'PDF_MERGE';

export interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  rotation: number;
}

export interface PDFSettings {
  pageSize: 'a4' | 'letter' | 'original';
  orientation: 'portrait' | 'landscape';
  margin: number;
  filename: string;
}

export interface PDFPagePreview {
  index: number;
  dataUrl: string;
  selected: boolean;
}

export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  DOWNLOADING = 'DOWNLOADING',
  ERROR = 'ERROR'
}
