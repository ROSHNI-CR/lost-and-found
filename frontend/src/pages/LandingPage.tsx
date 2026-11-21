import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  ClipboardList,
  Box,
  CheckCircle2,
  TrendingUp,
  Glasses,
  Backpack,
  Smartphone,
  MoreHorizontal,
  Compass,
  FileQuestion,
  HelpCircle,
  Headphones,
  MapPin,
  Clock,
  Sparkles,
  Camera,
  Layers,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { itemService } from '../services/itemService';
import { AdminStats, LostItem, FoundItem } from '../types';

interface DisplayActivityItem {
  id: string;
  type: 'lost' | 'found';
  title: string;
  location: string;
  timeAgo: string;
  status: string;
  imageUrl?: string;
  category: string;
}

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<Partial<AdminStats>>({
    total_lost: 1,
    total_found: 0,
    total_recovered: 0,
    recovery_rate: 0
  });
  const [recentActivities, setRecentActivities] = useState<DisplayActivityItem[]>([
    {
      id: 'mock-1',
      type: 'lost',
      title: 'Lost: Backpack',
      location: 'in Library',
      timeAgo: '2 hours ago',
      status: 'Lost',
      category: 'Bags'
    },
    {
      id: 'mock-2',
      type: 'found',
      title: 'Found: Mobile Phone',
      location: 'near CSE Block',
      timeAgo: '3 hours ago',
      status: 'Found',
      category: 'Electronics'
    },
    {
      id: 'mock-3',
      type: 'lost',
      title: 'Lost: ID Card',
      location: 'in Hostel',
      timeAgo: '1 day ago',
      status: 'Lost',
      category: 'Documents'
    }
  ]);

  useEffect(() => {
    // 1. Fetch live admin / dashboard stats
    adminService.getDashboardStats()
      .then(res => {
        if (res) setStats(res);
      })
      .catch(() => {});

    // 2. Fetch recent database items
    Promise.all([
      itemService.getLostItems({ limit: 3 }).catch(() => [] as LostItem[]),
      itemService.getFoundItems({ limit: 3 }).catch(() => [] as FoundItem[])
    ]).then(([losts, founds]) => {
      const liveItems: DisplayActivityItem[] = [];

      losts.forEach(l => {
        liveItems.push({
          id: l.id,
          type: 'lost',
          title: `Lost: ${l.title}`,
          location: l.location_lost ? `in ${l.location_lost}` : 'on Campus',
          timeAgo: l.created_at ? new Date(l.created_at).toLocaleDateString() : 'Recently',
          status: 'Lost',
          imageUrl: l.image_urls?.[0],
          category: l.category
        });
      });

      founds.forEach(f => {
        liveItems.push({
          id: f.id,
          type: 'found',
          title: `Found: ${f.title}`,
          location: f.location_found ? `near ${f.location_found}` : 'on Campus',
          timeAgo: f.created_at ? new Date(f.created_at).toLocaleDateString() : 'Recently',
          status: 'Found',
          imageUrl: f.image_urls?.[0],
          category: f.category
        });
      });

      if (liveItems.length > 0) {
        setRecentActivities(liveItems.slice(0, 4));
      }
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/lost-items?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/lost-items');
    }
  };

  const handleCategoryClick = (category: string) => {
    navigate(`/lost-items?category=${encodeURIComponent(category)}`);
  };

  return (
    <div className="min-h-screen bg-[#f1f4f9] text-slate-800 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">

        {/* 1. HERO SECTION (Matching Inspiration UI) */}
        <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#dbeafe]/85 via-[#e0e7ff]/75 to-[#eff6ff] border border-blue-200/80 shadow-sm p-6 sm:p-10 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-5 z-10">
              
              {/* Playful decorative accent marks */}
              <div className="flex gap-1 text-indigo-500 font-bold select-none text-xl sm:text-2xl leading-none">
                <span className="rotate-12 inline-block">/</span>
                <span className="rotate-12 inline-block">/</span>
                <span className="rotate-12 inline-block">/</span>
              </div>

              {/* Main Headline */}
              <div className="space-y-1">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0e1f38] tracking-tight leading-tight">
                  Lost Something <br />
                  <span className="text-[#1e3a8a]">at Campus?</span>
                </h1>
                <p className="text-base sm:text-lg font-bold text-slate-600 pt-1">
                  We're here to help you find it!
                </p>
              </div>

              {/* Pill Search Bar */}
              <form onSubmit={handleSearch} className="max-w-xl">
                <div className="relative flex items-center bg-white rounded-full p-1.5 shadow-md border border-slate-200/80 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 transition-all">
                  <Search className="w-5 h-5 text-slate-400 ml-4 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search for items... (e.g. bottle, ID card)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-transparent border-none focus:outline-none text-slate-800 placeholder-slate-400 font-medium"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-[#4338ca] hover:bg-[#3730a3] text-white shadow-sm transition-all flex items-center gap-1.5 flex-shrink-0"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search</span>
                  </button>
                </div>
              </form>

              {/* Category Shortcuts */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => handleCategoryClick('Accessories')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold shadow-xs transition hover:scale-102"
                >
                  <Glasses className="w-3.5 h-3.5 text-slate-500" />
                  <span>Accessories</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCategoryClick('Bags')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold shadow-xs transition hover:scale-102"
                >
                  <Backpack className="w-3.5 h-3.5 text-slate-500" />
                  <span>Bags</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCategoryClick('Electronics')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold shadow-xs transition hover:scale-102"
                >
                  <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                  <span>Electronics</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/lost-items')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-semibold transition"
                >
                  <MoreHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                  <span>More</span>
                </button>
              </div>

            </div>

            {/* Right Campus Building Photo Column */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-lg border border-white/60 bg-white group">
                <img
                  src="/hitk_campus.jpg"
                  alt="Heritage Institute of Technology Kolkata Campus"
                  className="w-full h-56 sm:h-72 object-cover object-center group-hover:scale-103 transition-transform duration-700"
                />
                
                {/* Handwritten collegiate overlay on right corner */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e1f38]/60 via-transparent to-transparent flex items-end justify-end p-4">
                  <div className="text-right text-white drop-shadow-md pr-2 pb-1">
                    <p className="font-handwriting text-xl sm:text-2xl font-bold tracking-wide text-amber-200">
                      Together for a safer &amp;
                    </p>
                    <p className="font-handwriting text-xl sm:text-2xl font-bold tracking-wide text-white">
                      more connected campus ♡
                    </p>
                  </div>
                </div>

                {/* College Badge Top Left */}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-[#0e1f38] shadow-sm flex items-center gap-1.5 border border-white/40">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Heritage Campus (HITK)</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 2. FOUR STATISTICS CARDS SECTION */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Reports Filed */}
          <div className="saas-card p-4 sm:p-5 flex items-center gap-3.5 sm:gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 shadow-xs">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-[#0e1f38] leading-none">
                {stats.total_lost ?? 1}
              </p>
              <p className="text-xs font-bold text-slate-500 mt-1">
                Reports Filed
              </p>
            </div>
          </div>

          {/* Card 2: Found Items */}
          <div className="saas-card p-4 sm:p-5 flex items-center gap-3.5 sm:gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-xs">
              <Box className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-[#0e1f38] leading-none">
                {stats.total_found ?? 0}
              </p>
              <p className="text-xs font-bold text-slate-500 mt-1">
                Found Items
              </p>
            </div>
          </div>

          {/* Card 3: Items Reunited */}
          <div className="saas-card p-4 sm:p-5 flex items-center gap-3.5 sm:gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-[#0e1f38] leading-none">
                {stats.total_recovered ?? 0}
              </p>
              <p className="text-xs font-bold text-slate-500 mt-1">
                Items Reunited
              </p>
            </div>
          </div>

          {/* Card 4: Recovery Success */}
          <div className="saas-card p-4 sm:p-5 flex items-center gap-3.5 sm:gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 shadow-xs">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-[#0e1f38] leading-none">
                {stats.recovery_rate ?? 0}%
              </p>
              <p className="text-xs font-bold text-slate-500 mt-1">
                Recovery Success
              </p>
            </div>
          </div>

        </section>

        {/* 3. MIDDLE DUAL SECTION: RECENT ACTIVITY & REPORT AN ITEM CTA */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left: Recent Activity Feed (col-span-7) */}
          <div className="lg:col-span-7 saas-card p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📢</span>
                  <h3 className="font-extrabold text-base sm:text-lg text-[#0e1f38]">
                    Recent Activity
                  </h3>
                </div>
                <Link
                  to="/lost-items"
                  className="text-xs font-bold text-[#4338ca] hover:text-[#3730a3] flex items-center gap-1 hover:underline"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {recentActivities.map(item => (
                  <div
                    key={item.id}
                    onClick={() => navigate(item.type === 'found' ? '/found-items' : '/lost-items')}
                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Thumbnail or placeholder */}
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-xs">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl">
                            {item.category === 'Bags' ? '🎒' : item.category === 'Electronics' ? '📱' : '🪪'}
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-[#0e1f38] group-hover:text-indigo-600 transition">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-medium text-slate-600">{item.location}</span>
                          <span>•</span>
                          <span>{item.timeAgo}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                        item.type === 'found'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: "Report an Item" CTA Card (col-span-5) */}
          <div className="lg:col-span-5 rounded-3xl bg-gradient-to-br from-[#e0e7ff] via-[#ede9fe] to-[#f5f3ff] border border-indigo-200/80 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-sm">
            
            {/* Top Content */}
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-xl sm:text-2xl">
                <span>📝</span>
                <h2>Report an Item</h2>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-600">
                Lost or Found something? Let us know!
              </p>
            </div>

            {/* 3D Magnifier & Question Mark Stylized Art */}
            <div className="my-6 flex justify-center sm:justify-end pr-4 relative">
              <div className="relative">
                {/* Big Stylized Magnifying Glass Illustration */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-8 border-indigo-500 bg-white/70 shadow-lg flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-100/80"></div>
                </div>
                {/* Handle */}
                <div className="absolute -bottom-2 -right-2 w-5 h-12 bg-indigo-600 rounded-full rotate-[-45deg] shadow-md"></div>
                {/* Floating Question Bubble */}
                <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-[#7c3aed] text-white flex items-center justify-center font-black text-lg shadow-md animate-bounce">
                  ?
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="relative z-10 pt-2 flex flex-col sm:flex-row gap-2">
              <Link
                to="/report-lost"
                className="w-full text-center py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-bold bg-[#4338ca] hover:bg-[#3730a3] text-white shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
              >
                <span>Report Lost Item</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/report-found"
                className="w-full text-center py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-bold bg-white hover:bg-slate-50 text-indigo-900 border border-indigo-200 shadow-xs transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
              >
                <span>Report Found Item</span>
                <Camera className="w-4 h-4 text-indigo-600" />
              </Link>
            </div>

          </div>

        </section>

        {/* 4. QUICK ACTIONS STRIP */}
        <section className="saas-card p-5 sm:p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-4">
            <span className="text-amber-500 font-bold">⚡</span>
            <h3 className="font-extrabold text-sm sm:text-base text-[#0e1f38]">
              Quick Actions
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 items-center">
            
            <Link
              to="/claims"
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-sm transition-all text-center group flex flex-col items-center justify-center gap-1.5"
            >
              <span className="text-xl">🔭</span>
              <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition">
                Track Your Report
              </span>
            </Link>

            <Link
              to="/lost-items"
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-sm transition-all text-center group flex flex-col items-center justify-center gap-1.5"
            >
              <span className="text-xl">📦</span>
              <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition">
                Browse Lost Items
              </span>
            </Link>

            <Link
              to="/found-items"
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-sm transition-all text-center group flex flex-col items-center justify-center gap-1.5"
            >
              <span className="text-xl">✅</span>
              <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition">
                Browse Found Items
              </span>
            </Link>

            <Link
              to="/chatbot"
              className="p-3.5 rounded-2xl bg-indigo-50/70 hover:bg-indigo-50 border border-indigo-200 hover:border-indigo-400 hover:shadow-sm transition-all text-center group flex flex-col items-center justify-center gap-1.5"
            >
              <span className="text-xl">❓</span>
              <span className="text-xs font-bold text-indigo-700 group-hover:text-indigo-900 transition">
                Need Help? (Ask AI)
              </span>
            </Link>

          </div>
        </section>

      </div>
    </div>
  );
};
