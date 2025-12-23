import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import Docker from 'dockerode';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

const app = new Hono();

// Enable CORS
app.use('/*', cors());

// Initialize Docker client
const docker = new Docker();

// Project root path (adjust if needed)
const PROJECT_ROOT = process.env.PROJECT_ROOT || '/Users/betuahanugerah/Development/project/project-beesar/nayarta-onprem-compose';

// Available profiles
const PROFILES = ['appstack', 'analytics-tools', 'app', 'stream'];

// Helper function to execute docker compose commands
async function executeDockerCompose(
  profile: string,
  action: 'up' | 'down',
  detach: boolean = true
): Promise<{ success: boolean; output: string; error?: string }> {
  try {
    // Flag -d hanya untuk 'up', tidak untuk 'down'
    const detachFlag = (action === 'up' && detach) ? '-d' : '';
    const command = `docker compose --profile ${profile} ${action} ${detachFlag}`.trim();
    
    console.log(`Executing: ${command} in ${PROJECT_ROOT}`);
    
    const { stdout, stderr } = await execAsync(command, {
      cwd: PROJECT_ROOT,
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });

    return {
      success: true,
      output: stdout || stderr || 'Command executed successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      output: '',
      error: error.message || 'Unknown error occurred',
    };
  }
}

// Get containers by profile
async function getContainersByProfile(profile?: string) {
  try {
    const containers = await docker.listContainers({ all: true });
    
    // Filter containers related to the project
    const projectContainers = containers.filter((container) => {
      const names = container.Names || [];
      const image = container.Image || '';
      
      // Check container name or image contains project-related keywords
      const isProjectContainer = 
        names.some((name: string | string[]) => name.toString().includes('nayarta')) ||
        image.includes('nayarta');
      
      if (!profile) {
        return isProjectContainer;
      }

      // For profile filtering
      const profileKeywords: Record<string, string[]> = {
        appstack: ['nayarta', 'api', 'admin', 'fe', 'frontend', 'stream', 'camera', 'nvr', 'mqtt', 'emqx', 'mediamtx', 'postgres', 'database', 'minio'],
        'analytics-tools': ['rabbitmq', 'clickhouse', 'ch-server', 'analytics', 'ch-web', 'ch-client'],
        app: ['api', 'admin', 'fe', 'frontend', 'sse'],
        stream: ['stream', 'camera', 'nvr'],
      };

      const keywords = profileKeywords[profile] || [];
      return isProjectContainer && keywords.some(keyword => 
        names.some(name => name.toLowerCase().includes(keyword)) ||
        image.toLowerCase().includes(keyword)
      );
    });

    return projectContainers.map((container) => ({
      id: container.Id,
      name: container.Names?.[0]?.replace('/', '') || 'unknown',
      image: container.Image,
      status: container.Status,
      state: container.State,
      ports: container.Ports?.map(p => ({
        private: p.PrivatePort,
        public: p.PublicPort,
        type: p.Type,
      })) || [],
      created: container.Created,
    }));
  } catch (error: any) {
    throw new Error(`Failed to list containers: ${error.message}`);
  }
}

// API Routes

// Health check
app.get('/', (c: any) => {
  return c.json({ 
    message: 'Nayarta Docker Dashboard API',
    version: '1.0.0',
    profiles: PROFILES,
  });
});

// Get all available profiles
app.get('/api/profiles', (c: any) => {
  return c.json({ profiles: PROFILES });
});

