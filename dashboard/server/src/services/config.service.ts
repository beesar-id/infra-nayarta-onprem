import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { PROJECT_ROOT } from '../config/constants';

export class ConfigService {
  private static getEnvPath() {
    return join(PROJECT_ROOT, '.env');
  }

  private static getMediamtxPath() {
    return join(PROJECT_ROOT, 'stream', 'config', 'mediamtx.yml');
  }

  static async getEnvFile(): Promise<string> {
    const path = this.getEnvPath();
    try {
      const content = await fs.readFile(path, 'utf8');
      return content;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // If file doesn't exist, return empty string
        return '';
      }
      throw new Error(`Failed to read .env file: ${error.message}`);
    }
  }

  static async updateEnvFile(content: string): Promise<void> {
    const path = this.getEnvPath();
    try {
      await fs.writeFile(path, content, 'utf8');
    } catch (error: any) {
      throw new Error(`Failed to write .env file: ${error.message}`);
    }
  }

  static async getMediamtxConfig(): Promise<string> {
    const path = this.getMediamtxPath();
    try {
      const content = await fs.readFile(path, 'utf8');
      return content;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error('mediamtx.yml not found');
      }
      throw new Error(`Failed to read mediamtx.yml: ${error.message}`);
    }
  }

  static async updateMediamtxConfig(content: string): Promise<void> {
    const path = this.getMediamtxPath();
    try {
      await fs.writeFile(path, content, 'utf8');
    } catch (error: any) {
      throw new Error(`Failed to write mediamtx.yml: ${error.message}`);
    }
  }

  /**
   * Update HOST_IP and add IP to SSE_ALLOW_ORIGINS in .env file
   */
  static async updateHostIp(ip: string): Promise<void> {
    const path = this.getEnvPath();
    try {
      // Read current .env content
      let content = await this.getEnvFile();
      
      // Validate IP format (basic validation)
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipRegex.test(ip)) {
        throw new Error('Invalid IP address format');
      }

      const lines = content.split('\n');
      let hostIpFound = false;
      let sseAllowOriginsFound = false;
      let baseUrlFound = false;
      let homepageUrlFound = false;
      const updatedLines: string[] = [];

      for (const element of lines) {
        const line = element;
        const trimmedLine = line.trim();

        // Update HOST_IP
        if (trimmedLine.startsWith('HOST_IP=') || trimmedLine.startsWith('#HOST_IP=')) {
          updatedLines.push(`HOST_IP=${ip}`);
          hostIpFound = true;
          continue;
        }

        // Update SSE_ALLOW_ORIGINS
        if (trimmedLine.startsWith('SSE_ALLOW_ORIGINS=') || trimmedLine.startsWith('#SSE_ALLOW_ORIGINS=')) {
          const match = line.match(/^(#?\s*SSE_ALLOW_ORIGINS=)(.*)$/);
          if (match) {
            const prefix = match[1];
            const existingValue = match[2].trim();
            
            // Parse existing origins (could be comma-separated or space-separated)
            let origins: string[] = [];
            if (existingValue) {
              origins = existingValue.split(/[,\s]+/).filter(o => o.trim());
            }
            
            // Format IP with http:// prefix
            const ipWithProtocol = `http://${ip}`;
            
            // Check if IP (with or without http://) is already present
            const ipExists = origins.some(origin => 
              origin === ip || 
              origin === ipWithProtocol || 
              origin === `http://${ip}` ||
              origin === `https://${ip}` ||
              origin.includes(ip)
            );
            
            // Add new IP with http:// prefix if not already present
            if (!ipExists) {
              origins.push(ipWithProtocol);
            }
            
            updatedLines.push(`${prefix}${origins.join(',')}`);
            sseAllowOriginsFound = true;
            continue;
          }
        }

        // Update BASE_URL - replace localhost with IP
        if (trimmedLine.startsWith('BASE_URL=') || trimmedLine.startsWith('#BASE_URL=')) {
          const match = line.match(/^(#?\s*BASE_URL=)(.*)$/);
          if (match) {
            const prefix = match[1];
            const urlValue = match[2].trim();
            // Replace localhost with IP in URL
            const updatedUrl = urlValue.replaceAll('http://localhost:', `http://${ip}:`);
            updatedLines.push(`${prefix}${updatedUrl}`);
            baseUrlFound = true;
            continue;
          }
        }

        // Update HOMEPAGE_URL - replace localhost with IP
        if (trimmedLine.startsWith('HOMEPAGE_URL=') || trimmedLine.startsWith('#HOMEPAGE_URL=')) {
          const match = line.match(/^(#?\s*HOMEPAGE_URL=)(.*)$/);
          if (match) {
            const prefix = match[1];
            const urlValue = match[2].trim();
            // Replace localhost with IP in URL
            const updatedUrl = urlValue.replaceAll('http://localhost:', `http://${ip}:`);
            updatedLines.push(`${prefix}${updatedUrl}`);
            homepageUrlFound = true;
            continue;
          }
        }

        // Keep other lines as is
        updatedLines.push(line);
      }

      // Add HOST_IP if not found
      if (!hostIpFound) {
        updatedLines.push(`HOST_IP=${ip}`);
      }

      // Add SSE_ALLOW_ORIGINS if not found (with http:// prefix)
      if (!sseAllowOriginsFound) {
        updatedLines.push(`SSE_ALLOW_ORIGINS=http://${ip}`);
      }

      // Add BASE_URL if not found (with default port 8457)
      if (!baseUrlFound) {
        updatedLines.push(`BASE_URL=http://${ip}:8457/api/v1`);
      }

      // Add HOMEPAGE_URL if not found (with default port 80)
      if (!homepageUrlFound) {
        updatedLines.push(`HOMEPAGE_URL=http://${ip}:80`);
      }

      // Write updated content
      const updatedContent = updatedLines.join('\n');
      await fs.writeFile(path, updatedContent, 'utf8');
    } catch (error: any) {
      throw new Error(`Failed to update HOST_IP: ${error.message}`);
    }
  }
}



