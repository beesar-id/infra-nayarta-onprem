import { Context } from 'hono';
import { VolumeService } from '../services/volume.service';

const volumeService = new VolumeService();

export class VolumeController {
  /**
   * @summary Get all volumes
   * @description Get list of all Docker volumes
   * @tags Volumes
   * @returns {object} 200 - List of volumes
   * @returns {object} 500 - Server error
   */
  static async getVolumes(c: Context) {
    try {
      const volumes = await volumeService.getVolumes();
      return c.json({ volumes, count: volumes.length });
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  }

  /**
   * @summary Get volume details
   * @description Get detailed information about a specific volume
   * @tags Volumes
   * @param {string} path.name - Volume name
   * @returns {object} 200 - Volume details
   * @returns {object} 404 - Volume not found
   * @returns {object} 500 - Server error
   */
  static async getVolumeDetails(c: Context) {
    try {
      const name = c.req.param('name');
      const volume = await volumeService.getVolumeDetails(name);
      return c.json(volume);
    } catch (error: any) {
      if (error.message.includes('not found') || error.message.includes('404')) {
        return c.json({ error: 'Volume not found' }, 404);
      }
      return c.json({ error: error.message }, 500);
    }
  }

  /**
   * @summary Delete volume
   * @description Delete a Docker volume
   * @tags Volumes
   * @param {string} path.name - Volume name
   * @returns {object} 200 - Volume deleted successfully
   * @returns {object} 400 - Failed to delete volume
   * @returns {object} 500 - Server error
   */
  static async deleteVolume(c: Context) {
    try {
      const name = c.req.param('name');
      const result = await volumeService.deleteVolume(name);
      
      if (result.success) {
        return c.json({ success: true, message: result.message });
      } else {
        return c.json({ success: false, error: result.message }, 400);
      }
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  }
}


