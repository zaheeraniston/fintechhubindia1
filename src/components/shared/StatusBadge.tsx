'use client';

import { Badge } from '@/components/ui/badge';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  pending: { label: 'Pending', variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  accepted: { label: 'Accepted', variant: 'default', className: 'bg-blue-100 text-blue-800 border-blue-300' },
  rejected: { label: 'Rejected', variant: 'destructive', className: 'bg-red-100 text-red-800 border-red-300' },
  trade_pending: { label: 'Trade Pending', variant: 'outline', className: 'bg-orange-100 text-orange-800 border-orange-300' },
  trade_completed: { label: 'Trade Completed', variant: 'default', className: 'bg-teal-100 text-teal-800 border-teal-300' },
  done: { label: 'Done', variant: 'default', className: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  lead_received: { label: 'Lead Recived', variant: 'default', className: 'bg-violet-100 text-violet-800 border-violet-300' },
  payment_clex: { label: 'Payment Clex', variant: 'default', className: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300' },
  no_lead_check_clint_info: { label: 'No Lead Check Clint Info.', variant: 'destructive', className: 'bg-rose-100 text-rose-800 border-rose-300' },
  active: { label: 'Active', variant: 'default', className: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  inactive: { label: 'Inactive', variant: 'secondary', className: 'bg-gray-100 text-gray-800 border-gray-300' },
  terminated: { label: 'Terminated', variant: 'destructive', className: 'bg-red-100 text-red-800 border-red-300' },
  suspended: { label: 'Suspended', variant: 'outline', className: 'bg-orange-100 text-orange-800 border-orange-300' },
  processing: { label: 'Processing', variant: 'default', className: 'bg-blue-100 text-blue-800 border-blue-300' },
  completed: { label: 'Completed', variant: 'default', className: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  upcoming: { label: 'Upcoming', variant: 'outline', className: 'bg-purple-100 text-purple-800 border-purple-300' },
  cancelled: { label: 'Cancelled', variant: 'destructive', className: 'bg-red-100 text-red-800 border-red-300' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800' };

  return (
    <Badge variant={config.variant} className={`text-xs font-medium ${config.className}`}>
      {config.label}
    </Badge>
  );
}
