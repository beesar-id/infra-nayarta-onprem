import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import type { Profile } from '../types';

interface ComposeProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile;
  action: 'up' | 'down';
  onComplete: (success: boolean) => void;
}

export const ComposeProgressDialog: React.FC<ComposeProgressDialogProps> = ({
  open,
  onOpenChange,
  profile,
  action,
  onComplete,
}) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<'running' | 'success' | 'error'>('running');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!open) {
      // Cleanup when dialog closes
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setLogs([]);
      setStatus('running');
      setErrorMessage('');
      return;
    }

    // Create EventSource for SSE
    const eventSource = new EventSource(`/api/compose/${profile}/${action}/progress`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'start':
            setLogs(prev => [...prev, data.message]);
            setStatus('running');
            break;
          case 'output':
            setLogs(prev => [...prev, data.data]);
            // Auto-scroll to bottom
            setTimeout(() => {
              if (scrollAreaRef.current) {
                scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
              }
            }, 100);
            break;
          case 'error':
            setErrorMessage(data.error);
            setStatus('error');
            eventSource.close();
            onComplete(false);
            break;
          case 'complete':
            setStatus(data.success ? 'success' : 'error');
            if (!data.success) {
              setErrorMessage(data.message);
            }
            eventSource.close();
            onComplete(data.success);
            // Auto-close after 2 seconds on success
            if (data.success) {
              setTimeout(() => {
                onOpenChange(false);
              }, 2000);
            }
            break;
        }
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      setStatus('error');
      setErrorMessage('Connection error occurred');
      eventSource.close();
      onComplete(false);
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [open, profile, action, onOpenChange, onComplete]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {status === 'running' && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            {status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
            {action === 'up' ? 'Starting' : 'Stopping'} Profile: {profile}
          </DialogTitle>
          <DialogDescription>
            {status === 'running' && 'Please wait while containers are being started...'}
            {status === 'success' && 'Profile operation completed successfully!'}
            {status === 'error' && `Error: ${errorMessage}`}
          </DialogDescription>
        </DialogHeader>
        <div className="h-[400px] w-full rounded-md border p-4 overflow-y-auto bg-muted/50" ref={scrollAreaRef}>
          <div className="space-y-1 font-mono text-xs">
            {logs.length === 0 ? (
              <div className="text-muted-foreground">Waiting for output...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="whitespace-pre-wrap break-words">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

