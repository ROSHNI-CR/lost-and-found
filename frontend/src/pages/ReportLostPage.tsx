import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  MapPin,
  Calendar,
  Tag,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Clock,
  Compass
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

export const ReportLostPage: React.FC = () => {
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [brand, setBrand] = useState('');
  const [color, setColor] = useState('');
  const [description, setDescription] = useState('');
  const [locationLost, setLocationLost] = useState('');
  const [approximateDateLost, setApproximateDateLost] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [timeRange, setTimeRange] = useState('Morning (8 AM - 12 PM)');
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

    if (!title.trim() || !description.trim() || !locationLost.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      const colorArray = color.split(',').map(c => c.trim()).filter(Boolean);

      const created = await itemService.createLostItem({
        title: title.trim(),
        description: description.trim(),
        category,
        brand: brand.trim() || undefined,
        color: colorArray.length > 0 ? colorArray : ['unspecified'],
        identifying_features: identifyingFeatures.trim() || undefined,
        location_lost: locationLost.trim(),
        approximate_date_lost: approximateDateLost,
        time_range: timeRange,
        image_urls: imageUrls,
        ai_generated_description: aiGeneratedDescription || undefined,
        ai_extracted_attributes: aiExtractedAttributes || undefined
      });

      navigate(`/items/lost/${created.id}`);
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
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Compass className="w-3.5 h-3.5 text-indigo-600" />
          Heritage Campus Lost &amp; Found Registry
        </div>
        <h1 className="text-3xl font-black text-[#0e1f38] tracking-tight">
          Report a Lost Belonging
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Provide as much detail as possible. Uploading a photograph allows our multimodal Gemini AI to auto-fill traits and boost match precision.
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
          1. Upload Photograph (Optional but Highly Recommended)
        </label>
        <ImageUploadDropzone onAnalysisComplete={handleAnalysisComplete} />
      </div>

      {/* Main Details Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
          2. Item Details & Identifiers
        </h2>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Item Name / Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Black Milton Thermos Water Bottle"
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
              Brand (if known)
            </label>
            <input
              type="text"
              placeholder="e.g. Apple, Dell, Milton, Nike"
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
              placeholder="e.g. black, matte finish, silver"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Identifying Features / Stickers
            </label>
            <input
              type="text"
              placeholder="e.g. NASA sticker, scratch on handle"
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
              HITK Campus Location Where Lost *
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                list="hitk-lost-locations"
                placeholder="Select or type (e.g. Central Block CB-204)"
                value={locationLost}
                onChange={(e) => setLocationLost(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <datalist id="hitk-lost-locations">
                {HITK_LOCATIONS.map(loc => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Approximate Date Lost *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="date"
                required
                value={approximateDateLost}
                onChange={(e) => setApproximateDateLost(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Time of Day */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Approximate Time Range
          </label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            <option value="Morning (8 AM - 12 PM)">Morning (8 AM - 12 PM)</option>
            <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
            <option value="Evening (4 PM - 8 PM)">Evening (4 PM - 8 PM)</option>
            <option value="Night (After 8 PM)">Night (After 8 PM)</option>
            <option value="Unknown">Exact time unknown</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Public Item Description *
          </label>
          <textarea
            rows={4}
            required
            placeholder="Describe the lost item clearly (contents, condition, materials)..."
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
            className="px-6 py-3 rounded-full text-xs font-bold text-white bg-[#4338ca] hover:bg-[#3730a3] shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center gap-2 hover:-translate-y-0.5"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Lost Report'}
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
