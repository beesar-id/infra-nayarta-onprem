import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Profile } from '../types';

interface ProfileSelectorProps {
  selectedProfile: Profile | 'all';
  onProfileChange: (profile: Profile | 'all') => void;
  profiles: string[];
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  selectedProfile,
  onProfileChange,
  profiles,
}) => {
  return (
    <Select value={selectedProfile} onValueChange={onProfileChange}>
      <SelectTrigger className="w-48 border border-primary">
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
  );
};
