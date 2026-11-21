import React from 'react';
import { Bell, CheckCheck, Sparkles, ShieldAlert, CheckCircle2, ChevronRight, Inbox } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { Link, useNavigate } from 'react-router-dom';

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Campus Notifications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time updates regarding potential AI matches, claim decisions, and handovers.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm self-start sm:self-center"
          >
            <CheckCheck className="w-4 h-4 text-brand-600" />
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-base text-slate-800">Inbox is Clear</h3>
          <p className="text-xs text-slate-500">
            You don't have any notifications at the moment.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden divide-y divide-slate-100">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.is_read) markAsRead(n.id);
                if (n.related_item_id) {
                  navigate(`/items/lost/${n.related_item_id}`);
                }
              }}
              className={`p-5 flex items-start gap-4 transition-colors cursor-pointer hover:bg-slate-50 ${
                !n.is_read ? 'bg-brand-50/30' : ''
              }`}
            >
              <div className="p-2 rounded-xl bg-brand-100 text-brand-700 mt-0.5 flex-shrink-0">
                {n.notification_type === 'potential_match' ? (
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                ) : n.notification_type === 'claim_approved' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                  <span className="text-[11px] text-slate-400">
                    {n.created_at?.slice(0, 10)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
              </div>

              {!n.is_read && (
                <span className="w-2.5 h-2.5 rounded-full bg-brand-600 flex-shrink-0 mt-2"></span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
