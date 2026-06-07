'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner, EmptyState } from '@/components/shared/LoadingStates';
import { toast } from 'sonner';
import { Calendar, Video, ExternalLink, Clock } from 'lucide-react';

interface SeasonItem {
  id: string;
  title: string;
  description: string;
  meetingType: string;
  meetingLink: string;
  startDate: string;
  status: string;
}

export function SeasonsPage() {
  const [seasons, setSeasons] = useState<SeasonItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await apiFetch('/seasons');
        setSeasons(data.data || []);
      } catch {
        toast.error('Failed to load seasons');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner text="Loading seasons..." />;

  if (seasons.length === 0) {
    return <EmptyState icon={Calendar} title="No Seasons" description="Upcoming seasons will be announced here" />;
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto relative z-10">
      <div className="mb-6">
        <h1 className="text-2xl font-black bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent tracking-wide flex items-center gap-2">
          <Calendar className="w-6 h-6 text-violet-400" /> Seasons
        </h1>
        <p className="text-sm text-slate-400 mt-1">Upcoming events and meetings</p>
      </div>

      <div className="space-y-4">
        {seasons.map((season) => (
          <Card key={season.id} className="glass-premium border border-white/10 shadow-lg hover:shadow-xl hover:border-violet-500/30 transition-all duration-300 overflow-hidden card-hover-3d rounded-2xl relative">
            <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-bold text-lg">{season.title}</h3>
                  {season.description && <p className="text-white/70 text-sm mt-1">{season.description}</p>}
                </div>
                <Badge className="bg-white/20 text-white border-0">
                  {season.status === 'upcoming' ? 'Upcoming' : season.status === 'active' ? 'Live Now' : 'Completed'}
                </Badge>
              </div>
            </div>
            <CardContent className="p-5">
              <div className="flex flex-wrap gap-4 mb-4 text-slate-300">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-violet-400" />
                  <span>{new Date(season.startDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Video className="w-4 h-4 text-violet-400" />
                  <span className="capitalize">{season.meetingType.replace('_', ' ')}</span>
                </div>
              </div>
              {season.status === 'active' && season.meetingLink && (
                <a href={season.meetingLink} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold shadow-lg shadow-violet-500/25 transition-all duration-300 rounded-xl cursor-pointer hover:scale-[1.01] active:scale-[0.99]">
                    <ExternalLink className="w-4 h-4 mr-2" /> Join Meeting
                  </Button>
                </a>
              )}
              {season.status === 'upcoming' && (
                <Button variant="outline" className="w-full border-white/10 text-slate-400 hover:bg-white/5 cursor-not-allowed rounded-xl" disabled>
                  Coming Soon
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
