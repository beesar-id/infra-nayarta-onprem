import React, { useState } from 'react';
import { apiService } from '../services/api';
import type { Profile } from '../types';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Square } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileControlsProps {
  profile: Profile;
  onActionComplete: () => void;
}

export const ProfileControls: React.FC<ProfileControlsProps> = ({
  profile,
  onActionComplete,
}) => {
  const [loading, setLoading] = useState<'up' | 'down' | null>(null);

  const handleAction = async (action: 'up' | 'down') => {
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

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => handleAction('up')}
        disabled={loading !== null}
        variant="outline"
        size="sm"
        className="flex-1 border border-primary"
      >
        {loading === 'up' ? (
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
        disabled={loading !== null}
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
  );
};
