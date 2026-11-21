import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Sparkles,
  MapPin,
  Calendar,
  Building,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { itemService } from '../services/itemService';
import { ImageUploadDropzone } from '../components/forms/ImageUploadDropzone';
import { AIReviewModal } from '../components/forms/AIReviewModal';
import { AIExtractedAttributes } from '../types';
import { ImageAnalysisResponse } from '../services/aiService';

const CATEGORIES = [
  'Electronics',
  'Bottles',
  'Bags',
  'Accessories',
  'Clothing',
  'Stationery',
  'ID Cards & Keys',
  'Other'
];

const HITK_LOCATIONS = [
  'Central Block (CB)',
  'ICT Block',
  'CME Block',
  'Heritage Central Library (Swami Vivekananda Block)',
  'Main Canteen & Nescafe Kiosk',
  'Amphitheatre / Open Air Stage',
  'Heritage Sports Ground & Basketball Court',
  'Main Administrative Building & Security Gate 1 & 2',
  "Boys' Hostel / Girls' Hostel",
  'Student Activity Centre (SAC)',
  'Parking Area (Gate 1)'
];

const DEPOSITORIES = [
  'HITK Campus Security Desk (Gate 1 Main Entrance)',
  'Security Office (Gate 2)',
  'Heritage Central Library (Swami Vivekananda Block) Help Desk',
  'Student Affairs Office (Central Block)',
  'ICT Block Lab Office (Ground Floor)',
  'With Finder (Will deposit at Gate 1 upon claim verification)'
];

export const ReportFoundPage: React.FC = () => {
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [brand, setBrand] = useState('');
  const [color, setColor] = useState('');
  const [description, setDescription] = useState('');
  const [locationFound, setLocationFound] = useState('');
  const [dateFound, setDateFound] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [timeFound, setTimeFound] = useState('Afternoon (12 PM - 4 PM)');
  const [storageLocation, setStorageLocation] = useState(DEPOSITORIES[0]);
  const [identifyingFeatures, setIdentifyingFeatures] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [aiGeneratedDescription, setAiGeneratedDescription] = useState<string>('');
  const [aiExtractedAttributes, setAiExtractedAttributes] = useState<AIExtractedAttributes | null>(null);

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Handle AI Image Analysis Completion
  const handleAnalysisComplete = (res: ImageAnalysisResponse) => {
    setImageUrls([res.image_url]);
    setAiExtractedAttributes(res.extracted_attributes);
    setReviewModalOpen(true);
  };

  // Confirm / Apply AI suggestions to form fields
  const handleConfirmAI = (confirmed: AIExtractedAttributes) => {
    if (confirmed.object_name) setTitle(confirmed.object_name);
    if (confirmed.category) setCategory(confirmed.category);
    if (confirmed.brand) setBrand(confirmed.brand);
    if (confirmed.color) {
      setColor(Array.isArray(confirmed.color) ? confirmed.color.join(', ') : confirmed.color);
    }
    if (confirmed.description) {
      setDescription(confirmed.description);
      setAiGeneratedDescription(confirmed.description);
    }
    if (confirmed.visible_features && confirmed.visible_features.length > 0) {
      setIdentifyingFeatures(confirmed.visible_features.join(', '));
    }
    setReviewModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim() || !description.trim() || !locationFound.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      const colorArray = color.split(',').map(c => c.trim()).filter(Boolean);

      const created = await itemService.createFoundItem({
        title: title.trim(),
        description: description.trim(),
        category,
        brand: brand.trim() || undefined,
        color: colorArray.length > 0 ? colorArray : ['unspecified'],
        identifying_features: identifyingFeatures.trim() || undefined,
        location_found: locationFound.trim(),
        date_found: dateFound,
        time_found: timeFound,
        storage_location: storageLocation,
        image_urls: imageUrls,
        ai_generated_description: aiGeneratedDescription || undefined,
        ai_extracted_attributes: aiExtractedAttributes || undefined
      });

      navigate(`/items/found/${created.id}`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to submit report. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Campus Found Belonging Depository
        </div>
        <h1 className="text-3xl font-black text-[#0e1f38] tracking-tight">
          Report an Item You Found
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Thank you for being a responsible campus member. Taking a photograph helps Gemini AI recognize the item and immediately notifies any student who reported losing it!
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Multimodal Photo Upload Box */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          1. Photograph of Found Item (Optional but Recommended)
        </label>
        <ImageUploadDropzone onAnalysisComplete={handleAnalysisComplete} />
      </div>

      {/* Main Details Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
          2. Found Item Details
        </h2>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Item Name / Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Dark Insulated Flask with Black Cap"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        {/* Category & Brand */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Brand (if visibly identifiable)
            </label>
            <input
              type="text"
              placeholder="e.g. Apple, Milton, Casio"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Color & Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Color(s) (comma separated) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. black, dark grey, metallic"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Distinguishing Features (Public)
            </label>
            <input
              type="text"
              placeholder="General visible features (do NOT reveal secret contents)"
              value={identifyingFeatures}
              onChange={(e) => setIdentifyingFeatures(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Location & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Where Was It Found on HITK Campus? *
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                list="hitk-found-locations"
                placeholder="Select or type (e.g. Central Library Lawn, Canteen)"
                value={locationFound}
                onChange={(e) => setLocationFound(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <datalist id="hitk-found-locations">
                {HITK_LOCATIONS.map(loc => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Date Discovered *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="date"
                required
                value={dateFound}
                onChange={(e) => setDateFound(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Storage / Depository Location */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Current Physical Depository Location *
          </label>
          <div className="relative">
            <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <select
              value={storageLocation}
              onChange={(e) => setStorageLocation(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              {DEPOSITORIES.map(dep => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Specify where the owner or campus administrator can inspect the physical item.
          </p>
        </div>

        {/* Public Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Public Item Description *
          </label>
          <textarea
            rows={4}
            required
            placeholder="Describe the item objectively (e.g. black reusable bottle, clean condition)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none leading-relaxed"
          />
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all flex items-center gap-2 hover:-translate-y-0.5"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Found Report'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </form>

      {/* AI Review Modal */}
      {aiExtractedAttributes && (
        <AIReviewModal
          attributes={aiExtractedAttributes}
          isOpen={reviewModalOpen}
          onConfirm={handleConfirmAI}
          onClose={() => setReviewModalOpen(false)}
        />
      )}
    </div>
  );
};
