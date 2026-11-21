import React, { useEffect, useState } from 'react';
import {
  Shield,
  Users,
  FileText,
  Package,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  BarChart3,
  Layers,
  Check,
  X,
  Search,
  ChevronRight,
  TrendingUp,
  Activity,
  Settings,
  Plus,
  Trash2,
  Save,
  UserPlus
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { adminService } from '../services/adminService';
import { claimService } from '../services/claimService';
import { matchService } from '../services/matchService';
import { AdminStats, Claim, User, AuditLog, SystemSettings, CreateAdminRequest } from '../types';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#3b5cb0', '#4f75cb', '#7e9ddb', '#a5beea', '#c7d7fe'];

export const AdminDashboardPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Active Admin Section Tab
  const [adminTab, setAdminTab] = useState<'overview' | 'claims' | 'users' | 'audit' | 'settings'>('overview');

  // Review modal state
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [adminFeedback, setAdminFeedback] = useState('');
  const [reviewing, setReviewing] = useState(false);

  // Settings state
  const [newCategory, setNewCategory] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');

  // Create Admin state
  const [adminForm, setAdminForm] = useState<CreateAdminRequest>({
    name: '',
    email: '',
    password: '',
    department: 'Campus Administration'
  });
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminMsg, setAdminMsg] = useState('');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const promises: Promise<any>[] = [
        adminService.getDashboardStats(),
        claimService.getAllClaims(),
        adminService.getUsers(),
        adminService.getAuditLogs()
      ];
      if (isSuperAdmin) {
        promises.push(adminService.getSettings());
      }
      const results = await Promise.all(promises);
      setStats(results[0]);
      setClaims(results[1]);
      setUsers(results[2]);
      setAuditLogs(results[3]);
      if (results[4]) {
        setSettings(results[4]);
      }
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [isSuperAdmin]);

  const handleReview = async (claimId: string, decision: 'approved' | 'rejected') => {
    try {
      setReviewing(true);
      await claimService.reviewClaim(claimId, decision, adminFeedback);
      setSelectedClaim(null);
      setAdminFeedback('');
      await fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to review claim.');
    } finally {
      setReviewing(false);
    }
  };

  const handleUserRoleChange = async (userId: string, newRole: string) => {
    try {
      await adminService.updateUser(userId, { role: newRole });
      await fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update user role.');
    }
  };

  const handleToggleUserActive = async (userId: string, currentActive: boolean) => {
    try {
      await adminService.updateUser(userId, { is_active: !currentActive });
      await fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update user status.');
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    try {
      setSavingSettings(true);
      await adminService.saveSettings(settings);
      setSettingsMsg('Settings saved successfully!');
      setTimeout(() => setSettingsMsg(''), 4000);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.trim() || !settings) return;
    if (settings.item_categories.includes(newCategory.trim())) return;
    setSettings({
      ...settings,
      item_categories: [...settings.item_categories, newCategory.trim()]
    });
    setNewCategory('');
  };

  const handleRemoveCategory = (cat: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      item_categories: settings.item_categories.filter(c => c !== cat)
    });
  };

  const handleAddLocation = () => {
    if (!newLocation.trim() || !settings) return;
    if (settings.campus_locations.includes(newLocation.trim())) return;
    setSettings({
      ...settings,
      campus_locations: [...settings.campus_locations, newLocation.trim()]
    });
    setNewLocation('');
  };

  const handleRemoveLocation = (loc: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      campus_locations: settings.campus_locations.filter(l => l !== loc)
    });
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminForm.name || !adminForm.email || !adminForm.password) {
      alert('Please fill in name, email, and password');
      return;
    }
    try {
      setCreatingAdmin(true);
      await adminService.createAdmin(adminForm);
      setAdminMsg(`Admin account for ${adminForm.email} created!`);
      setAdminForm({ name: '', email: '', password: '', department: 'Campus Administration' });
      await fetchAdminData();
      setTimeout(() => setAdminMsg(''), 4000);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create admin.');
    } finally {
      setCreatingAdmin(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            University Campus Administration
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Admin Management Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitor recovery analytics, audit logs, verify ownership claims, and supervise campus reports.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white p-1 rounded-full border border-slate-200/90 shadow-xs flex items-center gap-1 self-start sm:self-center overflow-x-auto">
          <button
            onClick={() => setAdminTab('overview')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              adminTab === 'overview'
                ? 'bg-[#4338ca] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Analytics &amp; Overview
          </button>
          <button
            onClick={() => setAdminTab('claims')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              adminTab === 'claims'
                ? 'bg-[#4338ca] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Verification Queue
            {claims.filter(c => c.status === 'pending').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            )}
          </button>
          <button
            onClick={() => setAdminTab('users')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              adminTab === 'users'
                ? 'bg-[#4338ca] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setAdminTab('audit')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              adminTab === 'audit'
                ? 'bg-[#4338ca] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Audit Trail
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setAdminTab('settings')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                adminTab === 'settings'
                  ? 'bg-[#4338ca] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading administrative console...</div>
      ) : adminTab === 'overview' && stats ? (
        <div className="space-y-8">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Users</span>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">{stats.total_users}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Lost Reports</span>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">{stats.total_lost}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Found Submissions</span>
              <p className="mt-2 text-2xl font-extrabold text-brand-600">{stats.total_found}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Recovered Items</span>
              <p className="mt-2 text-2xl font-extrabold text-emerald-600">{stats.total_recovered}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Recovery Rate</span>
              <p className="mt-2 text-2xl font-extrabold text-amber-500">{stats.recovery_rate}%</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Avg Recovery</span>
              <p className="mt-2 text-2xl font-extrabold text-indigo-600">{stats.average_recovery_days} days</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Monthly Trend Chart */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Monthly Reporting & Recovery Trends</h3>
                  <p className="text-xs text-slate-400">Comparing lost, found, and reunited belongings</p>
                </div>
                <TrendingUp className="w-4 h-4 text-brand-600" />
              </div>
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthly_trends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Bar dataKey="lost" fill="#3b5cb0" radius={[6, 6, 0, 0]} name="Lost Items" />
                    <Bar dataKey="found" fill="#7e9ddb" radius={[6, 6, 0, 0]} name="Found Items" />
                    <Bar dataKey="recovered" fill="#10b981" radius={[6, 6, 0, 0]} name="Recovered" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Popular Lost Categories Chart */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Most Frequently Lost Categories</h3>
                  <p className="text-xs text-slate-400">Distribution across campus item types</p>
                </div>
                <Layers className="w-4 h-4 text-brand-600" />
              </div>
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={stats.popular_categories}
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis type="category" dataKey="category" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" fill="#4f75cb" radius={[0, 6, 6, 0]} name="Reports" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Popular Locations Table */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Highest Incident Campus Locations</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {stats.popular_locations.map((loc, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">{loc.location}</span>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded-lg bg-brand-100 text-brand-800">
                    {loc.count} reports
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : adminTab === 'claims' ? (
        /* Claims Queue Tab */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Ownership Claims Verification Queue</h3>
              <p className="text-xs text-slate-500">
                Inspect physical evidence and secret distinguishing answers before approving handover.
              </p>
            </div>
          </div>

          {claims.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              No claims submitted for moderation.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {claims.map(c => (
                <div key={c.id} className="py-4 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <h4 className="text-sm font-bold text-slate-900">
                        {c.claimant?.name || 'Student'} claiming {c.found_item?.title || 'Found Item'}
                      </h4>
                      <Badge status={c.status} />
                    </div>
                    <span className="text-xs text-slate-400">
                      Submitted: {c.created_at?.slice(0, 10)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div>
                      <span className="font-semibold text-slate-700 block">Claimant's Secret Distinguishing Description:</span>
                      <p className="text-slate-600 mt-0.5 leading-relaxed font-mono text-[11px] bg-white p-2.5 rounded-xl border border-slate-200">
                        "{c.proof_description}"
                      </p>
                    </div>

                    {c.proof_answers && Object.keys(c.proof_answers).length > 0 && (
                      <div className="pt-2 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        {Object.entries(c.proof_answers).map(([k, v]) => (
                          <div key={k}>
                            <span className="text-slate-400 capitalize">{k.replace(/_/g, ' ')}:</span>
                            <span className="font-semibold text-slate-800 ml-1">{v || 'N/A'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {c.status === 'pending' ? (
                    <div className="flex items-center gap-2 pt-1 justify-end">
                      <button
                        onClick={() => setSelectedClaim(c)}
                        className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-brand-700 text-white hover:bg-brand-800 shadow-sm"
                      >
                        Review & Decide
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 flex items-center justify-between pt-1">
                      <span>Status finalized: <strong className="capitalize">{c.status}</strong></span>
                      {c.admin_feedback && <span className="italic">Feedback: "{c.admin_feedback}"</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : adminTab === 'users' ? (
        /* Users Management Tab */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900">Campus User Management</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Campus Email</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">{u.name}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">{u.department || 'N/A'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 uppercase">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleUserActive(u.id, u.is_active)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.is_active !== false
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        }`}
                        title="Click to toggle active status"
                      >
                        {u.is_active !== false ? 'Active' : 'Suspended'}
                      </button>
                    </td>
                    <td className="p-3">
                      {u.role === 'student' ? (
                        <button
                          onClick={() => handleUserRoleChange(u.id, 'admin')}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-brand-50 text-brand-700 hover:bg-brand-100"
                        >
                          Promote to Admin
                        </button>
                      ) : u.role === 'admin' ? (
                        <button
                          onClick={() => handleUserRoleChange(u.id, 'student')}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200"
                        >
                          Demote to Student
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">Super Admin</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : adminTab === 'audit' ? (
        /* Audit Trail Tab */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900">Administrative Audit Trail</h3>
          <div className="divide-y divide-slate-100 text-xs">
            {auditLogs.map(log => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800">{log.action}</span>
                  <p className="text-slate-500 font-mono text-[11px]">
                    Entity: {log.entity_type} ({log.entity_id}) | Actor: {log.actor_user_id}
                  </p>
                </div>
                <span className="text-[11px] text-slate-400">
                  {log.created_at?.slice(0, 19).replace('T', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Super Admin Settings & Controls Tab */
        <div className="space-y-6">
          {settingsMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              {settingsMsg}
            </div>
          )}

          {/* Create New Administrator Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-brand-50 text-brand-700">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Create New Campus Administrator</h3>
                <p className="text-xs text-slate-500">Super Admin action: Provision dedicated administrator credentials</p>
              </div>
            </div>

            {adminMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                {adminMsg}
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Prof. / Officer Name"
                  value={adminForm.name}
                  onChange={e => setAdminForm({ ...adminForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Official Email</label>
                <input
                  type="email"
                  required
                  placeholder="admin@heritageit.edu.in"
                  value={adminForm.email}
                  onChange={e => setAdminForm({ ...adminForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Temporary Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={adminForm.password}
                  onChange={e => setAdminForm({ ...adminForm, password: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Campus Security"
                  value={adminForm.department}
                  onChange={e => setAdminForm({ ...adminForm, department: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                <button
                  type="submit"
                  disabled={creatingAdmin}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-brand-700 text-white hover:bg-brand-800 transition shadow-sm flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {creatingAdmin ? 'Provisioning...' : 'Provision Administrator'}
                </button>
              </div>
            </form>
          </div>

          {/* System Configurations (Categories, Locations, AI, Domains) */}
          {settings && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Item Categories */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Active Item Categories</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New category..."
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-2 max-h-48 overflow-y-auto">
                  {settings.item_categories.map((cat, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-700 font-medium"
                    >
                      {cat}
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(cat)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Campus Locations */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Campus Locations & Zones</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New location..."
                    value={newLocation}
                    onChange={e => setNewLocation(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddLocation())}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddLocation}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-2 max-h-48 overflow-y-auto">
                  {settings.campus_locations.map((loc, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-700 font-medium"
                    >
                      {loc}
                      <button
                        type="button"
                        onClick={() => handleRemoveLocation(loc)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* College Domain & AI Model Config */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4 lg:col-span-2">
                <h3 className="text-sm font-bold text-slate-900">System Domain & AI Configuration</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Allowed College Email Domains (comma-separated, * for all)
                    </label>
                    <input
                      type="text"
                      value={settings.college_email_domains}
                      onChange={e => setSettings({ ...settings, college_email_domains: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">e.g. `heritageit.edu.in,student.heritageit.edu.in` or `*`</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Active Gemini GenAI Model
                    </label>
                    <input
                      type="text"
                      value={settings.ai_model}
                      onChange={e => setSettings({ ...settings, ai_model: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Configurable multimodal model identifier</p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={savingSettings}
                    onClick={handleSaveSettings}
                    className="px-6 py-2 rounded-xl text-xs font-semibold bg-brand-700 text-white hover:bg-brand-800 transition shadow-sm flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingSettings ? 'Saving...' : 'Save Configuration Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Review Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Review Claim: {selectedClaim.found_item?.title}
            </h3>
            <p className="text-xs text-slate-500">
              Claimant provided: "{selectedClaim.proof_description}"
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Feedback for Student
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Please present student ID at Campus Security Office Gate 1..."
                value={adminFeedback}
                onChange={(e) => setAdminFeedback(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedClaim(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reviewing}
                onClick={() => handleReview(selectedClaim.id, 'rejected')}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
              >
                Reject Claim
              </button>
              <button
                type="button"
                disabled={reviewing}
                onClick={() => handleReview(selectedClaim.id, 'approved')}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
              >
                Approve & Handover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
