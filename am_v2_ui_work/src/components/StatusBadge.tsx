import React from 'react';
import { ToolStatus } from '../types/tool';

interface StatusBadgeProps {
  status: ToolStatus;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showDot = true,
}) => {
  const getStyles = () => {
    switch (status) {
      case 'Available':
        return {
          wrapper: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 ring-emerald-500/20',
          dot: 'bg-emerald-400',
          ping: 'bg-emerald-400/40',
          label: 'Available',
        };
      case 'In Use':
        return {
          wrapper: 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60 ring-cyan-500/20',
          dot: 'bg-cyan-400',
          ping: 'bg-cyan-400/40',
          label: 'In Use',
        };
      case 'Maintenance':
        return {
          wrapper: 'bg-amber-950/40 text-amber-300 border-amber-800/60 ring-amber-500/20',
          dot: 'bg-amber-400',
          ping: 'bg-amber-400/40',
          label: 'Maintenance',
        };
      case 'Offline':
        return {
          wrapper: 'bg-rose-950/40 text-rose-300 border-rose-800/60 ring-rose-500/20',
          dot: 'bg-rose-500',
          ping: 'bg-rose-400/30',
          label: 'Offline',
        };
    }
  };

  const config = getStyles();

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
    lg: 'text-sm px-3.5 py-1.5 gap-2.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ring-1 transition-all ${sizeClasses} ${config.wrapper}`}
    >
      {showDot && (
        <span className="relative flex h-2 w-2">
          {status === 'In Use' || status === 'Maintenance' ? (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.ping}`}
            />
          ) : null}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
        </span>
      )}
      <span className="font-semibold tracking-wide">{config.label}</span>
    </span>
  );
};
