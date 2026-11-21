import React, { useEffect, useState } from 'react';
import { ShieldCheck, Calendar, Clock, AlertCircle, CheckCircle2, XCircle, ArrowRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { claimService } from '../services/claimService';
import { Claim } from '../types';
import { Badge } from '../components/common/Badge';

export const ClaimsPage: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    claimService.getMyClaims()
      .then(res => setClaims(res))
      .catch(err => console.error('Failed to load claims:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
          <span>Campus Ownership Verification</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#0e1f38] tracking-tight">
          My Ownership Claims
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Track the status of your submitted claims, Gate 1 verification stages, and administrative feedback.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs font-semibold text-slate-400">Loading your claims...</div>
      ) : claims.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-4 shadow-xs">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-black text-base text-[#0e1f38]">No Claims Submitted Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            When you spot an item in the Found Registry that belongs to you or receive an AI match alert, you can submit an ownership claim with secret identifying proof.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              to="/found-items"
              className="px-5 py-2 text-xs font-bold bg-[#4338ca] text-white rounded-full hover:bg-[#3730a3]"
            >
              Browse Found Registry
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map(c => (
            <div
              key={c.id}
              className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="font-extrabold text-base text-[#0e1f38]">
                    Claim for {c.found_item?.title || 'Found Belonging'}
                  </span>
                  <Badge status={c.status} />
                </div>
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Submitted {c.created_at?.slice(0, 10)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">Referenced Lost Report</span>
                  <p className="text-[#0e1f38] font-bold text-sm">{c.lost_item?.title || 'My Lost Report'}</p>
                  <p className="text-slate-500">Category: {c.lost_item?.category}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">Handover / Depository</span>
                  <p className="text-[#0e1f38] font-bold text-sm">{c.found_item?.storage_location || 'Campus Security Gate 1'}</p>
                  <p className="text-slate-500">Found near: {c.found_item?.location_found}</p>
                </div>
              </div>

              {/* Distinguishing proof snippet */}
              <div className="text-xs space-y-1">
                <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">Provided Identifying Proof:</span>
                <p className="text-slate-600 italic bg-slate-50/80 p-3 rounded-2xl border border-slate-200/70">
                  "{c.proof_description}"
                </p>
              </div>

              {/* Admin feedback banner */}
              {c.admin_feedback && (
                <div className={`p-4 rounded-2xl border text-xs flex items-start gap-2.5 ${
                  c.status === 'approved'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  {c.status === 'approved' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold block uppercase tracking-wider text-[10px]">
                      Campus Administrator Verification Notes
                    </span>
                    <p className="mt-0.5 leading-relaxed font-medium">{c.admin_feedback}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
