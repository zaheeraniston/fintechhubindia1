'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner, EmptyState } from '@/components/shared/LoadingStates';
import { toast } from 'sonner';
import { ExternalLink, Link2, Copy, Share2 } from 'lucide-react';

interface LinkItem {
  id: string;
  appName: string;
  link: string;
  status: string;
  logoUrl?: string;
}

export function ActiveLinksPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLinks() {
      try {
        const data = await apiFetch('/links');
        setLinks(data.data || []);
      } catch (err) {
        toast.error('Failed to load links');
      } finally {
        setLoading(false);
      }
    }
    fetchLinks();
  }, []);

  const handleCopy = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async (item: LinkItem) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.appName,
          text: `Check out the referral link for ${item.appName}!`,
          url: item.link,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          toast.error('Failed to share link');
        }
      }
    } else {
      handleCopy(item.link);
    }
  };

  if (loading) return <LoadingSpinner text="Loading links..." />;

  if (links.length === 0) {
    return <EmptyState icon={Link2} title="No Active Links" description="Check back later for new referral links" />;
  }

  const colors = [
    'from-violet-500 to-indigo-600',
    'from-fuchsia-500 to-pink-600',
    'from-purple-500 to-fuchsia-600',
    'from-pink-500 to-rose-600',
    'from-indigo-500 to-blue-600',
    'from-violet-600 to-purple-700',
  ];

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto relative z-10">
      <div className="mb-6">
        <h1 className="text-2xl font-black bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent tracking-wide flex items-center gap-2">
          <Link2 className="w-6 h-6 text-violet-400" /> Active Links
        </h1>
        <p className="text-sm text-slate-400 mt-1">Click to visit referral links for partner apps</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {links.map((item, i) => (
          <Card key={item.id} className="glass-premium border border-white/10 shadow-lg hover:shadow-xl hover:border-violet-500/50 transition-all duration-300 overflow-hidden group card-hover-3d rounded-2xl relative">
            <CardContent className="p-0">
              <div className={`bg-gradient-to-r ${colors[i % colors.length]} p-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                      {item.logoUrl ? (
                        <img src={item.logoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Link2 className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{item.appName}</h3>
                      <p className="text-white/70 text-xs">Referral Link Available</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 flex flex-col gap-2">
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="w-full">
                  <Button className="w-full h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold shadow-lg shadow-violet-500/25 transition-all duration-300 rounded-xl cursor-pointer hover:scale-[1.01] active:scale-[0.99]">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visit {item.appName}
                  </Button>
                </a>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleCopy(item.link)}
                    variant="outline"
                    className="flex-1 h-10 border-white/10 hover:border-violet-500/50 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-300 flex items-center justify-center cursor-pointer"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    onClick={() => handleShare(item)}
                    variant="outline"
                    className="flex-1 h-10 border-white/10 hover:border-violet-500/50 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-300 flex items-center justify-center cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
