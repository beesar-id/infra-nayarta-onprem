import { docker } from '../config/docker';
import type { Volume } from '../types';

export class VolumeService {
  async getVolumes(): Promise<Volume[]> {
    try {
      const volumes = await docker.listVolumes();
      
      return volumes.Volumes.map((volume) => ({
        name: volume.Name,
        driver: volume.Driver,
        mountpoint: volume.Mountpoint,
        created: volume.CreatedAt ? new Date(volume.CreatedAt).getTime() : 0,
        scope: volume.Scope || 'local',
        labels: volume.Labels || {},
        options: volume.Options || {},
        status: volume.Status || {},
        usageData: volume.UsageData ? {
          size: volume.UsageData.Size || 0,
          refCount: volume.UsageData.RefCount || 0,
        } : undefined,
      }));
    } catch (error: any) {
      throw new Error(`Failed to list volumes: ${error.message}`);
    }
  }

  async getVolumeDetails(name: string): Promise<Volume> {
    try {
      const volume = docker.getVolume(name);
      const inspect = await volume.inspect();
      
      return {
        name: inspect.Name,
        driver: inspect.Driver,
        mountpoint: inspect.Mountpoint,
        created: inspect.CreatedAt ? new Date(inspect.CreatedAt).getTime() : 0,
        scope: inspect.Scope || 'local',
        labels: inspect.Labels || {},
        options: inspect.Options || {},
      };
    } catch (error: any) {
      throw new Error(`Failed to get volume details: ${error.message}`);
    }
  }

  async deleteVolume(name: string): Promise<{ success: boolean; message: string }> {
    try {
      const volume = docker.getVolume(name);
      await volume.remove();
      return {
        success: true,
        message: `Volume ${name} deleted successfully`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to delete volume',
      };
    }
  }
}

