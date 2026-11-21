import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { aiService, ImageAnalysisResponse } from '../../services/aiService';

interface ImageUploadDropzoneProps {
  onAnalysisComplete: (result: ImageAnalysisResponse) => void;
  disabled?: boolean;
}

export const ImageUploadDropzone: React.FC<ImageUploadDropzoneProps> = ({
  onAnalysisComplete,
  disabled = false
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setErrorMsg(null);

    // Validate size (< 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File size exceeds 10MB limit.');
      return;
    }

    // Validate format
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Please upload a JPEG, PNG, or WEBP image.');
      return;
    }

    // Generate local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Run AI analysis
    try {
      setAnalyzing(true);
      const res = await aiService.analyzeImage(file);
      onAnalysisComplete(res);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'AI image analysis failed. You can still fill the form manually.');
    } finally {
      setAnalyzing(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || analyzing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
          }
        }}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !analyzing && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 overflow-hidden ${
          dragOver
            ? 'border-brand-500 bg-brand-50/50 scale-[1.01]'
            : previewUrl
            ? 'border-brand-300 bg-slate-50'
            : 'border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {previewUrl ? (
          <div className="relative group max-w-sm mx-auto">
            <img
              src={previewUrl}
              alt="Uploaded item preview"
              className="max-h-56 mx-auto rounded-xl object-contain shadow-sm border border-slate-200"
            />
            {!analyzing && (
              <button
                type="button"
                onClick={clearImage}
                className="absolute -top-2 -right-2 p-1.5 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition-colors"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {analyzing && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center text-white p-4">
                <Loader2 className="w-8 h-8 animate-spin text-brand-400 mb-2" />
                <span className="text-sm font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Gemini Vision Analyzing...
                </span>
                <p className="text-[11px] text-slate-300 mt-1">
                  Extracting object type, color, brand, and features
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Drop item photograph here, or <span className="text-brand-600">browse files</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports JPEG, PNG, WEBP up to 10MB
            </p>

            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Auto-detects category, color & brand with Gemini Vision
            </div>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="mt-2.5 flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
