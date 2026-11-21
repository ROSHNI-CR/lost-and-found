import React from 'react';
import { Compass, ShieldCheck, Heart, Sparkles, MapPin, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0e1726] border-t border-slate-800 text-slate-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Column */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <img
                src="/hitk_logo.png"
                alt="HITK Logo"
                className="w-9 h-9 object-contain rounded-full bg-white p-0.5 border border-amber-400"
              />
              <div>
                <span className="font-black text-white text-base tracking-tight">
                  HITK<span className="text-amber-400 ml-0.5">FindIt</span>
                </span>
                <p className="text-[10px] text-slate-400 font-medium">Lost & Found Portal</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Official smart lost-and-found recovery portal for Heritage Institute of Technology, Kolkata. Powered by Google Gemini GenAI and sentence-transformer embeddings.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              HITK Campus Network Active
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">Campus Navigation</h4>
            <ul className="mt-3 space-y-2 text-xs text-slate-400">
              <li><Link to="/lost-items" className="hover:text-white transition-colors">Lost Items Board</Link></li>
              <li><Link to="/found-items" className="hover:text-white transition-colors">Found Items Repository</Link></li>
              <li><Link to="/matches" className="hover:text-white transition-colors">AI Potential Matches</Link></li>
              <li><Link to="/chatbot" className="hover:text-white transition-colors">FindIt AI Assistant</Link></li>
            </ul>
          </div>

          {/* Actions */}
          <div>
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">Report & Recover</h4>
            <ul className="mt-3 space-y-2 text-xs text-slate-400">
              <li><Link to="/report-lost" className="hover:text-white transition-colors">Report a Lost Belonging</Link></li>
              <li><Link to="/report-found" className="hover:text-white transition-colors">Submit Found Item</Link></li>
              <li><Link to="/claims" className="hover:text-white transition-colors">Track Ownership Claims</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition-colors">Personal Dashboard</Link></li>
            </ul>
          </div>

          {/* Security & Integrity */}
          <div>
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">Gate 1 Security Handover</h4>
            <p className="mt-3 text-xs text-slate-400 leading-relaxed">
              Found items are physically secured at the <strong>Campus Security Office at Gate 1</strong> (Chowbaga Road Main Entrance). Ownership is validated against student ID cards.
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Gate 1 Security Desk • 24x7</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Heritage Institute of Technology, Kolkata (Anandapur, Kolkata - 700107). An Autonomous Institution.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              Powered by <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Gemini Multimodal AI
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
