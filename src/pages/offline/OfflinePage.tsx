import { useState, useEffect } from 'react';
import { WifiOff, Wifi, CloudUpload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FuturisticButton } from '@/components/ui/futuristic-button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { cacheGet, cacheSet, queueAll, queueClear, queuePush } from '@/lib/idb';

export default function OfflinePage() {
  const online = useOnlineStatus();
  const { toast } = useToast();
  const [note, setNote] = useState('');
  const [cachedNote, setCachedNote] = useState<string>('');
  const [queue, setQueue] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const cached = await cacheGet<string>('offline-note');
      setCachedNote(cached ?? '');
      const q = await queueAll();
      setQueue(q);
    })();
  }, []);

  useEffect(() => {
    if (!online) return;
    (async () => {
      const pending = await queueAll();
      if (pending.length === 0) return;
      try {
        // Placeholder sync: Normally push pending items to backend
        await new Promise((r) => setTimeout(r, 300));
        await queueClear();
        setQueue([]);
        toast({ title: 'Synced', description: 'Offline changes were synchronized.' });
      } catch {
        toast({ title: 'Sync failed', description: 'Will retry when connection is stable.', variant: 'destructive' });
      }
    })();
  }, [online, toast]);

  return (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Offline App Shell</CardTitle>
            <Badge variant={online ? 'default' : 'destructive'} className="flex items-center gap-1">
              {online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {online ? 'Online' : 'Offline'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Core UI loads instantly and remains available without a network connection.
          </p>

          <div className="space-y-2">
            <label className="text-sm">Write a note (cached offline)</label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Type and cache" />
            <div className="flex gap-2">
              <FuturisticButton
                variant="default"
                onClick={async () => {
                  await cacheSet('offline-note', note);
                  setCachedNote(note);
                  toast({ title: 'Saved locally', description: 'Note cached in IndexedDB.' });
                }}
              >
                Cache Note
              </FuturisticButton>
              <FuturisticButton
                variant="outline"
                onClick={async () => {
                  await queuePush({ type: 'note', payload: note });
                  const q = await queueAll();
                  setQueue(q);
                  toast({ title: 'Queued', description: 'Change will sync when online.' });
                }}
              >
                <CloudUpload className="w-3 h-3 mr-1" /> Queue Sync
              </FuturisticButton>
            </div>
            <div className="text-xs text-muted-foreground">Cached: {cachedNote || '—'}</div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Pending Sync Queue</p>
            <div className="rounded-md border p-2 text-xs max-h-32 overflow-auto">
              {queue.length === 0 ? 'No pending changes' : JSON.stringify(queue, null, 2)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
