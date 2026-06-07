'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner, EmptyState } from '@/components/shared/LoadingStates';
import { toast } from 'sonner';
import { GraduationCap, Play, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TrainingItem {
  id: string;
  title: string;
  youtubeUrl: string;
  status: string;
}

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match ? match[1] : null;
}

export function TrainingsPage() {
  const [trainings, setTrainings] = useState<TrainingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrainings() {
      try {
        const data = await apiFetch('/trainings');
        setTrainings(data.data || []);
      } catch {
        toast.error('Failed to load trainings');
      } finally {
        setLoading(false);
      }
    }
    fetchTrainings();
  }, []);

  if (loading) return <LoadingSpinner text="Loading trainings..." />;

  if (trainings.length === 0) {
    return <EmptyState icon={GraduationCap} title="No Trainings Available" description="New training videos will be added soon" />;
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto relative z-10">
      <div className="mb-6">
        <h1 className="text-2xl font-black bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent tracking-wide flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-violet-400" /> Trainings
        </h1>
        <p className="text-sm text-slate-400 mt-1">Watch training videos to learn and grow</p>
      </div>

      <div className="space-y-4">
        {trainings.map((training) => {
          const videoId = getYouTubeId(training.youtubeUrl);
          return (
            <Card key={training.id} className="glass-premium border border-white/10 shadow-lg hover:shadow-xl hover:border-violet-500/30 transition-all duration-300 overflow-hidden card-hover-3d rounded-2xl relative">
              {videoId ? (
                <div className="aspect-video w-full">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={training.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              ) : null}
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20">
                      <Play className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-100">{training.title}</h3>
                  </div>
                  <a href={training.youtubeUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="border-white/10 text-violet-300 hover:text-white hover:bg-violet-600/20 hover:border-violet-500/50 rounded-xl cursor-pointer">
                      <ExternalLink className="w-3.5 h-3.5 mr-1" /> Watch
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
