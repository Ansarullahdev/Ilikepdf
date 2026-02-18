
import { jsPDF } from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { UploadedImage, PDFSettings } from '../types';

// Initialize PDF.js worker
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs`;

export const generatePDF = async (images: UploadedImage[], settings: PDFSettings): Promise<void> => {
  if (images.length === 0) return;

  const pdf = new jsPDF({
    orientation: settings.orientation,
    unit: 'mm',
    format: settings.pageSize === 'original' ? 'a4' : settings.pageSize
  });

  const margin = settings.margin;

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const imgElement = new Image();
    imgElement.src = img.previewUrl;
    
    await new Promise((resolve) => {
      imgElement.onload = resolve;
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const ratio = imgElement.width / imgElement.height;

    let targetWidth = pdfWidth - (margin * 2);
    let targetHeight = targetWidth / ratio;

    if (targetHeight > (pdfHeight - (margin * 2))) {
      targetHeight = pdfHeight - (margin * 2);
      targetWidth = targetHeight * ratio;
    }

    const xOffset = (pdfWidth - targetWidth) / 2;
    const yOffset = (pdfHeight - targetHeight) / 2;

    if (i > 0) pdf.addPage();
    pdf.addImage(img.previewUrl, 'JPEG', xOffset, yOffset, targetWidth, targetHeight, undefined, 'FAST');
  }

  pdf.save(`${settings.filename || 'converted_document'}.pdf`);
};

export const splitPDF = async (pdfFile: File, pageIndexes: number[]): Promise<void> => {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const newPdf = await PDFDocument.create();

  const pages = await newPdf.copyPages(pdfDoc, pageIndexes);
  pages.forEach(page => newPdf.addPage(page));

  const pdfBytes = await newPdf.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `split_${pdfFile.name}`;
  link.click();
};

export const mergePDFs = async (files: File[]): Promise<void> => {
  const mergedPdf = await PDFDocument.create();
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  const pdfBytes = await mergedPdf.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `merged_document.pdf`;
  link.click();
};

export const renderPdfPages = async (file: File): Promise<string[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pagePreviews: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 0.5 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (context) {
      await page.render({ canvasContext: context, viewport }).promise;
      pagePreviews.push(canvas.toDataURL('image/png'));
    }
  }
  return pagePreviews;
};
