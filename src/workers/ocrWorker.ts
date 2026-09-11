import { createWorker, PSM } from 'tesseract.js';

self.onmessage = async (e: MessageEvent) => {
  const { type, imageBlob, language = 'eng' } = e.data;

  if (type === 'EXTRACT_OCR' && imageBlob) {
    let worker: any;
    try {
      worker = await createWorker(language);
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO,
      });

      // tesseract.js worker uses image blobs directly
      const ret = await worker.recognize(imageBlob);

      self.postMessage({
        status: 'SUCCESS',
        text: ret.data.text,
        confidence: ret.data.confidence
      });
    } catch (error: unknown) {
      const err = error as Error;
      self.postMessage({
        status: 'ERROR',
        code: 'OCR_PARSING_FAILED',
        message: err?.message || 'OCR failed or memory limit exceeded.'
      });
    } finally {
      if (worker) {
        await worker.terminate();
      }
      self.close();
    }
  }
};
