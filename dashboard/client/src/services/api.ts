import axios from 'axios';
import type { Container, ContainerDetail, Profile, ComposeAction } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  // Get all profiles
  getProfiles: async (): Promise<string[]> => {
    const response = await api.get('/api/profiles');
    return response.data.profiles;
  },

  // Get containers
  getContainers: async (profile?: Profile): Promise<Container[]> => {
    const params = profile ? { profile } : {};
    const response = await api.get('/api/containers', { params });
    return response.data.containers;
  },

  // Get container details
  getContainerDetails: async (id: string): Promise<ContainerDetail> => {
    const response = await api.get(`/api/containers/${id}`);
    return response.data;
  },

  // Execute docker compose command
  executeCompose: async (profile: Profile, action: 'up' | 'down'): Promise<{ success: boolean; message: string; output?: string; error?: string }> => {
    const response = await api.post(`/api/compose/${profile}/${action}`);
    return response.data;
  },

  // Container control
  containerAction: async (id: string, action: 'start' | 'stop' | 'restart' | 'remove'): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/api/containers/${id}/${action}`);
    return response.data;
  },

  // Get container logs
  getContainerLogs: async (id: string, tail: number = 100): Promise<string> => {
    const response = await api.get(`/api/containers/${id}/logs`, {
      params: { tail },
    });
    return response.data;
  },

  // Get container stats
  getContainerStats: async (id: string): Promise<any> => {
    const response = await api.get(`/api/containers/${id}/stats`);
    return response.data;
  },

  // Get aggregate stats for multiple containers
  getAggregateStats: async (containerIds: string[]): Promise<any> => {
    const response = await api.post('/api/containers/stats/aggregate', {
      containerIds,
    });
    return response.data;
  },
};

