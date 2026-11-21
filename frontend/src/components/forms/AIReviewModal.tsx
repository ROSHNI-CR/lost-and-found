import React, { useState } from 'react';
import { Sparkles, Check, Edit3, X, AlertCircle } from 'lucide-react';
import { AIExtractedAttributes } from '../../types';

interface AIReviewModalProps {
  attributes: AIExtractedAttributes;
  isOpen: boolean;
  onConfirm: (confirmed: AIExtractedAttributes) => void;
  onClose: () => void;
}

export const AIReviewModal: React.FC<AIReviewModalProps> = ({
  attributes,
  isOpen,
  onConfirm,
  onClose
}) => {
  const [formState, setFormState] = useState<AIExtractedAttributes>({ ...attributes });

  if (!isOpen) return null;

  const handleColorChange = (index: number, val: string) => {
    const next = [...(formState.color || [])];
    next[index] = val;
    setFormState({ ...formState, color: next });
  };

  const handleAddColor = () => {
    setFormState({ ...formState, color: [...(formState.color || []), ''] });
  };

  const handleRemoveColor = (index: number) => {
    const next = (formState.color || []).filter((_, i) => i !== index);
    setFormState({ ...formState, color: next });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-brand-700 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-base">Gemini AI Attribute Review</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice */}
        <div className="px-6 py-3 bg-indigo-50 border-b border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-900">
          <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
          <p>
            Gemini analyzed your photograph. Review and adjust any extracted attributes below before applying them to your report.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Object Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detected Object Name
            </label>
            <input
              type="text"
              value={formState.object_name || ''}
              onChange={(e) => setFormState({ ...formState, object_name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category
            </label>
            <input
              type="text"
              value={formState.category || ''}
              onChange={(e) => setFormState({ ...formState, category: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          {/* Brand */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Brand (Leave blank if unverified)
            </label>
            <input
              type="text"
              value={formState.brand || ''}
              placeholder="e.g. Apple, Milton, Nike"
              onChange={(e) => setFormState({ ...formState, brand: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          {/* Colors */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Detected Colors</label>
              <button
                type="button"
                onClick={handleAddColor}
                className="text-xs text-brand-600 hover:underline font-medium"
              >
                + Add Color
              </button>
            </div>
            <div className="space-y-1.5">
              {(formState.color || []).map((clr, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={clr}
                    onChange={(e) => handleColorChange(i, e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none capitalize"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveColor(i)}
                    className="px-2 text-xs text-rose-500 hover:bg-rose-50 rounded-lg"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* AI Generated Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Generated Description
            </label>
            <textarea
              rows={3}
              value={formState.description || ''}
              onChange={(e) => setFormState({ ...formState, description: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(formState)}
            className="px-5 py-2 text-xs font-semibold bg-brand-700 hover:bg-brand-800 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Confirm & Apply Attributes
          </button>
        </div>
      </div>
    </div>
  );
};
