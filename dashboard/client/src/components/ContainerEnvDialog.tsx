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

interface ContainerEnvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  containerId: string;
  containerName: string;
}

export const ContainerEnvDialog: React.FC<ContainerEnvDialogProps> = ({
  open,
  onOpenChange,
  containerId,
  containerName,
}) => {
  const [env, setEnv] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && containerId) {
      setLoading(true);
      apiService.getContainerDetails(containerId)
        .then((details) => {
          setEnv(details.env || []);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open, containerId]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
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
            <div className="space-y-2">
              {env.length > 0 ? (
                env.map((envVar, idx) => (
                  <div key={idx} className="p-3 bg-muted rounded-md">
                    <code className="text-sm font-mono break-all">{envVar}</code>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No environment variables
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};


