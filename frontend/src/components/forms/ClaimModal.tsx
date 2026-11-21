import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { claimService } from '../../services/claimService';
import { itemService } from '../../services/itemService';
import { LostItem } from '../../types';

interface ClaimModalProps {
  foundItemId: string;
  foundItemTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({
  foundItemId,
  foundItemTitle,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [myLostItems, setMyLostItems] = useState<LostItem[]>([]);
  const [selectedLostId, setSelectedLostId] = useState<string>('');
  const [proofDescription, setProofDescription] = useState<string>('');
  const [serialOrMarkings, setSerialOrMarkings] = useState<string>('');
  const [passcodeOrContents, setPasscodeOrContents] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      itemService.getMyLostReports().then(items => {
        const activeReports = items.filter(i => i.status === 'active' || i.status === 'potential_match');
        setMyLostItems(activeReports);
        if (activeReports.length > 0) {
          setSelectedLostId(activeReports[0].id);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedLostId) {
      setErrorMsg('Please select which of your reported lost items corresponds to this claim, or report a lost item first.');
      return;
    }

    if (!proofDescription.trim() || proofDescription.length < 10) {
      setErrorMsg('Please provide a detailed proof description (at least 10 characters).');
      return;
    }

    try {
      setSubmitting(true);
      await claimService.submitClaim({
        lost_item_id: selectedLostId,
        found_item_id: foundItemId,
        proof_description: proofDescription,
        proof_answers: {
          unique_markings: serialOrMarkings,
          contents_or_lock: passcodeOrContents
        }
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to submit ownership claim.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Claim Ownership: {foundItemTitle}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
            <strong>Security Notice:</strong> Do not publicly disclose secret details. The information provided below is sent directly and securely to HITK campus administrators for physical verification.
          </div>

          <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
            <strong>HITK Handover Procedure:</strong> Once approved by an administrator, proceed to the <strong>Campus Security Desk (Gate 1 Main Entrance)</strong> or Student Affairs Office (Central Block) with your official HITK Student ID card for physical collection.
          </div>

          {/* Reference Lost Item Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Your Reported Lost Item *
            </label>
            {myLostItems.length > 0 ? (
              <select
                value={selectedLostId}
                onChange={(e) => setSelectedLostId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {myLostItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.title} ({item.category} - Lost {item.approximate_date_lost?.slice(0, 10)})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                You do not have an active lost report yet. You must first create a lost report for this item to establish ownership.
              </div>
            )}
          </div>

          {/* Private Distinguishing Proof Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Private Distinguishing Characteristics *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Describe subtle traits only the genuine owner would know (e.g. scratch on the bottom right corner, specific keychain, stickers, or brand logo position)..."
              value={proofDescription}
              onChange={(e) => setProofDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          {/* Verification Questions */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Verification Proof (Optional but Recommended)
            </h4>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Serial Number, Name Tag, or Special Engravings:
              </label>
              <input
                type="text"
                placeholder="e.g. Serial SN-4892... or 'Jane Doe' inside flap"
                value={serialOrMarkings}
                onChange={(e) => setSerialOrMarkings(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Internal Contents or Lock Screen Details:
              </label>
              <input
                type="text"
                placeholder="e.g. Photo of a golden retriever wallpaper, 3 blue notebooks inside..."
                value={passcodeOrContents}
                onChange={(e) => setPasscodeOrContents(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || myLostItems.length === 0}
              className="px-5 py-2 text-xs font-bold bg-[#4338ca] hover:bg-[#3730a3] text-white rounded-full shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-1.5 transition-all"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Submit Claim for Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
