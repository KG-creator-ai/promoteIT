// src/workers/pdfWorker.ts
import * as pdfjsLib from 'pdfjs-dist';

// We must initialize the worker SRC correctly for Vite builds
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

self.onmessage = async (e: MessageEvent) => {
  const { type, arrayBuffer } = e.data;

  if (type === 'EXTRACT_TEXT' && arrayBuffer) {
    try {
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const maxPageLimit = 50; // Hard cap per ingestion batch
      const pageCount = Math.min(pdf.numPages, maxPageLimit);

      let fullText = '';
      for (let i = 1; i <= pageCount; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item: any) => item.str)
          .join(' ');
          
        fullText += `--- Page ${i} ---\n` + pageText + '\n';
        
        // Free memory resource per page
        page.cleanup();
      }

      self.postMessage({
        status: 'SUCCESS',
        text: fullText,
        pageCount,
        truncated: pdf.numPages > maxPageLimit
      });
    } catch (error: unknown) {
      const err = error as Error;
      self.postMessage({
        status: 'ERROR',
        code: 'DOCUMENT_PARSING_FAILED',
        message: err?.message || 'Memory limits exceeded or file corrupted. Try extracting a smaller page range.'
      });
      // Explicit termination on error to prevent frozen thread
      self.close();
    }
  }
};
