import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Sparkles, Tag, ShieldAlert } from 'lucide-react';
import { Badge } from '../common/Badge';

interface ItemCardProps {
  item: {
    id: string;
    title: string;
    description: string;
    category: string;
    color: string | string[];
    brand?: string;
    location_lost?: string;
    location_found?: string;
    approximate_date_lost?: string;
    date_found?: string;
    image_urls?: string[];
    status: string;
    ai_generated_description?: string;
  };
  type: 'lost' | 'found';
  onClaim?: (item: any) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, type, onClaim }) => {
  const location = item.location_lost || item.location_found || 'Heritage Campus Grounds';
  const dateStr = item.approximate_date_lost || item.date_found || '';
  const rawImageUrl = item.image_urls && item.image_urls.length > 0 ? item.image_urls[0] : null;
  const imageUrl = rawImageUrl
    ? (rawImageUrl.startsWith('http://') || rawImageUrl.startsWith('https://') || rawImageUrl.startsWith('data:')
        ? rawImageUrl
        : `https://hitk-findit-backend.onrender.com${rawImageUrl.startsWith('/') ? '' : '/'}${rawImageUrl}`)
    : null;

  const colorTags = Array.isArray(item.color)
    ? item.color
    : (item.color ? [item.color] : []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group">
      {/* Thumbnail Header */}
      <div className="relative h-48 w-full bg-slate-100 overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 p-4">
            <Tag className="w-10 h-10 stroke-[1.5] mb-1 text-slate-300" />
            <span className="text-xs font-semibold text-slate-400">No photo uploaded</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <Badge status={item.status} />
          {item.ai_generated_description && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#4338ca] text-white shadow-sm">
              <Sparkles className="w-3 h-3 text-amber-300" /> AI Vision
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 backdrop-blur-md text-[#0e1f38] shadow-sm border border-slate-200/60">
            {item.category}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-extrabold text-sm sm:text-base text-[#0e1f38] group-hover:text-[#4338ca] transition-colors line-clamp-1">
              {item.title}
            </h3>
          </div>

          <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {item.ai_generated_description || item.description}
          </p>

          {/* Color & Brand metadata */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {item.brand && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {item.brand}
              </span>
            )}
            {colorTags.slice(0, 3).map((clr, idx) => (
              <span
                key={idx}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600 capitalize"
              >
                {clr}
              </span>
            ))}
          </div>
        </div>

        {/* Details Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1 truncate max-w-[150px]" title={location}>
              <MapPin className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </span>
            {dateStr && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {dateStr.slice(0, 10)}
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center gap-2">
            <Link
              to={`/items/${type}/${item.id}`}
              className="flex-1 text-center py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              View Details
            </Link>

            {type === 'found' && (item.status === 'available' || item.status === 'potential_match') && onClaim && (
              <button
                onClick={() => onClaim(item)}
                className="py-2 px-3.5 rounded-xl text-xs font-bold bg-[#4338ca] text-white hover:bg-[#3730a3] shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Claim
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
