import React, { useState } from 'react';
import { apiService } from '../services/api';
import type { Profile } from '../types';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Square } from 'lucide-react';
import { toast } from 'sonner';
import { ComposeProgressDialog } from './ComposeProgressDialog';

interface ProfileControlsProps {
  profile: Profile;
  onActionComplete: () => void;
}

export const ProfileControls: React.FC<ProfileControlsProps> = ({
  profile,
  onActionComplete,
}) => {
  const [loading, setLoading] = useState<'up' | 'down' | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [currentAction, setCurrentAction] = useState<'up' | 'down'>('up');

  const handleAction = async (action: 'up' | 'down') => {
    // For 'up' action, show progress dialog
    if (action === 'up') {
      setCurrentAction(action);
      setShowProgress(true);
      return;
    }

    // For 'down' action, use simple loading
    setLoading(action);
    
    try {
      const result = await apiService.executeCompose(profile, action);
      
      if (result.success) {
        toast.success(`Profile ${profile} ${action} berhasil`);
        setTimeout(() => {
          onActionComplete();
        }, 2000);
      } else {
        toast.error(result.error || `Gagal menjalankan ${action} pada profile ${profile}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Terjadi kesalahan');
    } finally {
      setLoading(null);
    }
  };

  const handleProgressComplete = (success: boolean) => {
    setShowProgress(false);
    if (success) {
      toast.success(`Profile ${profile} ${currentAction} berhasil`);
      setTimeout(() => {
        onActionComplete();
      }, 2000);
    } else {
      toast.error(`Gagal menjalankan ${currentAction} pada profile ${profile}`);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          onClick={() => handleAction('up')}
          disabled={loading !== null || showProgress}
          variant="outline"
          size="sm"
          className="flex-1 border border-primary"
        >
          {showProgress && currentAction === 'up' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Play className="mr-1 h-4 w-4" />
              Up
            </>
          )}
        </Button>
        <Button
          onClick={() => handleAction('down')}
          disabled={loading !== null || showProgress}
          variant="outline"
          size="sm"
          className="flex-1 border border-primary"
        >
          {loading === 'down' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Square className="mr-1 h-4 w-4" />
              Down
            </>
          )}
        </Button>
      </div>
      <ComposeProgressDialog
        open={showProgress}
        onOpenChange={setShowProgress}
        profile={profile}
        action={currentAction}
        onComplete={handleProgressComplete}
      />
    </>
  );
};
