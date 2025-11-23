import { Clock, User, FileText, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export interface KycAuditLogEntry {
  id: string;
  sellerId: string;
  action: string;
  performedBy: string;
  reason?: string | null;
  timestamp: string;
}

interface KycAuditLogProps {
  logs: KycAuditLogEntry[];
  isLoading?: boolean;
}

const actionIcons: Record<string, React.ReactNode> = {
  SUBMITTED: <FileText className="w-4 h-4" />,
  RESUBMITTED: <RefreshCw className="w-4 h-4" />,
  APPROVED: <CheckCircle className="w-4 h-4" />,
  REJECTED: <XCircle className="w-4 h-4" />,
  EXPIRED: <AlertCircle className="w-4 h-4" />,
  DUPLICATE_ID_ATTEMPT: <AlertCircle className="w-4 h-4" />,
  DUPLICATE_BVN_ATTEMPT: <AlertCircle className="w-4 h-4" />,
};

const actionColors: Record<string, string> = {
  SUBMITTED: 'text-blue-400',
  RESUBMITTED: 'text-blue-400',
  APPROVED: 'text-green-400',
  REJECTED: 'text-red-400',
  EXPIRED: 'text-yellow-400',
  DUPLICATE_ID_ATTEMPT: 'text-orange-400',
  DUPLICATE_BVN_ATTEMPT: 'text-orange-400',
};

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
};

export default function KycAuditLog({ logs, isLoading }: KycAuditLogProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Audit Log
        </h3>
        <p className="text-sm text-gray-400">Loading audit log...</p>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Audit Log
        </h3>
        <p className="text-sm text-gray-400">No audit log entries found.</p>
      </div>
    );
  }

  // Sort logs by timestamp (newest first)
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Audit Log
      </h3>
      <div className="space-y-4">
        {sortedLogs.map((log, index) => {
          const icon = actionIcons[log.action] || <FileText className="w-4 h-4" />;
          const color = actionColors[log.action] || 'text-gray-400';
          const isLast = index === sortedLogs.length - 1;

          return (
            <div key={log.id} className="relative">
              {/* Timeline line */}
              {!isLast && (
                <div className="absolute left-[7px] top-6 bottom-0 w-0.5 bg-[#2a2a2a]" />
              )}
              
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`flex-shrink-0 w-4 h-4 rounded-full bg-[#1a1f2e] border-2 border-[#2a2a2a] flex items-center justify-center ${color}`}>
                  {icon}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${color}`}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {log.performedBy === 'SYSTEM' ? 'System' : log.performedBy}
                    </span>
                  </div>
                  
                  {log.reason && (
                    <div className="mt-2 p-2 rounded-lg bg-[#0f1419] border border-[#2a2a2a]">
                      <p className="text-xs text-gray-400 mb-1">Reason:</p>
                      <p className="text-sm text-gray-300">{log.reason}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {formatDate(log.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

