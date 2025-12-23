import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Cpu, Activity, HardDrive, Network } from 'lucide-react';

interface SystemInformationProps {
  aggregateStats: any;
}

export const SystemInformation: React.FC<SystemInformationProps> = ({ aggregateStats }) => {
  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card className="border border-primary">
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="text-sm font-semibold">System Information</div>
        <Separator className="" />
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <div className="space-y-1">
          {/* CPU */}
          <div className="flex items-center justify-between gap-3 bg-accent p-2 px-3 rounded-lg">
            <div className="flex items-center gap-2">
               <Cpu className="h-4 w-4 text-primary shrink-0" />
               <p className="text-xs text-muted-foreground">CPU Usage</p>
            </div>
            <p className="text-sm font-bold">{aggregateStats?.cpu ? (aggregateStats.cpu * 100).toFixed(1) : '0'}%</p>
          </div>

          {/* Memory */}
          <div className="flex items-center justify-between gap-3 bg-accent p-2 px-3 rounded-lg">
            <div className="flex items-center gap-2">
               <Activity className="h-4 w-4 text-primary shrink-0" />
               <p className="text-xs text-muted-foreground">Memory</p>
            </div>
            <p className="text-sm font-bold">{aggregateStats?.memory?.usage ? formatBytes(aggregateStats.memory.usage) : '0 B'}</p>
          </div>

          {/* Disk */}
          <div className="flex items-center justify-between gap-3 bg-accent p-2 px-3 rounded-lg">
            <div className="flex items-center gap-2">
               <HardDrive className="h-4 w-4 text-primary shrink-0" />
               <p className="text-xs text-muted-foreground">Disk</p>
            </div>
            <p className="text-sm font-bold">{aggregateStats?.disk ? formatBytes(aggregateStats.disk.read + aggregateStats.disk.write) : '0 B'}</p>
          </div>

          {/* Network */}
          <div className="flex items-center justify-between gap-3 bg-accent p-2 px-3 rounded-lg">
            <div className="flex items-center gap-2">
               <Network className="h-4 w-4 text-primary shrink-0" />
               <p className="text-xs text-muted-foreground">Network</p>
            </div>
            <p className="text-sm font-bold">{aggregateStats?.network ? formatBytes(aggregateStats.network.rx + aggregateStats.network.tx) : '0 B'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

