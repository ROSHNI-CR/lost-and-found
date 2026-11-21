import React, { useState, useEffect } from 'react';
import { Search, Filter, Sparkles, PlusCircle, Package, MapPin, Tag, Camera } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { itemService } from '../services/itemService';
import { aiService } from '../services/aiService';
import { FoundItem } from '../types';
import { ItemCard } from '../components/items/ItemCard';
import { ClaimModal } from '../components/forms/ClaimModal';
import { useAuth } from '../context/AuthContext';

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

export const FoundItemsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<FoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');

  // Claim modal state
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedClaimItem, setSelectedClaimItem] = useState<FoundItem | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      if (searchQuery.trim()) {
        const searchRes = await aiService.searchHybrid(searchQuery, 'found');
        setItems(searchRes.results || []);
      } else {
        const filters: any = {};
        if (selectedCategory !== 'All') filters.category = selectedCategory;
        if (selectedLocation !== 'All') filters.location = selectedLocation;
        if (statusFilter !== 'all') filters.status = statusFilter;
        const res = await itemService.getFoundItems(filters);
        setItems(res);
      }
    } catch (err) {
      console.error('Failed to fetch found items:', err);
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

  const handleClaimClick = (item: FoundItem) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSelectedClaimItem(item);
    setClaimModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1.5">
            <span>📦</span>
            <span>Campus Found Items Repository</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0e1f38] tracking-tight">
            Found Belongings on Campus
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Belongings retrieved by students, faculty, or deposited at Gate 1 Security Desk awaiting owner recovery.
          </p>
        </div>
        <Link
          to="/report-found"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all self-start sm:self-center hover:-translate-y-0.5"
        >
          <Camera className="w-4 h-4 text-emerald-200" />
          <span>Report Found Item</span>
        </Link>
      </div>

      {/* Natural Language Search & Smart Filter Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Search by keywords or natural query (e.g. 'blue flask found at canteen' or 'wireless earbuds')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-full focus:ring-2 focus:ring-emerald-300 focus:outline-none bg-slate-50/50"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all flex-shrink-0"
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
                  ? 'bg-emerald-600 text-white shadow-xs'
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
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
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
              <option value="all">Available & Potential Matches</option>
              <option value="available">Available for Claim</option>
              <option value="potential_match">Under Claim Verification</option>
              <option value="claimed">Claimed & Reunited</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs font-semibold text-slate-400">Loading campus found repository...</div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-4 shadow-xs">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-black text-base text-[#0e1f38]">No found items currently match your criteria</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            If you found an item on campus, please report it to help reunite it with its rightful student or staff owner.
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
              to="/report-found"
              className="px-5 py-2 rounded-full text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Report Found Item
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              type="found"
              onClaim={() => handleClaimClick(item)}
            />
          ))}
        </div>
      )}

      {/* Claim Submission Modal */}
      {selectedClaimItem && (
        <ClaimModal
          isOpen={claimModalOpen}
          onClose={() => {
            setClaimModalOpen(false);
            setSelectedClaimItem(null);
          }}
          foundItemId={selectedClaimItem.id}
          foundItemTitle={selectedClaimItem.title}
          onSuccess={() => {
            fetchItems();
          }}
        />
      )}
    </div>
  );
};
