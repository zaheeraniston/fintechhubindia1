'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner, EmptyState } from '@/components/shared/LoadingStates';
import { toast } from 'sonner';
import { MessageSquareMore, Play, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QnaItem {
  id: string;
  title: string;
  youtubeUrl: string;
  status: string;
}

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match ? match[1] : null;
}

export function QnasPage() {
  const [qnas, setQnas] = useState<QnaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQnas() {
      try {
        const data = await apiFetch('/qnas');
        setQnas((data.data || []).filter((q: QnaItem) => q.status === 'active'));
      } catch {
        toast.error('Failed to load Q&A videos');
      } finally {
        setLoading(false);
      }
    }
    fetchQnas();
  }, []);

  if (loading) return <LoadingSpinner text="Loading Q&A videos..." />;

  if (qnas.length === 0) {
    return (
      <EmptyState
        icon={MessageSquareMore}
        title="No Q&A Videos Yet"
        description="Q&A videos will be added here soon. Check back later!"
      />
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto relative z-10">
      <div className="mb-6">
        <h1 className="text-2xl font-black bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent tracking-wide flex items-center gap-2">
          <MessageSquareMore className="w-6 h-6 text-amber-400" /> Q&amp;A
        </h1>
        <p className="text-sm text-slate-400 mt-1">Watch Q&amp;A videos to get your questions answered</p>
      </div>

      <div className="space-y-4">
        {qnas.map((qna) => {
          const videoId = getYouTubeId(qna.youtubeUrl);
          return (
            <Card
              key={qna.id}
              className="glass-premium border border-white/10 shadow-lg hover:shadow-xl hover:border-amber-500/30 transition-all duration-300 overflow-hidden card-hover-3d rounded-2xl relative"
            >
              {videoId ? (
                <div className="aspect-video w-full">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={qna.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              ) : null}
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                      <Play className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-100">{qna.title}</h3>
                  </div>
                  <a href={qna.youtubeUrl} target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/10 text-amber-300 hover:text-white hover:bg-amber-600/20 hover:border-amber-500/50 rounded-xl cursor-pointer"
                    >
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
