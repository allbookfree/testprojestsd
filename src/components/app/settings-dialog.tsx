'use client';

import React, { useState } from 'react';
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
import { Settings, Plus, Trash2, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useSettings, type ApiKey, type CreativityLevel } from '@/hooks/use-settings';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { testApiKey } from '@/app/actions';
import type { ApiKeyTestResult } from '@/app/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Switch } from '../ui/switch';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

type TestStatus = ApiKeyTestResult['status'] | 'idle' | 'testing';

interface ApiKeyItemProps {
  apiKey: ApiKey;
  onRemove: (id: string) => void;
}

function ApiKeyItem({ apiKey, onRemove }: ApiKeyItemProps) {
  const [status, setStatus] = useState<TestStatus>('idle');
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleTest = async () => {
    setStatus('testing');
    setError('');
    const result = await testApiKey(apiKey.key);
    setStatus(result.status);

    if (result.success) {
      toast({ title: 'API Key is valid!', description: 'This key is ready to use.', variant: 'default' });
    } else {
      setError(result.error || 'An unknown error occurred.');
      toast({
        variant: 'destructive',
        title: 'API Key Test Failed',
        description: result.error,
      });
    }
  };
  
  const maskKey = (key: string) => {
    if (key.length <= 8) return '****';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'testing':
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'invalid':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'rate-limited':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        // idle
        return <div className="h-4 w-4" />;
    }
  };
  
  const getStatusTooltip = () => {
      if (status === 'invalid' && error) return error;
      if (status === 'rate-limited' && error) return error;
      if (status === 'valid') return 'This API key is valid and working.';
      return 'Test this API key to check its status.';
  }

  return (
    <Tooltip>
        <TooltipTrigger asChild>
            <div className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-secondary/50">
              <div className='flex items-center gap-2 min-w-0'>
                {getStatusIcon()}
                <div className="flex-1 truncate">
                  <p className="font-mono text-sm truncate" title={apiKey.key}>{maskKey(apiKey.key)}</p>
                  {apiKey.note && <p className="text-xs text-muted-foreground truncate" title={apiKey.note}>{apiKey.note}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button variant="ghost" size="sm" onClick={handleTest} disabled={status === 'testing'}>
                  {status === 'testing' ? 'Testing...' : 'Test'}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onRemove(apiKey.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span className="sr-only">Remove key</span>
                </Button>
              </div>
            </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start">
          <p>{getStatusTooltip()}</p>
        </TooltipContent>
    </Tooltip>
  );
}

export function SettingsDialog({ children }: { children?: React.ReactNode }) {
  const { toast } = useToast();
  const [settings, setSettings] = useSettings();
  const [newKey, setNewKey] = useState('');
  const [newKeyNote, setNewKeyNote] = useState('');
  const [open, setOpen] = useState(false);

  const handleAddKey = () => {
    if (newKey.trim() === '') {
      toast({ variant: 'destructive', title: 'Invalid API Key', description: 'API key cannot be empty.' });
      return;
    }
    if (settings.apiKeys.some(k => k.key === newKey)) {
        toast({ variant: 'destructive', title: 'Duplicate API Key', description: 'This API key has already been added.' });
        return;
    }
    const newApiKey: ApiKey = {
        id: Date.now().toString(),
        key: newKey.trim(),
        note: newKeyNote.trim(),
    };
    setSettings(prev => ({ ...prev, apiKeys: [...prev.apiKeys, newApiKey] }));
    setNewKey('');
    setNewKeyNote('');
    toast({ title: 'API Key Added', description: 'The new API key has been saved.' });
  };

  const handleRemoveKey = (idToRemove: string) => {
    setSettings(prev => ({ ...prev, apiKeys: prev.apiKeys.filter(key => key.id !== idToRemove) }));
    toast({ title: 'API Key Removed' });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? children : (
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
            <span className="sr-only">Settings</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your API keys and adjust generation settings. Changes are saved automatically.
          </DialogDescription>
        </DialogHeader>
        <TooltipProvider>
            <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
            
            <div className="space-y-4">
                <h4 className="font-medium leading-none">API Key Management</h4>
                <div className='space-y-2'>
                    <p className="text-sm text-muted-foreground">
                    Add multiple Google AI API keys. The app will use them sequentially if one runs out of quota. Get free keys from{' '}
                    <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                        Google AI Studio
                    </a>.
                    </p>
                </div>
                <div className="space-y-3 rounded-lg border p-4">
                    <Label>Add New API Key</Label>
                    <div className="flex items-center space-x-2">
                        <Input
                            id="new-api-key"
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value)}
                            placeholder="Enter Google AI API key"
                            className="font-mono"
                        />
                         <Button type="button" size="icon" onClick={handleAddKey} disabled={!newKey.trim()}>
                            <Plus className="h-4 w-4" />
                            <span className="sr-only">Add Key</span>
                        </Button>
                    </div>
                    <Input
                        id="new-api-key-note"
                        value={newKeyNote}
                        onChange={(e) => setNewKeyNote(e.target.value)}
                        placeholder="Note (e.g., 'Personal Account')"
                    />
                </div>
                <div className="space-y-2">
                    <h4 className="text-sm font-medium">Saved Keys</h4>
                    {settings.apiKeys.length > 0 ? (
                        <div className="max-h-40 overflow-y-auto space-y-1 rounded-md border p-1">
                            {settings.apiKeys.map((key) => (
                                <ApiKeyItem key={key.id} apiKey={key} onRemove={handleRemoveKey} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4 border rounded-md border-dashed">No API keys saved.</p>
                    )}
                </div>
            </div>

            <Separator />

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

                <div className="space-y-3">
                    <Label htmlFor="creativity-level">Creativity Level</Label>
                    <Select
                        value={settings.creativityLevel}
                        onValueChange={(value) => setSettings(prev => ({...prev, creativityLevel: value as CreativityLevel}))}
                    >
                        <SelectTrigger id="creativity-level" className="w-full">
                            <SelectValue placeholder="Select a creativity level" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Conservative">Conservative</SelectItem>
                            <SelectItem value="Balanced">Balanced</SelectItem>
                            <SelectItem value="Creative">Creative</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                        Controls the randomness of the output. 'Creative' is more unpredictable, while 'Conservative' is more deterministic.
                    </p>
                </div>

                <div className="space-y-3 rounded-lg border bg-background/50 p-4">
                    <div className="flex items-center justify-between">
                        <div className='flex items-center gap-2'>
                          <Label htmlFor="auto-metadata" className="font-semibold">
                              Automatic Mode
                          </Label>
                          <Badge variant="outline" className="text-primary border-primary">Recommended</Badge>
                        </div>
                        <Switch
                            id="auto-metadata"
                            checked={settings.useAutoMetadata}
                            onCheckedChange={(checked) => setSettings(prev => ({...prev, useAutoMetadata: checked}))}
                        />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        When enabled, the AI will decide the best title length, description length, and keyword count for each image based on its content.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="title-length" className={cn(settings.useAutoMetadata && "text-muted-foreground/70")}>Title Words</Label>
                        <Input
                            id="title-length"
                            type="number"
                            value={settings.titleLength}
                            onChange={(e) => setSettings(prev => ({...prev, titleLength: parseInt(e.target.value, 10) || 0}))}
                            placeholder="e.g., 15"
                            disabled={settings.useAutoMetadata}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="desc-length" className={cn(settings.useAutoMetadata && "text-muted-foreground/70")}>Description Words</Label>
                        <Input
                            id="desc-length"
                            type="number"
                            value={settings.descriptionLength}
                            onChange={(e) => setSettings(prev => ({...prev, descriptionLength: parseInt(e.target.value, 10) || 0}))}
                            placeholder="e.g., 100"
                            disabled={settings.useAutoMetadata}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="keyword-count" className={cn(settings.useAutoMetadata && "text-muted-foreground/70")}>Keyword Count</Label>
                        <Input
                            id="keyword-count"
                            type="number"
                            value={settings.keywordCount}
                            onChange={(e) => setSettings(prev => ({...prev, keywordCount: parseInt(e.target.value, 10) || 0}))}
                            placeholder="e.g., 40"
                            disabled={settings.useAutoMetadata}
                        />
                    </div>
                </div>
            </div>
            </div>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}
