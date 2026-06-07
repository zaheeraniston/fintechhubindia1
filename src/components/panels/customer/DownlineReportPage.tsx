'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner, EmptyState } from '@/components/shared/LoadingStates';
import { toast } from 'sonner';
import {
  Users, Download, FileText, UserCircle, Copy, CheckCircle2,
  ChevronRight, ChevronDown, TreePine, List, Share2,
} from 'lucide-react';

interface DownlineUser {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  processId: string;
  sponsorId: string;
  referralId: string;
  level: number;
  reportCount: number;
  totalEarnings: number;
  sponsorUserId?: string;
}

interface TreeNode extends DownlineUser {
  children: TreeNode[];
}

type ViewMode = 'tree' | 'table';

export function DownlineReportPage() {
  const { user } = useAppStore();
  const [downline, setDownline] = useState<DownlineUser[]>([]);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [levelBreakdown, setLevelBreakdown] = useState<{ level: number; count: number }[]>([]);
  const [maxLevel, setMaxLevel] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await apiFetch(`/downline?userId=${user?.id}`);
        setDownline(data.data || []);
        setTree(data.tree || []);
        setLevelBreakdown(data.meta?.levelBreakdown || []);
        setMaxLevel(data.meta?.maxLevel || 0);
        // Auto-expand first level
        const firstLevelIds = (data.tree || []).map((n: TreeNode) => n.id);
        setExpandedNodes(new Set(firstLevelIds));
      } catch {
        toast.error('Failed to load downline report');
      } finally {
        setLoading(false);
      }
    }
    if (user?.id) fetchData();
  }, [user?.id]);

  function handleExportCSV() {
    try {
      if (downline.length === 0) {
        toast.error('No downline data to export');
        return;
      }
      
      const headers = ['Level', 'Name', 'Email', 'Mobile', 'Process ID', 'Sponsor ID', 'Referral ID', 'Reports Submitted', 'Total Earnings (INR)'];
      const rows = downline.map(m => [
        `Level ${m.level}`,
        m.fullName.replace(/"/g, '""'),
        m.email,
        m.mobile,
        m.processId,
        m.sponsorId,
        m.referralId,
        m.reportCount,
        m.totalEarnings
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(val => `"${val}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `downline-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('CSV downloaded!');
    } catch {
      toast.error('Failed to export CSV');
    }
  }

  function handleExportPDF() {
    try {
      if (downline.length === 0) {
        toast.error('No downline data to export');
        return;
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Please allow popups to download the PDF report');
        return;
      }

      const formattedDate = new Date().toLocaleString('en-IN', {
        dateStyle: 'long',
        timeStyle: 'short'
      });

      const tableRowsHtml = downline.map(m => `
        <tr>
          <td><span class="level-badge lvl-${(m.level - 1) % 6}">L${m.level}</span></td>
          <td class="font-bold">${m.fullName}</td>
          <td>${m.email}</td>
          <td>${m.mobile || '—'}</td>
          <td><span class="mono">${m.processId || '—'}</span></td>
          <td><span class="mono font-bold">${m.referralId}</span></td>
          <td><span class="mono">${m.sponsorId || '—'}</span></td>
          <td class="text-center font-bold">${m.reportCount}</td>
          <td class="text-right font-bold price">₹${m.totalEarnings.toLocaleString('en-IN')}</td>
        </tr>
      `).join('');

      const levelSummaryHtml = levelBreakdown.map(lb => `
        <div class="summary-card">
          <div class="card-title">Level ${lb.level}</div>
          <div class="card-value">${lb.count}</div>
          <div class="card-desc">Member${lb.count > 1 ? 's' : ''}</div>
        </div>
      `).join('');

      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Downline_Report_${user?.fullName?.replace(/\s+/g, '_')}</title>
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .no-print { display: none; }
            }
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #1e293b;
              margin: 0;
              padding: 40px;
              background-color: #ffffff;
              font-size: 12px;
              line-height: 1.4;
            }
            .header-container {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 3px solid #7c3aed;
              padding-bottom: 20px;
              margin-bottom: 25px;
            }
            .company-info h1 {
              font-size: 24px;
              font-weight: 800;
              margin: 0;
              color: #1e1b4b;
              letter-spacing: 0.5px;
            }
            .company-info p {
              margin: 4px 0 0 0;
              color: #64748b;
              font-size: 11px;
              font-weight: 550;
            }
            .report-meta {
              text-align: right;
            }
            .report-title {
              font-size: 13px;
              font-weight: 800;
              text-transform: uppercase;
              color: #7c3aed;
              margin: 0 0 4px 0;
            }
            .meta-item {
              margin: 2px 0;
              color: #475569;
              font-size: 11px;
            }
            .user-summary {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 15px 20px;
              margin-bottom: 25px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              flex-wrap: wrap;
              gap: 15px;
            }
            .user-info-block h3 {
              margin: 0 0 4px 0;
              color: #0f172a;
              font-size: 14px;
              font-weight: 700;
            }
            .user-info-block p {
              margin: 2px 0;
              color: #475569;
              font-size: 11px;
            }
            .summary-stats-grid {
              display: flex;
              gap: 10px;
            }
            .summary-card {
              background: #ffffff;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              padding: 6px 12px;
              text-align: center;
              min-width: 65px;
            }
            .card-title {
              font-size: 9px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
            }
            .card-value {
              font-size: 16px;
              font-weight: 800;
              color: #7c3aed;
              margin: 1px 0;
            }
            .card-desc {
              font-size: 8px;
              color: #94a3b8;
            }
            .section-title {
              font-size: 14px;
              font-weight: 800;
              color: #0f172a;
              margin: 0 0 12px 0;
              border-left: 4px solid #7c3aed;
              padding-left: 8px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 25px;
            }
            th {
              background-color: #f1f5f9;
              color: #334155;
              font-weight: 700;
              text-transform: uppercase;
              font-size: 10px;
              letter-spacing: 0.5px;
              border-bottom: 2px solid #cbd5e1;
              padding: 10px 8px;
              text-align: left;
            }
            td {
              padding: 10px 8px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 11px;
              color: #334155;
            }
            tr:nth-child(even) {
              background-color: #f8fafc;
            }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-bold { font-weight: 700; }
            .mono { font-family: monospace; font-size: 11px; color: #0f172a; }
            .level-badge {
              display: inline-block;
              padding: 1px 6px;
              font-size: 9px;
              font-weight: 800;
              color: #ffffff;
              border-radius: 4px;
              text-transform: uppercase;
            }
            .lvl-0 { background-color: #8b5cf6; }
            .lvl-1 { background-color: #d946ef; }
            .lvl-2 { background-color: #6366f1; }
            .lvl-3 { background-color: #ec4899; }
            .lvl-4 { background-color: #3b82f6; }
            .lvl-5 { background-color: #a855f7; }
            .price { color: #0f766e; }
            .footer {
              text-align: center;
              font-size: 10px;
              color: #94a3b8;
              border-top: 1px dashed #e2e8f0;
              padding-top: 15px;
              margin-top: 30px;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header-container">
            <div class="company-info">
              <h1>FINTECH HUB INDIA</h1>
              <p>Team Building & Referral Network Partner</p>
            </div>
            <div class="report-meta">
              <div class="report-title">Downline Network Report</div>
              <div class="meta-item">Date: <strong>${formattedDate}</strong></div>
              <div class="meta-item">Total Team Size: <strong>${downline.length} Members</strong></div>
            </div>
          </div>

          <div class="user-summary">
            <div class="user-info-block">
              <p style="margin: 0; font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700;">Report Owner</p>
              <h3>${user?.fullName || 'Valued Partner'}</h3>
              <p>Referral Code: <strong>${user?.referralId || '—'}</strong> | Process ID: <strong>${user?.processId || '—'}</strong></p>
            </div>
            <div class="summary-stats-grid">
              <div class="summary-card">
                <div class="card-title">Max Depth</div>
                <div class="card-value">${maxLevel}</div>
                <div class="card-desc">Levels Deep</div>
              </div>
              ${levelSummaryHtml}
            </div>
          </div>

          <div class="section-title">Network Tree Directory</div>
          <table>
            <thead>
              <tr>
                <th>Level</th>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Mobile</th>
                <th>Process ID</th>
                <th>Referral ID</th>
                <th>Sponsor ID</th>
                <th class="text-center">Reports</th>
                <th class="text-right">Total Earnings</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>

          <div class="footer">
            This document is a system-generated Downline Network Report from FINTECH HUB INDIA. &copy; ${new Date().getFullYear()} FINTECH HUB INDIA. All rights reserved.
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      toast.success('PDF report generated successfully!');
    } catch (err) {
      toast.error('Failed to export PDF');
    }
  }

  function handleCopyId(id: string) {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success('Referral code copied!');
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleShareReferralCode(referralCode: string, name: string) {
    const shareText = `Join FINTECH HUB INDIA! Use my referral code: ${referralCode} to sign up and start earning.`;
    if (navigator.share) {
      navigator.share({ title: `${name}'s Referral Code`, text: shareText });
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success('Referral link copied!');
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

  if (loading) return <LoadingSpinner text="Loading downline report..." />;

  if (downline.length === 0) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto relative z-10">
        {/* Show referral code card even when no downline */}
        <Card className="border border-white/10 shadow-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-violet-950 overflow-hidden relative rounded-3xl card-hover-3d mb-6">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdi0yMGgtNjB6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-30" />
          <CardContent className="p-5 sm:p-6 relative">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-violet-300" />
              <p className="text-slate-400 text-sm font-medium">Your Referral Code</p>
            </div>
            <h2 className="text-3xl font-black text-white tracking-widest mb-2 font-mono">{user?.referralId || '—'}</h2>
            <p className="text-slate-400 text-xs">Share this code to build your team!</p>
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => handleCopyId(user?.referralId || '')}
                className="bg-white/10 hover:bg-white/20 text-white border-white/10 rounded-xl cursor-pointer"
                size="sm"
              >
                <Copy className="w-3.5 h-3.5 mr-1" /> Copy
              </Button>
              <Button
                onClick={() => handleShareReferralCode(user?.referralId || '', user?.fullName || '')}
                className="bg-white/10 hover:bg-white/20 text-white border-white/10 rounded-xl cursor-pointer"
                size="sm"
              >
                <Share2 className="w-3.5 h-3.5 mr-1" /> Share
              </Button>
            </div>
          </CardContent>
        </Card>
        <EmptyState icon={Users} title="No Downline Yet" description="Share your referral code to build your team. When someone signs up with your code, they appear here!" />
      </div>
    );
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const levelColors = [
    'from-violet-500 to-indigo-600',
    'from-fuchsia-500 to-pink-600',
    'from-purple-500 to-fuchsia-600',
    'from-pink-500 to-rose-600',
    'from-indigo-500 to-blue-600',
    'from-violet-600 to-purple-700',
  ];

  // Recursive tree node renderer
  function renderTreeNode(node: TreeNode, depth: number = 0): React.ReactNode {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const indentPx = depth * 24;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2.5 py-2.5 px-3 rounded-xl transition-all duration-200 ${
            depth === 0
              ? 'bg-white/5 border border-white/5 mb-1'
              : 'hover:bg-white/5 mb-0.5'
          }`}
          style={{ marginLeft: `${indentPx}px` }}
        >
          {/* Expand/Collapse button */}
          {hasChildren ? (
            <button
              onClick={() => toggleNode(node.id)}
              className="w-6 h-6 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 flex items-center justify-center shrink-0 transition-all cursor-pointer"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-violet-300" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-violet-300" />
              )}
            </button>
          ) : (
            <div className="w-6 h-6 flex items-center justify-center shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            </div>
          )}

          {/* Avatar */}
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${levelColors[depth % levelColors.length]} flex items-center justify-center shrink-0 shadow-md`}>
            <span className="text-white text-xs font-bold">{node.fullName.charAt(0).toUpperCase()}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold truncate text-slate-100">{node.fullName}</p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-gradient-to-r ${levelColors[depth % levelColors.length]} text-white`}>
                L{node.level}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono text-violet-300 bg-violet-500/20 px-1.5 py-0.5 rounded border border-violet-500/10">{node.referralId}</span>
              <span className="text-[10px] text-slate-400">{node.reportCount} reports</span>
              <span className="text-[10px] font-semibold text-fuchsia-400">{fmt(node.totalEarnings)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => handleCopyId(node.referralId)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
              title="Copy referral code"
            >
              {copiedId === node.referralId ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
            {hasChildren && (
              <span className="text-[10px] font-medium text-violet-300 bg-violet-500/20 px-1.5 py-0.5 rounded-full border border-violet-500/20">
                {node.children.length} {node.children.length === 1 ? 'referral' : 'referrals'}
              </span>
            )}
          </div>
        </div>

        {/* Children - only shown when expanded */}
        {hasChildren && isExpanded && (
          <div className="relative">
            {/* Tree line connector */}
            <div
              className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-violet-500/40 to-transparent"
              style={{ left: `${indentPx + 11}px` }}
            />
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto relative z-10">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent tracking-wide flex items-center gap-2">
            <Users className="w-6 h-6 text-violet-400" /> Downline Report
          </h1>
          <p className="text-sm text-slate-400 mt-1">{downline.length} members in your team</p>
        </div>
        <div className="flex gap-2">
          {/* View mode toggle */}
          <div className="flex rounded-xl border border-white/10 bg-slate-900/50 p-0.5 overflow-hidden">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === 'tree' ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <TreePine className="w-3.5 h-3.5 inline mr-1" /> Tree
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <List className="w-3.5 h-3.5 inline mr-1" /> Table
            </button>
          </div>
          <Button variant="outline" onClick={handleExportCSV} className="border-white/10 text-violet-300 hover:text-white hover:bg-violet-600/20 hover:border-violet-500/50 rounded-xl cursor-pointer">
            <Download className="w-4 h-4 mr-1" /> CSV
          </Button>
          <Button variant="outline" onClick={handleExportPDF} className="border-white/10 text-fuchsia-300 hover:text-white hover:bg-fuchsia-600/20 hover:border-fuchsia-500/50 rounded-xl cursor-pointer">
            <FileText className="w-4 h-4 mr-1" /> PDF
          </Button>
        </div>
      </div>

      {/* Your Referral Code Card */}
      <Card className="border border-white/10 shadow-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-violet-950 overflow-hidden relative rounded-3xl card-hover-3d mb-6">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdi0yMGgtNjB6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-30" />
        <CardContent className="p-4 sm:p-5 relative">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Your Referral Code</p>
              <div className="flex items-center gap-2 mt-1.5">
                <h2 className="text-2xl font-black text-white tracking-widest font-mono">{user?.referralId || '—'}</h2>
                <button
                  onClick={() => handleCopyId(user?.referralId || '')}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-300 cursor-pointer"
                >
                  {copiedId === user?.referralId ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleShareReferralCode(user?.referralId || '', user?.fullName || '')}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-300 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-slate-400 text-[11px] mt-1.5">Share this code to grow your downline team</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-xs uppercase tracking-wider">Total Team</p>
              <p className="text-2xl font-black text-white mt-1">{downline.length}</p>
              <p className="text-slate-500 text-[10px] font-medium">{maxLevel} level{maxLevel > 1 ? 's' : ''} deep</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Level Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {levelBreakdown.map((lb) => (
          <Card key={lb.level} className="glass-premium border border-white/10 shadow-lg hover:shadow-xl hover:border-violet-500/30 transition-all duration-300 card-hover-3d rounded-2xl relative">
            <CardContent className="p-3 text-center">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${levelColors[(lb.level - 1) % levelColors.length]} mx-auto flex items-center justify-center shadow-lg mb-2`}>
                <span className="text-white text-sm font-bold">L{lb.level}</span>
              </div>
              <p className="text-xl font-black text-white">{lb.count}</p>
              <p className="text-xs text-slate-400">member{lb.count > 1 ? 's' : ''}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div id="downline-print">
        {viewMode === 'tree' ? (
          /* Tree View */
          <Card className="glass-premium border border-white/10 shadow-2xl rounded-3xl relative overflow-hidden">
            <CardContent className="p-4 sm:p-5 relative z-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <UserCircle className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm text-white">{user?.fullName} (You)</p>
                  <p className="text-[10px] text-slate-400">Level 0 • {downline.length} total downline</p>
                </div>
              </div>

              {tree.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No direct referrals yet</p>
              ) : (
                <div className="space-y-0.5">
                  {tree.map(node => renderTreeNode(node, 0))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Table View */
          <Card className="glass-premium border border-white/10 shadow-2xl rounded-3xl overflow-hidden relative">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5">
                      <th className="text-left p-3 text-xs font-bold text-violet-300 uppercase tracking-wider">Level</th>
                      <th className="text-left p-3 text-xs font-bold text-violet-300 uppercase tracking-wider">Name</th>
                      <th className="text-left p-3 text-xs font-bold text-violet-300 uppercase tracking-wider hidden sm:table-cell">Referral Code</th>
                      <th className="text-left p-3 text-xs font-bold text-violet-300 uppercase tracking-wider hidden md:table-cell">Mobile</th>
                      <th className="text-left p-3 text-xs font-bold text-violet-300 uppercase tracking-wider">Reports</th>
                      <th className="text-right p-3 text-xs font-bold text-violet-300 uppercase tracking-wider">Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {downline.map((member) => (
                      <tr key={member.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-3">
                          <span className={`text-xs font-bold text-white bg-gradient-to-r ${levelColors[(member.level - 1) % levelColors.length]} px-2 py-0.5 rounded`}>
                            L{member.level}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <UserCircle className="w-4 h-4 text-slate-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate text-white">{member.fullName}</p>
                              <p className="text-[10px] text-slate-400 sm:hidden font-mono">{member.referralId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 hidden sm:table-cell">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono font-semibold text-violet-300 bg-violet-500/20 border border-violet-500/10 px-1.5 py-0.5 rounded">
                              {member.referralId}
                            </span>
                            <button
                              onClick={() => handleCopyId(member.referralId)}
                              className="p-1 rounded hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
                              title="Copy referral code"
                            >
                              {copiedId === member.referralId ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-slate-400 hidden md:table-cell">{member.mobile}</td>
                        <td className="p-3 text-sm font-medium text-slate-200">{member.reportCount}</td>
                        <td className="p-3 text-sm font-bold text-fuchsia-400 text-right">{fmt(member.totalEarnings)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
