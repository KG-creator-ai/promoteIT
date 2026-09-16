import React, { useState, useRef, useCallback } from 'react';
import { importCampaignZip, type ImportResult } from '../../lib/zipImporter';
import { Upload, FileArchive, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface ImportProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (result: ImportResult) => void;
}

export function ImportProjectModal({ isOpen, onClose, onImportComplete }: ImportProjectModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.zip') && !file.name.endsWith('.promoteit')) {
      setError('Please upload a .zip or .promoteit file.');
      return;
    }
    setIsImporting(true);
    setError('');
    setResult(null);
    try {
      const importResult = await importCampaignZip(file);
      setResult(importResult);
      onImportComplete(importResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setIsImporting(false);
    }
  }, [onImportComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }, [handleFile]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-label="Import Project">
      <div className="w-full max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Import Project Archive</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Upload a .zip or .promoteit backup file</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {result ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Import Successful</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                "{result.title}" — {result.sceneCount} scenes, {result.resourceCount} resources
              </p>
              <button
                onClick={onClose}
                className="mt-6 px-6 py-2.5 min-h-[44px] bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Open Imported Campaign
              </button>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all min-h-[200px] flex flex-col items-center justify-center ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-slate-300 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              {isImporting ? (
                <Loader2 className="w-8 h-8 mx-auto mb-3 text-primary animate-spin" />
              ) : (
                <FileArchive className="w-12 h-12 mx-auto mb-3 text-slate-400" />
              )}
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isImporting ? 'Importing...' : 'Drop your archive here'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Supports .zip and .promoteit files
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,.promoteit"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
