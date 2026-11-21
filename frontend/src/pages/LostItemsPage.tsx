import React, { useState, useEffect } from 'react';
import { Search, Filter, Sparkles, PlusCircle, Layers, MapPin, Tag, ArrowRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { itemService } from '../services/itemService';
import { aiService } from '../services/aiService';
import { LostItem } from '../types';
import { ItemCard } from '../components/items/ItemCard';

const CATEGORIES = ['All', 'Electronics', 'Bottles', 'Bags', 'Accessories', 'Documents', 'Clothing', 'Stationery'];
const LOCATIONS = [
  'All',
  'Central Block (CB)',
  'ICT Block',
  'CME Block',
  'Central Library',
  'Main Canteen',
  'Nescafe Kiosk',
  'Gate 1 Security',
  'Heritage Sports Ground',
  'Boys Hostel / Girls Hostel'
];

export const LostItemsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'All';

  const [items, setItems] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchItems = async () => {
    try {
      setLoading(true);
      if (searchQuery.trim()) {
        const searchRes = await aiService.searchHybrid(searchQuery, 'lost');
        setItems(searchRes.results || []);
      } else {
        const filters: any = {};
        if (selectedCategory !== 'All') filters.category = selectedCategory;
        if (selectedLocation !== 'All') filters.location = selectedLocation;
        if (statusFilter !== 'all') filters.status = statusFilter;
        const res = await itemService.getLostItems(filters);
        setItems(res);
      }
    } catch (err) {
      console.error('Failed to fetch lost items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [selectedCategory, selectedLocation, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-1.5">
            <span>🔍</span>
            <span>Campus Lost Items Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0e1f38] tracking-tight">
            Browse Lost Belongings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search items reported missing across Heritage Institute campus blocks, labs, and student commons.
          </p>
        </div>
        <Link
          to="/report-lost"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#4338ca] hover:bg-[#3730a3] shadow-md shadow-indigo-600/20 transition-all self-start sm:self-center hover:-translate-y-0.5"
        >
          <PlusCircle className="w-4 h-4 text-amber-300" />
          <span>Report Lost Item</span>
        </Link>
      </div>

      {/* Natural Language Search & Smart Filter Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Search by keywords or natural query (e.g. 'Casio calculator near ICT lab' or 'black water bottle')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-full focus:ring-2 focus:ring-indigo-300 focus:outline-none bg-slate-50/50"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold text-white bg-[#4338ca] hover:bg-[#3730a3] shadow-sm transition-all flex-shrink-0"
          >
            Search
          </button>
        </form>

        {/* Categories Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" /> Category:
          </span>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#0e1f38] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Secondary filters row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-bold text-slate-700">Campus Location:</span>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-700 text-xs font-semibold focus:outline-none"
            >
              {LOCATIONS.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-700 text-xs font-semibold focus:outline-none"
            >
              <option value="all">Active & Potential Matches</option>
              <option value="active">Active Only</option>
              <option value="potential_match">Potential Match</option>
              <option value="recovered">Recovered</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs font-semibold text-slate-400">Loading campus lost records...</div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-4 shadow-xs">
          <Search className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-black text-base text-[#0e1f38]">No lost reports match your criteria</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your search keywords, clear category filters, or ask the FindIt AI Assistant to search campus databases.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedLocation('All');
                setStatusFilter('all');
              }}
              className="px-5 py-2 rounded-full text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              Reset Filters
            </button>
            <Link
              to="/report-lost"
              className="px-5 py-2 rounded-full text-xs font-bold bg-[#4338ca] text-white hover:bg-[#3730a3]"
            >
              Report This Item
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map(item => (
            <ItemCard key={item.id} item={item} type="lost" />
          ))}
        </div>
      )}
    </div>
  );
};
