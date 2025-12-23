import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Profile } from '../types';

interface ProfileSelectorProps {
  selectedProfile: Profile | 'all';
  onProfileChange: (profile: Profile | 'all') => void;
  profiles: string[];
}

export const PROFILE_DESCRIPTIONS: Record<Profile | 'all', string> = {
  'appstack': 'Stack lengkap aplikasi Nayarta beserta infrastruktur pendukungnya: API, Admin, Frontend, MQTT (EMQX), MediaMTX, dan Database PostgreSQL',
  'analytics-tools': 'Tools untuk kebutuhan analytics dan data processing: RabbitMQ (AMQP) untuk message queue dan ClickHouse untuk data warehouse',
  'app': 'Container aplikasi utama Nayarta: API backend, Server-Sent Events (SSE), Admin panel, dan VMS Frontend',
  'stream': 'Infrastruktur streaming video: MediaMTX untuk live streaming dan MediaMTX NVR untuk network video recording',
  'stream-camera': 'Container untuk simulasi video analytics: MediaMTX dengan multiple camera dummy (cam1-cam4) untuk testing dan development',
  'all': 'Menampilkan semua container yang terkait dengan project Nayarta, termasuk aplikasi, infrastruktur, dan tools pendukung',
};

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  selectedProfile,
  onProfileChange,
  profiles,
}) => {
  return (
    <div className="space-y-2">
      <Select value={selectedProfile} onValueChange={onProfileChange}>
        <SelectTrigger className="w-full border border-primary">
          <SelectValue placeholder="Pilih Profile" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Container</SelectItem>
          {profiles.map((profile) => (
            <SelectItem key={profile} value={profile}>
              {profile}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="bg-muted/50 border border-dashed border-primary/30 rounded-md p-2">
        <p className="text-xs text-muted-foreground">{PROFILE_DESCRIPTIONS[selectedProfile]}</p>
      </div>
    </div>
  );
};