// Get containers
app.get('/api/containers', async (c: any) => {
  try {
    const profile = c.req.query('profile');
    
    if (profile && !PROFILES.includes(profile)) {
      return c.json({ error: 'Invalid profile' }, 400);
    }

    const containers = await getContainersByProfile(profile);
    return c.json({ containers, count: containers.length });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get container details
app.get('/api/containers/:id', async (c: any) => {
  try {
    const containerId = c.req.param('id');
    const container = docker.getContainer(containerId);
    const inspect = await container.inspect();
    
    return c.json({
      id: inspect.Id,
      name: inspect.Name.replace('/', ''),
      image: inspect.Config.Image,
      status: inspect.State.Status,
      created: inspect.Created,
      started: inspect.State.StartedAt,
      ports: inspect.NetworkSettings?.Ports || {},
      env: inspect.Config.Env || [],
      State: inspect.State,
      Mounts: inspect.Mounts || [],
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get container stats
app.get('/api/containers/:id/stats', async (c: any) => {
  try {
    const containerId = c.req.param('id');
    const container = docker.getContainer(containerId);
    const stats = await container.stats({ stream: false });
    
    // Calculate CPU usage
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    const numCpus = stats.cpu_stats.online_cpus || 1;
    const cpuPercent = systemDelta > 0 ? (cpuDelta / systemDelta) * numCpus * 100 : 0;
    
    // Memory
    const memoryUsage = stats.memory_stats.usage || 0;
    const memoryLimit = stats.memory_stats.limit || 0;
    
    // Disk I/O
    const blkioStats = stats.blkio_stats?.io_service_bytes_recursive || [];
    const diskRead = blkioStats.find((s: any) => s.op === 'Read')?.value || 0;
    const diskWrite = blkioStats.find((s: any) => s.op === 'Write')?.value || 0;
    
    // Network I/O
    const networks = stats.networks || {};
    let networkRx = 0;
    let networkTx = 0;
    Object.values(networks).forEach((net: any) => {
      networkRx += net.rx_bytes || 0;
      networkTx += net.tx_bytes || 0;
    });
    
    return c.json({
      cpu: cpuPercent / 100, // Convert to decimal
      memory: {
        usage: memoryUsage,
        limit: memoryLimit,
      },
      disk: {
        read: diskRead,
        write: diskWrite,
      },
      network: {
        rx: networkRx,
        tx: networkTx,
      },
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get aggregate stats for multiple containers
app.post('/api/containers/stats/aggregate', async (c: any) => {
  try {
    const { containerIds } = await c.req.json();
    
    if (!Array.isArray(containerIds) || containerIds.length === 0) {
      return c.json({ error: 'containerIds must be a non-empty array' }, 400);
    }

    let totalCpu = 0;
    let totalMemoryUsage = 0;
    let totalMemoryLimit = 0;
    let totalDiskRead = 0;
    let totalDiskWrite = 0;
    let totalNetworkRx = 0;
    let totalNetworkTx = 0;
    let successCount = 0;

    // Get stats for all containers in parallel
    const statsPromises = containerIds.map(async (id: string) => {
      try {
        const container = docker.getContainer(id);
        const stats = await container.stats({ stream: false });
        
        // Calculate CPU usage
        const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
        const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
        const numCpus = stats.cpu_stats.online_cpus || 1;
        const cpuPercent = systemDelta > 0 ? (cpuDelta / systemDelta) * numCpus * 100 : 0;
        
        // Memory
        const memoryUsage = stats.memory_stats.usage || 0;
        const memoryLimit = stats.memory_stats.limit || 0;
        
        // Disk I/O
        const blkioStats = stats.blkio_stats?.io_service_bytes_recursive || [];
        const diskRead = blkioStats.find((s: any) => s.op === 'Read')?.value || 0;
        const diskWrite = blkioStats.find((s: any) => s.op === 'Write')?.value || 0;
        
        // Network I/O
        const networks = stats.networks || {};
        let networkRx = 0;
        let networkTx = 0;
        Object.values(networks).forEach((net: any) => {
          networkRx += net.rx_bytes || 0;
          networkTx += net.tx_bytes || 0;
        });
        
        return {
          cpu: cpuPercent / 100,
          memory: { usage: memoryUsage, limit: memoryLimit },
          disk: { read: diskRead, write: diskWrite },
          network: { rx: networkRx, tx: networkTx },
        };
      } catch (error) {
        console.error(`Error getting stats for container ${id}:`, error);
        return null;
      }
    });

    const results = await Promise.all(statsPromises);
    
    results.forEach((result) => {
      if (result) {
        totalCpu += result.cpu;
        totalMemoryUsage += result.memory.usage;
        totalMemoryLimit += result.memory.limit;
        totalDiskRead += result.disk.read;
        totalDiskWrite += result.disk.write;
        totalNetworkRx += result.network.rx;
        totalNetworkTx += result.network.tx;
        successCount++;
      }
    });

    return c.json({
      cpu: totalCpu, // Total CPU usage
      memory: {
        usage: totalMemoryUsage,
        limit: totalMemoryLimit,
      },
      disk: {
        read: totalDiskRead,
        write: totalDiskWrite,
      },
      network: {
        rx: totalNetworkRx,
        tx: totalNetworkTx,
      },
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Execute docker compose command
app.post('/api/compose/:profile/:action', async (c: any) => {
  try {
    const profile = c.req.param('profile');
    const action = c.req.param('action') as 'up' | 'down';

    if (!PROFILES.includes(profile)) {
      return c.json({ error: 'Invalid profile' }, 400);
    }

    if (action !== 'up' && action !== 'down') {
      return c.json({ error: 'Invalid action. Use "up" or "down"' }, 400);
    }

    const result = await executeDockerCompose(profile, action);
    
    if (result.success) {
      return c.json({ 
        success: true, 
        message: `Profile ${profile} ${action} executed successfully`,
        output: result.output,
      });
    } else {
      return c.json({ 
        success: false, 
        error: result.error,
        output: result.output,
      }, 500);
    }
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get container logs
app.get('/api/containers/:id/logs', async (c: any) => {
  try {
    const containerId = c.req.param('id');
    const tail = Number.parseInt(c.req.query('tail') || '100', 10);
    const container = docker.getContainer(containerId);
    
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      tail: tail,
      timestamps: true,
    });

    return c.text(logs.toString());
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Container control actions
app.post('/api/containers/:id/:action', async (c: any) => {
  try {
    const containerId = c.req.param('id');
    const action = c.req.param('action') as 'start' | 'stop' | 'restart' | 'remove';
    const container = docker.getContainer(containerId);

    switch (action) {
      case 'start':
        await container.start();
        break;
      case 'stop':
        await container.stop();
        break;
      case 'restart':
        await container.restart();
        break;
      case 'remove':
        await container.remove({ force: true });
        break;
      default:
        return c.json({ error: 'Invalid action' }, 400);
    }

    return c.json({ 
      success: true, 
      message: `Container ${action} executed successfully` 
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

const port = Number.parseInt(process.env.PORT || '3001', 10);
console.log(`🚀 Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

