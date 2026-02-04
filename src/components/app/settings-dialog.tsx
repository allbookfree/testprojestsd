'use client';

import { useState } from 'react';
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
import { Copy, Settings, Check } from 'lucide-react';

export function SettingsDialog() {
  const { toast } = useToast();
  const [hasCopied, setHasCopied] = useState(false);
  const apiKeyVarName = 'GEMINI_API_KEY';

  const onCopy = () => {
    navigator.clipboard.writeText(`${apiKeyVarName}="YOUR_API_KEY_HERE"`);
    setHasCopied(true);
    toast({
      title: 'Copied!',
      description: `Environment variable setup copied to clipboard.`,
    });
    setTimeout(() => setHasCopied(false), 2000);
  };

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
            Configure your environment to use your own API key.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Google AI API Key</h4>
            <p className="text-sm text-muted-foreground">
              To generate metadata, the app needs a Google AI API key. You can get one for free
              from{' '}
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Google AI Studio
              </a>
              .
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="api-key-env">Environment Variable</Label>
            <p className="text-sm text-muted-foreground">
              Create a file named <code>.env</code> in the root of your project and add the following line:
            </p>
            <div className="flex items-center space-x-2">
              <Input
                id="api-key-env"
                readOnly
                value={`${apiKeyVarName}="YOUR_API_KEY_HERE"`}
                className="font-code"
              />
              <Button variant="outline" size="icon" onClick={onCopy}>
                {hasCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="sr-only">Copy Environment Variable</span>
              </Button>
            </div>
          </div>
           <div className="space-y-2">
             <p className="text-sm text-muted-foreground">
              After adding your key to the <code>.env</code> file, you'll need to restart the development server for the changes to take effect.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
