import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  Sparkles,
  ShieldCheck,
  PlusCircle,
  Clock,
  MapPin,
  ChevronRight,
  AlertCircle,
  Package,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { itemService } from '../services/itemService';
import { matchService } from '../services/matchService';
import { claimService } from '../services/claimService';
import { LostItem, FoundItem, Match, Claim } from '../types';
import { Badge } from '../components/common/Badge';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [lostReports, setLostReports] = useState<LostItem[]>([]);
  const [foundReports, setFoundReports] = useState<FoundItem[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'lost' | 'found' | 'matches' | 'claims'>('lost');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [lost, found, userMatches, userClaims] = await Promise.all([
          itemService.getMyLostReports(),
          itemService.getMyFoundReports(),
          matchService.getMyMatches(),
          claimService.getMyClaims()
        ]);
        setLostReports(lost);
        setFoundReports(found);
        setMatches(userMatches);
        setClaims(userClaims);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const highPotentialMatches = matches.filter(m => m.match_status === 'high_potential');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0e1726] text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md text-amber-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Heritage Institute of Technology • {user?.department || 'HITK Campus Member'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Track your submitted lost items, inspect automated AI match detections, and follow Gate 1 claim verification.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Link
            to="/report-lost"
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-full text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 shadow-md transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
          >
            <PlusCircle className="w-4 h-4 text-[#4338ca]" />
            Report Lost
          </Link>
          <Link
            to="/report-found"
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#4338ca] hover:bg-[#3730a3] shadow-md transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
          >
            <Package className="w-4 h-4 text-amber-300" />
            Report Found
          </Link>
          <Link
            to="/chatbot"
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-full text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            AI Assistant
          </Link>
        </div>
      </div>

      {/* High Potential Match Alert Callout */}
      {highPotentialMatches.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-sm flex-shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                {highPotentialMatches.length} High-Confidence AI Match Detected!
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Our semantic matching engine detected active found items strongly resembling your lost reports.
              </p>
            </div>
          </div>
          <Link
            to="/matches"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-colors flex items-center gap-1.5 flex-shrink-0"
          >
            Review Potential Matches <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div
          onClick={() => setActiveTab('lost')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'lost'
              ? 'bg-blue-50/70 border-brand-300 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">My Lost Items</span>
            <FileText className="w-4 h-4 text-brand-600" />
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900">
            {lostReports.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {lostReports.filter(i => i.status === 'active').length} active reports
          </p>
        </div>

        <div
          onClick={() => setActiveTab('found')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'found'
              ? 'bg-indigo-50/70 border-indigo-300 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">My Found Items</span>
            <Package className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900">
            {foundReports.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {foundReports.filter(i => i.status === 'available').length} pending collection
          </p>
        </div>

        <div
          onClick={() => setActiveTab('matches')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'matches'
              ? 'bg-amber-50/70 border-amber-300 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Potential Matches</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900">
            {matches.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {highPotentialMatches.length} high potential
          </p>
        </div>

        <div
          onClick={() => setActiveTab('claims')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'claims'
              ? 'bg-purple-50/70 border-purple-300 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Submitted Claims</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900">
            {claims.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {claims.filter(c => c.status === 'pending').length} under review
          </p>
        </div>
      </div>

      {/* Tabs Content Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 px-6 pt-4 flex gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('lost')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'lost'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            My Lost Reports ({lostReports.length})
          </button>
          <button
            onClick={() => setActiveTab('found')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'found'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            My Found Submissions ({foundReports.length})
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'matches'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            AI Matches ({matches.length})
          </button>
          <button
            onClick={() => setActiveTab('claims')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'claims'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            My Ownership Claims ({claims.length})
          </button>
        </div>

        {/* Tab Panel Body */}
        <div className="p-6">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading your campus records...</div>
          ) : activeTab === 'lost' ? (
            lostReports.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-medium text-slate-700">You haven't filed any lost reports yet.</p>
                <Link
                  to="/report-lost"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-700 text-white"
                >
                  <PlusCircle className="w-4 h-4" /> Report a Lost Item
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {lostReports.map(item => (
                  <div key={item.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {item.image_urls && item.image_urls.length > 0 ? (
                        <img
                          src={item.image_urls[0]}
                          alt={item.title}
                          className="w-14 h-14 rounded-xl object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                          <Badge status={item.status} />
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {item.location_lost}
                          </span>
                          <span>•</span>
                          <span>Lost: {item.approximate_date_lost?.slice(0, 10)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Link
                        to={`/items/lost/${item.id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'found' ? (
            foundReports.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <Package className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-medium text-slate-700">You haven't reported any found items yet.</p>
                <Link
                  to="/report-found"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-700 text-white"
                >
                  <Package className="w-4 h-4" /> Report a Found Item
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {foundReports.map(item => (
                  <div key={item.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {item.image_urls && item.image_urls.length > 0 ? (
                        <img
                          src={item.image_urls[0]}
                          alt={item.title}
                          className="w-14 h-14 rounded-xl object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                          <Badge status={item.status} />
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {item.location_found}
                          </span>
                          <span>•</span>
                          <span>Found: {item.date_found?.slice(0, 10)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Link
                        to={`/items/found/${item.id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'matches' ? (
            matches.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No potential AI matches found yet for your active reports. The matching engine will notify you when a match is detected.
              </div>
            ) : (
              <div className="space-y-4">
                {matches.map(m => (
                  <div key={m.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {m.final_score}% Match Score
                        </span>
                        <Badge status={m.match_status} />
                      </div>
                      <p className="text-xs font-semibold text-slate-800">
                        {m.lost_item?.title || 'Reported Lost'} ↔ {m.found_item?.title || 'Reported Found'}
                      </p>
                      {m.match_explanation && (
                        <p className="text-xs text-slate-500 italic">"{m.match_explanation}"</p>
                      )}
                    </div>
                    <Link
                      to="/matches"
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-700 text-white hover:bg-brand-800 self-end md:self-center"
                    >
                      Compare & Claim
                    </Link>
                  </div>
                ))}
              </div>
            )
          ) : (
            claims.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                You haven't submitted any ownership claims yet.
              </div>
            ) : (
              <div className="space-y-3">
                {claims.map(c => (
                  <div key={c.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">Claim for {c.found_item?.title || 'Found Item'}</span>
                        <Badge status={c.status} />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Submitted: {c.created_at?.slice(0, 10)}</p>
                      {c.admin_feedback && (
                        <p className="text-xs text-indigo-700 mt-1 font-medium">Admin Feedback: {c.admin_feedback}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
