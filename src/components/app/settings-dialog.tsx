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
import { Settings, Plus, Trash2, Bot } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';

export function SettingsDialog() {
  const { toast } = useToast();
  const [settings, setSettings] = useSettings();
  const [newKey, setNewKey] = useState('');

  const handleAddKey = () => {
    if (newKey.trim() === '') {
      toast({ variant: 'destructive', title: 'Invalid API Key', description: 'API key cannot be empty.' });
      return;
    }
    if (settings.apiKeys.includes(newKey)) {
        toast({ variant: 'destructive', title: 'Duplicate API Key', description: 'This API key has already been added.' });
        return;
    }
    setSettings(prev => ({ ...prev, apiKeys: [...prev.apiKeys, newKey] }));
    setNewKey('');
    toast({ title: 'API Key Added', description: 'The new API key has been saved.' });
  };

  const handleRemoveKey = (keyToRemove: string) => {
    setSettings(prev => ({ ...prev, apiKeys: prev.apiKeys.filter(key => key !== keyToRemove) }));
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
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your API keys and adjust generation settings.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          
          {/* API Key Management */}
          <div className="space-y-4">
            <h4 className="font-medium leading-none">API Key Management</h4>
            <div className='space-y-2'>
                <p className="text-sm text-muted-foreground">
                Add multiple Google AI API keys. The app will automatically rotate them if one reaches its rate limit. Get free keys from{' '}
                <a
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                >
                    Google AI Studio
                </a>.
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
                {settings.apiKeys.length > 0 ? (
                    <div className="max-h-32 overflow-y-auto space-y-2 rounded-md border p-2">
                        {settings.apiKeys.map((key) => (
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
                    <p className="text-sm text-muted-foreground text-center py-4 border rounded-md">No API keys saved.</p>
                )}
            </div>
          </div>

          <Separator />

          {/* Generation Settings */}
          <div className="space-y-4">
            <h4 className="font-medium leading-none">Generation Settings</h4>
             <div className="space-y-3">
                <Label htmlFor="model-select">AI Model</Label>
                 <Select
                    value={settings.model}
                    onValueChange={(value) => setSettings(prev => ({...prev, model: value}))}
                 >
                    <SelectTrigger id="model-select" className="w-full">
                        <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="googleai/gemini-2.5-flash">Gemini 2.5 Flash (Recommended)</SelectItem>
                        <SelectItem value="googleai/gemini-1.5-flash-latest">Gemini 1.5 Flash</SelectItem>
                    </SelectContent>
                </Select>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="title-length">Title Words</Label>
                    <Input
                        id="title-length"
                        type="number"
                        value={settings.titleLength}
                        onChange={(e) => setSettings(prev => ({...prev, titleLength: parseInt(e.target.value, 10) || 0}))}
                        placeholder="e.g., 15"
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="desc-length">Description Words</Label>
                    <Input
                        id="desc-length"
                        type="number"
                        value={settings.descriptionLength}
                        onChange={(e) => setSettings(prev => ({...prev, descriptionLength: parseInt(e.target.value, 10) || 0}))}
                        placeholder="e.g., 100"
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="keyword-count">Keyword Count</Label>
                    <Input
                        id="keyword-count"
                        type="number"
                        value={settings.keywordCount}
                        onChange={(e) => setSettings(prev => ({...prev, keywordCount: parseInt(e.target.value, 10) || 0}))}
                        placeholder="e.g., 25"
                    />
                </div>
             </div>
          </div>


        </div>
      </DialogContent>
    </Dialog>
  );
}
