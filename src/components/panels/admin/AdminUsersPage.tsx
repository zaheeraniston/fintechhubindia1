'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { toast } from 'sonner';
import { Users, Search, Eye, Ban, RotateCcw, ChevronLeft, ChevronRight, ChevronDown, Copy, CheckCircle2, TrendingUp, Award, Layers, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserItem {
  id: string;
  email: string;
  fullName: string;
  mobile: string;
  processId: string;
  sponsorId: string;
  referralId: string;
  role: string;
  status: string;
  profilePhoto: string;
  createdAt: string;
  totalEarnings?: number;
  availableBalance?: number;
}

interface PassiveTx {
  id: string;
  transactionType: string;
  commissionAmount: number;
  commissionRate: number;
  sourceAmount: number;
  createdAt: string;
  sourceReport: { name: string; amount: number; appName: string } | null;
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [editForm, setEditForm] = useState({ fullName: '', mobile: '', status: '' });
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'passive' | 'downline'>('profile');
  const [passiveTxs, setPassiveTxs] = useState<PassiveTx[]>([]);
  const [passiveLoading, setPassiveLoading] = useState(false);
  const [downline, setDownline] = useState<any[]>([]);
  const [tree, setTree] = useState<any[]>([]);
  const [downlineLoading, setDownlineLoading] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const limit = 20;

  useEffect(() => { fetchUsers(); }, [search, page]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const data = await apiFetch(`/users?search=${search}&page=${page}&limit=${limit}`);
      setUsers(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  function openEdit(user: UserItem) {
    setSelectedUser(user);
    setEditForm({ fullName: user.fullName, mobile: user.mobile, status: user.status });
    setActiveTab('profile');
    setPassiveTxs([]);
    setDownline([]);
    setTree([]);
    setExpandedNodes(new Set());
    setEditOpen(true);
  }

  async function loadPassive(userId: string) {
    setPassiveLoading(true);
    try {
      const res = await apiFetch(`/admin/passive-commissions?userId=${userId}`);
      setPassiveTxs(res.data || []);
    } catch {
      toast.error('Failed to load passive commissions');
    } finally {
      setPassiveLoading(false);
    }
  }

  async function loadDownline(userId: string) {
    setDownlineLoading(true);
    try {
      const res = await apiFetch(`/downline?userId=${userId}`);
      setDownline(res.data || []);
      setTree(res.tree || []);
      const firstLevelIds = (res.tree || []).map((n: any) => n.id);
      setExpandedNodes(new Set(firstLevelIds));
    } catch {
      toast.error('Failed to load downline network');
    } finally {
      setDownlineLoading(false);
    }
  }

  function handleTabChange(tab: 'profile' | 'passive' | 'downline') {
    setActiveTab(tab);
    if (tab === 'passive' && selectedUser && passiveTxs.length === 0) {
      loadPassive(selectedUser.id);
    } else if (tab === 'downline' && selectedUser && downline.length === 0) {
      loadDownline(selectedUser.id);
    }
  }

  function toggleNode(nodeId: string) {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }

  async function handleSave() {
    if (!selectedUser) return;
    try {
      await apiFetch(`/users/${selectedUser.id}`, { method: 'PUT', body: JSON.stringify(editForm) });
      toast.success('User updated');
      setEditOpen(false);
      fetchUsers();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
  }

  async function handleTerminate(userId: string) {
    if (!confirm('Terminate this user?')) return;
    try {
      await apiFetch(`/users/${userId}`, { method: 'DELETE' });
      toast.success('User terminated');
      fetchUsers();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
  }

  async function handleReactivate(userId: string) {
    try {
      await apiFetch(`/users/${userId}`, { method: 'PUT', body: JSON.stringify({ status: 'active' }) });
      toast.success('User reactivated');
      fetchUsers();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
  }

  function handleCopyId(id: string) {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success('Referral code copied!');
    setTimeout(() => setCopiedId(null), 2000);
  }

  const fmt = (n: number) => `\u20B9${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const totalPages = Math.ceil(total / limit);
  const passiveTotal = passiveTxs.reduce((s, t) => s + t.commissionAmount, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center shadow-lg">
              <Users className="w-4 h-4 text-white" />
            </span>
            User Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">{total} total users registered</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search users..."
            className="pl-9 h-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500/50 rounded-xl"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse border border-white/5" />)}
        </div>
      ) : (
        <Card className="glass-premium border border-white/10 shadow-2xl overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-violet-500/5">
                  <th className="text-left p-3 text-xs font-bold text-violet-300 uppercase tracking-wider">User</th>
                  <th className="text-left p-3 text-xs font-bold text-violet-300 uppercase tracking-wider hidden sm:table-cell">Email</th>
                  <th className="text-left p-3 text-xs font-bold text-violet-300 uppercase tracking-wider hidden md:table-cell">Mobile</th>
                  <th className="text-left p-3 text-xs font-bold text-violet-300 uppercase tracking-wider">Referral Code</th>
                  <th className="text-left p-3 text-xs font-bold text-violet-300 uppercase tracking-wider hidden lg:table-cell">Sponsor</th>
                  <th className="text-left p-3 text-xs font-bold text-violet-300 uppercase tracking-wider">Status</th>
                  <th className="text-right p-3 text-xs font-bold text-violet-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const initials = u.fullName?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
                  return (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-violet-500/5 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8 shrink-0">
                            <AvatarImage src={u.profilePhoto} alt={u.fullName} />
                            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-xs font-bold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{u.fullName}</p>
                            <p className="text-xs text-slate-400">PID: {u.processId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-slate-300 hidden sm:table-cell">{u.email}</td>
                      <td className="p-3 text-sm text-slate-300 hidden md:table-cell">{u.mobile}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-bold text-violet-300 bg-violet-500/15 border border-violet-500/30 px-2 py-0.5 rounded-lg">
                            {u.referralId || '—'}
                          </span>
                          {u.referralId && (
                            <button onClick={() => handleCopyId(u.referralId)} className="p-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer">
                              {copiedId === u.referralId ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-3 hidden lg:table-cell">
                        <span className="text-xs font-mono text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg">{u.sponsorId || '—'}</span>
                      </td>
                      <td className="p-3"><StatusBadge status={u.status} /></td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(u)} className="h-8 w-8 p-0 text-slate-400 hover:text-violet-300 hover:bg-violet-500/10 cursor-pointer">
                            <Eye className="w-4 h-4" />
                          </Button>
                          {u.status !== 'terminated' ? (
                            <Button size="sm" variant="ghost" onClick={() => handleTerminate(u.id)} className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer">
                              <Ban className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => handleReactivate(u.id)} className="h-8 w-8 p-0 text-emerald-400 hover:bg-emerald-500/10 cursor-pointer">
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white cursor-pointer">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-slate-400">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white cursor-pointer">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* User Detail Dialog with Tabs */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-slate-950 border border-violet-500/20 text-white shadow-2xl rounded-2xl max-w-lg w-full">
          <DialogHeader>
            <DialogTitle className="text-white font-bold">User Details</DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              {/* User Card */}
              <div className="flex items-center gap-3 p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                <Avatar className="w-12 h-12 border-2 border-violet-500/40">
                  <AvatarImage src={selectedUser.profilePhoto} alt={selectedUser.fullName} />
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-bold">
                    {selectedUser.fullName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-white">{selectedUser.fullName}</p>
                  <p className="text-xs text-slate-400">{selectedUser.email}</p>
                  <span className="text-xs font-mono text-violet-300 bg-violet-500/15 px-2 py-0.5 rounded-lg mt-1 inline-block">{selectedUser.referralId}</span>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
                <button
                  onClick={() => handleTabChange('profile')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${activeTab === 'profile' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'text-slate-400 hover:text-white'}`}
                >
                  <User className="w-3.5 h-3.5" /> Profile
                </button>
                <button
                  onClick={() => handleTabChange('passive')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${activeTab === 'passive' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-white'}`}
                >
                  <TrendingUp className="w-3.5 h-3.5" /> Passive Income
                </button>
                <button
                  onClick={() => handleTabChange('downline')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${activeTab === 'downline' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white'}`}
                >
                  <Users className="w-3.5 h-3.5" /> Downline Tree
                </button>
              </div>

              {/* Tab: Profile */}
              {activeTab === 'profile' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Full Name</label>
                    <Input value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} className="mt-1 bg-white/5 border-white/10 text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Mobile</label>
                    <Input value={editForm.mobile} onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })} className="mt-1 bg-white/5 border-white/10 text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Status</label>
                    <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full mt-1 h-10 rounded-xl border border-white/10 px-3 text-sm bg-slate-900 text-white">
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="terminated">Terminated</option>
                    </select>
                  </div>
                  <Button onClick={handleSave} className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shadow-lg cursor-pointer rounded-xl py-5">
                    Save Changes
                  </Button>
                </div>
              )}

              {/* Tab: Passive Income */}
              {activeTab === 'passive' && (
                <div className="space-y-3">
                  {passiveLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />)}
                    </div>
                  ) : passiveTxs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                      <TrendingUp className="w-8 h-8 text-slate-600" />
                      <p className="text-slate-400 text-sm">No passive commissions yet</p>
                    </div>
                  ) : (
                    <>
                      {/* Summary */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-2.5 text-center">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Total</p>
                          <p className="text-sm font-black text-violet-300">{fmt(passiveTotal)}</p>
                        </div>
                        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-center">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide">L1 (7.5%)</p>
                          <p className="text-sm font-black text-amber-300">
                            {fmt(passiveTxs.filter(t => t.transactionType === 'l1_commission').reduce((s, t) => s + t.commissionAmount, 0))}
                          </p>
                        </div>
                        <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-2.5 text-center">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide">L2 (2.5%)</p>
                          <p className="text-sm font-black text-cyan-300">
                            {fmt(passiveTxs.filter(t => t.transactionType === 'l2_commission').reduce((s, t) => s + t.commissionAmount, 0))}
                          </p>
                        </div>
                      </div>

                      {/* Transaction list */}
                      <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                        {passiveTxs.map((tx) => {
                          const isL1 = tx.transactionType === 'l1_commission';
                          return (
                            <div key={tx.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 transition-colors">
                              <div className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isL1 ? 'bg-amber-500/15' : 'bg-cyan-500/15'}`}>
                                  {isL1 ? <Award className="w-3.5 h-3.5 text-amber-400" /> : <Layers className="w-3.5 h-3.5 text-cyan-400" />}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-white">{isL1 ? 'L1' : 'L2'} — {tx.sourceReport?.appName || 'Report'}</p>
                                  <p className="text-[10px] text-slate-500">{fmtDate(tx.createdAt)}</p>
                                </div>
                              </div>
                              <p className={`text-sm font-black ${isL1 ? 'text-amber-300' : 'text-cyan-300'}`}>+{fmt(tx.commissionAmount)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Tab: Downline Tree */}
              {activeTab === 'downline' && (
                <div className="space-y-3">
                  {downlineLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />)}
                    </div>
                  ) : downline.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                      <Users className="w-8 h-8 text-slate-600" />
                      <p className="text-slate-400 text-sm">No downline referrals yet</p>
                    </div>
                  ) : (
                    <>
                      <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                        <p className="text-xs text-indigo-300 font-bold">Total Team Size: {downline.length} Members</p>
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-1 pr-1 bg-white/3 border border-white/5 rounded-xl p-2.5">
                        {tree.map(node => {
                          const renderNode = (n: any, depth: number = 0): React.ReactNode => {
                            const hasChildren = n.children && n.children.length > 0;
                            const isExpanded = expandedNodes.has(n.id);
                            return (
                              <div key={n.id} className="space-y-1">
                                <div 
                                  className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/5 text-xs transition-colors"
                                  style={{ marginLeft: `${depth * 16}px` }}
                                >
                                  {hasChildren ? (
                                    <button 
                                      onClick={() => toggleNode(n.id)}
                                      className="p-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-400 cursor-pointer"
                                    >
                                      {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                    </button>
                                  ) : (
                                    <span className="w-4 h-4 flex items-center justify-center text-slate-600">•</span>
                                  )}
                                  <span className="font-semibold text-white truncate max-w-[120px]">{n.fullName}</span>
                                  <span className="text-[10px] text-indigo-300 bg-indigo-500/25 px-1.5 py-0.2 rounded font-mono">{n.referralId}</span>
                                  <span className="text-[9px] text-slate-400 ml-auto">L{n.level} • {n.reportCount} reports</span>
                                </div>
                                {hasChildren && isExpanded && (
                                  <div className="relative">
                                    <div 
                                      className="absolute top-0 bottom-0 w-px bg-white/10" 
                                      style={{ left: `${depth * 16 + 7}px` }} 
                                    />
                                    {n.children.map((child: any) => renderNode(child, depth + 1))}
                                  </div>
                                )}
                              </div>
                            );
                          };
                          return renderNode(node, 0);
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
