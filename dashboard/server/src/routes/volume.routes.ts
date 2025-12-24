import { Hono } from 'hono';
import { VolumeController } from '../controllers/volume.controller';

const router = new Hono();

/**
 * @route GET /api/volumes
 * @summary Get all volumes
 */
router.get('/volumes', VolumeController.getVolumes);

/**
 * @route GET /api/volumes/:name
 * @summary Get volume details
 */
router.get('/volumes/:name', VolumeController.getVolumeDetails);

/**
 * @route DELETE /api/volumes/:name
 * @summary Delete volume
 */
router.delete('/volumes/:name', VolumeController.deleteVolume);

export default router;


