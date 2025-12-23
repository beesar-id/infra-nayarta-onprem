import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { apiService } from '../services/api';

interface ContainerDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  containerId: string;
  containerName: string;
}

export const ContainerDetailsDialog: React.FC<ContainerDetailsDialogProps> = ({
  open,
  onOpenChange,
  containerId,
  containerName,
}) => {
  const [details, setDetails] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && containerId) {
      setLoading(true);
      Promise.all([
        apiService.getContainerDetails(containerId),
        apiService.getContainerStats(containerId).catch(() => null),
      ])
        .then(([detailsData, statsData]) => {
          setDetails(detailsData);
          setStats(statsData);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open, containerId]);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Container Details</DialogTitle>
          <DialogDescription>
            Informasi lengkap tentang container
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Container Name</p>
                <p className="text-sm">{containerName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Container ID</p>
                <code className="text-xs bg-muted px-2 py-1 rounded">{details?.id?.substring(0, 12) || containerId.substring(0, 12)}</code>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Image</p>
                <p className="text-sm">{details?.image || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
                <Badge variant={details?.status === 'running' ? 'default' : 'destructive'}>
                  {details?.status || 'N/A'}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Ports */}
            {details?.ports && Object.keys(details.ports).length > 0 && (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Ports</p>
                  <div className="space-y-1">
                    {Object.entries(details.ports).map(([port, config]: [string, any]) => (
                      <div key={port} className="text-sm">
                        {config?.[0]?.HostPort ? (
                          <span>{config[0].HostPort}:{port}/{config[0].Type}</span>
                        ) : (
                          <span>{port}/{config?.[0]?.Type || 'tcp'}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Volumes */}
            {details?.Mounts && details.Mounts.length > 0 && (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Volumes</p>
                  <div className="space-y-2">
                    {details.Mounts.map((mount: any, idx: number) => (
                      <div key={idx} className="text-sm">
                        <p className="font-medium">{mount.Destination}</p>
                        <p className="text-muted-foreground text-xs">{mount.Source}</p>
                        {mount.Type && (
                          <p className="text-muted-foreground text-xs">Type: {mount.Type}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Resource Usage */}
            {stats && (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Resource Usage</p>
                  <div className="grid grid-cols-2 gap-4">
                    {stats.cpu !== undefined && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">CPU Usage</p>
                        <p className="text-sm font-medium">{formatPercent(stats.cpu)}</p>
                      </div>
                    )}
                    {stats.memory && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Memory Usage</p>
                        <p className="text-sm font-medium">{formatBytes(stats.memory.usage)} / {formatBytes(stats.memory.limit)}</p>
                      </div>
                    )}
                    {stats.disk && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Disk Read/Write</p>
                        <p className="text-sm font-medium">R: {formatBytes(stats.disk.read)} / W: {formatBytes(stats.disk.write)}</p>
                      </div>
                    )}
                    {stats.network && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Network I/O</p>
                        <p className="text-sm font-medium">↓ {formatBytes(stats.network.rx)} / ↑ {formatBytes(stats.network.tx)}</p>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* PID */}
            {details?.State?.Pid && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">PID</p>
                <p className="text-sm">{details.State.Pid}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
