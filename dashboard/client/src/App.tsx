import React, { useState, useEffect } from 'react';
import { ProfileSelector, PROFILE_DESCRIPTIONS } from './components/ProfileSelector';
import { ProfileControls } from './components/ProfileControls';
import { ContainerList } from './components/ContainerList';
import { ImageList } from './components/ImageList';
import { SystemInformation } from './components/SystemInformation';
import { apiService } from './services/api';
import type { Container, Image, Profile } from './types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { RefreshCw, Loader2, Activity, Square, Container as ContainerIcon, AlertCircle, Package2, Disc3, HardDrive } from 'lucide-react';

function App() {
  const [profiles, setProfiles] = useState<string[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | 'all'>('all');
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [activeTab, setActiveTab] = useState<'containers' | 'images' | 'volumes'>('containers');
  const [aggregateStats, setAggregateStats] = useState<any>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);

  const loadProfiles = async () => {
    try {
      const profileList = await apiService.getProfiles();
      setProfiles(profileList);
    } catch (err: any) {
      toast.error('Gagal memuat profiles');
      console.error(err);
    }
  };

  const loadContainers = async (showLoading: boolean = false) => {
    try {
      const scrollPosition = window.scrollY || document.documentElement.scrollTop;
      
      if (showLoading || isInitialLoad) {
        setLoading(true);
      }
      
      const profile = selectedProfile === 'all' ? undefined : selectedProfile;
      const containerList = await apiService.getContainers(profile);
      setContainers(containerList);
      
      // Load aggregate stats for running containers
      const runningContainers = containerList.filter(c => c.state === 'running');
      if (runningContainers.length > 0) {
        try {
          const stats = await apiService.getAggregateStats(runningContainers.map(c => c.id));
          setAggregateStats(stats);
        } catch (err) {
          console.error('Failed to load aggregate stats:', err);
        }
      } else {
        setAggregateStats(null);
      }
      
      if (!isInitialLoad) {
        requestAnimationFrame(() => {
          window.scrollTo({
            top: scrollPosition,
            behavior: 'auto'
          });
        });
      }
    } catch (err: any) {
      toast.error('Gagal memuat containers');
      console.error(err);
    } finally {
      if (showLoading || isInitialLoad) {
        setLoading(false);
        setIsInitialLoad(false);
      }
    }
  };

  const loadImages = async () => {
    try {
      setImagesLoading(true);
      const imageList = await apiService.getImages();
      setImages(imageList);
    } catch (err: any) {
      toast.error('Gagal memuat images');
      console.error(err);
    } finally {
      setImagesLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    loadContainers(true);
    
    const interval = setInterval(() => loadContainers(false), 5000);
    return () => clearInterval(interval);
  }, [selectedProfile]);

  useEffect(() => {
    if (activeTab === 'images') {
      loadImages();
    }
  }, [activeTab]);

  const handleProfileChange = (profile: Profile | 'all') => {
    setSelectedProfile(profile);
  };

  const handleActionComplete = () => {
    loadContainers();
  };

  // Calculate statistics
  const runningContainers = containers.filter(c => c.state === 'running').length;
  const stoppedContainers = containers.filter(c => c.state === 'exited').length;
  const totalContainers = containers.length;
  const otherContainers = containers.filter(c => c.state !== 'running' && c.state !== 'exited').length;

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <div className="container mx-auto px-4 py-14 max-w-6xl">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <Card className="border border-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
              <CardTitle className="text-xs font-medium">Running</CardTitle>
              <Activity className="h-3 w-3 text-primary" />
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-xl font-bold">{runningContainers}</div>
            </CardContent>
          </Card>

          <Card className="border border-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
              <CardTitle className="text-xs font-medium">Stopped</CardTitle>
              <Square className="h-3 w-3 text-primary" />
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-xl font-bold">{stoppedContainers}</div>
            </CardContent>
          </Card>

          <Card className="border border-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
              <CardTitle className="text-xs font-medium">Total</CardTitle>
              <ContainerIcon className="h-3 w-3 text-primary" />
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-xl font-bold">{totalContainers}</div>
            </CardContent>
          </Card>

          <Card className="border border-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
              <CardTitle className="text-xs font-medium">Other</CardTitle>
              <AlertCircle className="h-3 w-3 text-primary" />
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-xl font-bold">{otherContainers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs dengan Profile Selector di kanan */}
        <div className="mb-3">
          <div className="flex items-center justify-between gap-2 mb-1">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'containers' | 'images' | 'volumes')} className="flex-1">
              <TabsList>
                <TabsTrigger value="containers" className="flex items-center gap-2">
                  <Package2 className="h-4 w-4" />
                  Containers
                </TabsTrigger>
                <TabsTrigger value="images" className="flex items-center gap-2">
                  <Disc3 className="h-4 w-4" />
                  Images
                </TabsTrigger>
                <TabsTrigger value="volumes" className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Volumes
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              {selectedProfile !== 'all' && (
                <ProfileControls
                  profile={selectedProfile as Profile}
                  onActionComplete={handleActionComplete}
                />
              )}
              <Button 
                onClick={() => loadContainers(true)} 
                variant="outline"
                size="sm"
                disabled={loading}
                className="border border-primary"
              >
                {loading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="mr-1 h-3 w-3" />
                    Refresh
                  </>
                )}
              </Button>
              <ProfileSelector
                selectedProfile={selectedProfile}
                onProfileChange={handleProfileChange}
                profiles={profiles}
              />
            </div>
          </div>
          {selectedProfile && (
            <p className="text-xs text-muted-foreground ml-auto text-right max-w-md">
              {PROFILE_DESCRIPTIONS[selectedProfile]}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Content - Table */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'containers' | 'images' | 'volumes')}>
              <TabsContent value="containers" className="mt-0">
                {loading && isInitialLoad ? (
                  <Card className="border border-primary">
                    <CardContent className="py-8 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">Memuat containers...</p>
                    </CardContent>
                  </Card>
                ) : (
                  <ContainerList
                    containers={containers}
                    onRefresh={() => loadContainers(false)}
                  />
                )}
              </TabsContent>

              <TabsContent value="images" className="mt-0">
                {imagesLoading ? (
                  <Card className="border border-primary">
                    <CardContent className="py-8 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">Memuat images...</p>
                    </CardContent>
                  </Card>
                ) : (
                  <ImageList
                    images={images}
                    onRefresh={loadImages}
                  />
                )}
              </TabsContent>

              <TabsContent value="volumes" className="mt-0">
                <Card className="border border-primary">
                  <CardContent className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">Fitur Volumes akan segera hadir</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* System Information Sidebar */}
          <div className="lg:col-span-1">
            <SystemInformation aggregateStats={aggregateStats} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
