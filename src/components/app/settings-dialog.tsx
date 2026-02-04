'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Settings, Plus, Trash2 } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useState } from 'react';

const API_KEYS_STORAGE_KEY = 'gemini_api_keys';

export function SettingsDialog() {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useLocalStorage<string[]>(API_KEYS_STORAGE_KEY, []);
  const [newKey, setNewKey] = useState('');

  const handleAddKey = () => {
    if (newKey.trim() === '') {
      toast({ variant: 'destructive', title: 'Invalid API Key', description: 'API key cannot be empty.' });
      return;
    }
    if (apiKeys.includes(newKey)) {
        toast({ variant: 'destructive', title: 'Duplicate API Key', description: 'This API key has already been added.' });
        return;
    }
    setApiKeys([...apiKeys, newKey]);
    setNewKey('');
    toast({ title: 'API Key Added', description: 'The new API key has been saved.' });
  };

  const handleRemoveKey = (keyToRemove: string) => {
    setApiKeys(apiKeys.filter(key => key !== keyToRemove));
    toast({ title: 'API Key Removed' });
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return '****';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Manage API Keys</DialogTitle>
          <DialogDescription>
            Add multiple Google AI API keys. The app will automatically rotate them if one reaches its rate limit.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Your API Keys</h4>
            <p className="text-sm text-muted-foreground">
              You can get free keys from{' '}
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Google AI Studio
              </a>
              . Your keys are stored in your browser&apos;s local storage.
            </p>
          </div>
          <div className="space-y-3">
             <Label htmlFor="new-api-key">New API Key</Label>
             <div className="flex items-center space-x-2">
                <Input
                    id="new-api-key"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="Enter new Google AI API key"
                    className="font-code"
                />
                <Button type="button" size="icon" onClick={handleAddKey}>
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Add Key</span>
                </Button>
             </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Saved Keys</h4>
            {apiKeys.length > 0 ? (
                 <div className="space-y-2 rounded-md border p-2">
                    {apiKeys.map((key) => (
                        <div key={key} className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-secondary">
                            <span className="font-code text-sm truncate">{maskKey(key)}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveKey(key)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                                <span className="sr-only">Remove key</span>
                            </Button>
                        </div>
                    ))}
                 </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No API keys saved.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
