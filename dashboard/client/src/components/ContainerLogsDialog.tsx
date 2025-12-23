import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { apiService } from '../services/api';

interface ContainerLogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  containerId: string;
  containerName: string;
}

export const ContainerLogsDialog: React.FC<ContainerLogsDialogProps> = ({
  open,
  onOpenChange,
  containerId,
  containerName,
}) => {
  const [logs, setLogs] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && containerId) {
      setLoading(true);
      apiService.getContainerLogs(containerId, 500)
        .then(setLogs)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open, containerId]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{containerName}</DialogTitle>
          <p className="text-sm text-muted-foreground font-mono">
            {containerId.substring(0, 12)}
          </p>
        </DialogHeader>
        <Separator />
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <pre className="text-xs font-mono bg-muted p-4 rounded-md whitespace-pre-wrap break-words">
              {logs || 'No logs available'}
            </pre>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};


