import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Sparkles,
  ShieldCheck,
  Tag,
  ArrowLeft,
  ChevronRight,
  ShieldAlert,
  Clock,
  Building,
  Layers,
  AlertCircle
} from 'lucide-react';
import { itemService } from '../services/itemService';
import { matchService } from '../services/matchService';
import { Badge } from '../components/common/Badge';
import { ClaimModal } from '../components/forms/ClaimModal';
import { useAuth } from '../context/AuthContext';
import { Match } from '../types';

export const ItemDetailsPage: React.FC = () => {
  const { type, id } = useParams<{ type: 'lost' | 'found'; id: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [item, setItem] = useState<any>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [claimModalOpen, setClaimModalOpen] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !type) return;

    const fetchDetails = async () => {
      try {
        setLoading(true);
        const data = type === 'lost'
          ? await itemService.getLostItem(id)
          : await itemService.getFoundItem(id);
        setItem(data);

        // Fetch matches if available
        if (isAuthenticated) {
          const matchData = await matchService.getItemMatches(id, type);
          setMatches(matchData);
        }
      } catch (err: any) {
        setErrorMsg('Item not found or failed to load details.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, type, isAuthenticated]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-xs text-slate-400">
        Loading report details...
      </div>
    );
  }

  if (errorMsg || !item) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Report Not Found</h2>
        <p className="text-xs text-slate-500">{errorMsg || 'This report may have been withdrawn or removed.'}</p>
        <Link
          to={type === 'lost' ? '/lost-items' : '/found-items'}
          className="inline-block px-4 py-2 text-xs font-semibold bg-brand-700 text-white rounded-xl"
        >
          Back to Listings
        </Link>
      </div>
    );
  }

  const isOwner = user && user.id === item.user_id;
  const isFound = type === 'found';
  const location = item.location_lost || item.location_found;
  const dateStr = item.approximate_date_lost || item.date_found;
  const colors = Array.isArray(item.color) ? item.color : (item.color ? [item.color] : []);
  const images = item.image_urls || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
        {/* Left: Image / Photo Gallery */}
        <div className="space-y-4">
          <div className="relative h-80 w-full rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center">
            {images.length > 0 ? (
              <img
                src={images[0]}
                alt={item.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center text-slate-400 p-6">
                <Tag className="w-12 h-12 stroke-[1.5] mb-2 text-slate-300" />
                <span className="text-xs font-medium">No photograph attached</span>
              </div>
            )}
            <div className="absolute top-3 left-3">
              <Badge status={item.status} />
            </div>
          </div>
        </div>

        {/* Right: Meta & Attributes */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
                {type === 'lost' ? 'Lost Item Report' : 'Found Item Record'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {item.title}
              </h1>
            </div>

            {/* Badges strip */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                {item.category}
              </span>
              {item.brand && (
                <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                  {item.brand}
                </span>
              )}
              {colors.map((c: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-50 border border-slate-200 text-slate-600 capitalize"
                >
                  {c}
                </span>
              ))}
            </div>

            {/* AI Generated Description Box */}
            {item.ai_generated_description && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/70 to-brand-50/70 border border-indigo-100/80 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 uppercase">
                  <Sparkles className="w-3.5 h-3.5" /> Gemini AI Description
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-normal">
                  {item.ai_generated_description}
                </p>
              </div>
            )}

            {/* User Submitted Description */}
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-500 uppercase">Public Description</h3>
              <p className="text-sm text-slate-700 leading-relaxed">{item.description}</p>
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Campus Location</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {location}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Date Reported</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> {dateStr?.slice(0, 10)}
                </span>
              </div>
              {item.storage_location && (
                <div className="col-span-2">
                  <span className="text-slate-400 block font-medium">HITK Campus Depository</span>
                  <span className="font-semibold text-indigo-700 flex items-center gap-1 mt-0.5">
                    <Building className="w-3.5 h-3.5" /> {item.storage_location}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Physical handover coordinated via Security Office (Gate 1, Chowbaga Road)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-3">
            {isFound && (item.status === 'available' || item.status === 'potential_match') && (
              <button
                onClick={() => setClaimModalOpen(true)}
                className="flex-1 py-3 px-6 rounded-full text-xs font-bold bg-[#4338ca] hover:bg-[#3730a3] text-white shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
              >
                <ShieldAlert className="w-4 h-4" />
                Claim Ownership
              </button>
            )}

            {isOwner && (
              <span className="text-xs text-slate-400 italic self-center">
                (This report is filed under your student account)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Potential AI Matches Section (shown if matches exist) */}
      {matches.length > 0 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold text-slate-900">
              Potential AI Matches ({matches.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map(m => {
              const matchedItem = type === 'lost' ? m.found_item : m.lost_item;
              if (!matchedItem) return null;
              return (
                <div key={m.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {m.final_score}% Match Score
                    </span>
                    <Badge status={m.match_status} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{matchedItem.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{matchedItem.description}</p>
                  {m.match_explanation && (
                    <p className="text-xs text-indigo-700 italic bg-white p-2 rounded-lg border border-slate-200/60">
                      "{m.match_explanation}"
                    </p>
                  )}
                  <div className="pt-2 flex justify-end">
                    <Link
                      to={`/items/${type === 'lost' ? 'found' : 'lost'}/${matchedItem.id}`}
                      className="text-xs font-semibold text-brand-700 hover:underline flex items-center gap-1"
                    >
                      Inspect Match <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Claim Modal */}
      {isFound && (
        <ClaimModal
          foundItemId={item.id}
          foundItemTitle={item.title}
          isOpen={claimModalOpen}
          onClose={() => setClaimModalOpen(false)}
          onSuccess={() => {
            alert('Claim submitted for administrator review!');
            navigate('/claims');
          }}
        />
      )}
    </div>
  );
};
