export interface Container {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  ports: Array<{
    private: number;
    public?: number;
    type: string;
  }>;
  created: number;
}

export interface ContainerDetail extends Container {
  started?: string;
  env?: string[];
}

export type Profile = 'appstack' | 'analytics-tools' | 'app' | 'stream';

export interface ComposeAction {
  profile: Profile;
  action: 'up' | 'down';
}


