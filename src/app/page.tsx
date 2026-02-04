'use client';

import { useState } from 'react';
import { Header } from '@/components/app/header';
import { ImageUploader } from '@/components/app/image-uploader';
import { ImageCard } from '@/components/app/image-card';
import { ImagePlus } from 'lucide-react';

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);

  const handleFilesAdded = (newFiles: File[]) => {
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-4xl">
            <ImageUploader onFilesAdded={handleFilesAdded} />
          </div>

          {files.length > 0 ? (
            <div className="mt-12 grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {files.map((file, index) => (
                <ImageCard key={`${file.name}-${index}`} file={file} />
              ))}
            </div>
          ) : (
            <div className="mt-16 flex flex-col items-center justify-center text-center text-muted-foreground">
              <ImagePlus className="h-16 w-16" />
              <h2 className="mt-4 text-2xl font-semibold">Your images will appear here</h2>
              <p className="mt-2 max-w-sm">
                Upload one or more images to start generating SEO-optimized metadata.
              </p>
            </div>
          )}
        </div>
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground">
        <p>Powered by AI. Built for creatives.</p>
      </footer>
    </div>
  );
}
