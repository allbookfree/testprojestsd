'use client';

import { useState } from 'react';
import { Header } from '@/components/app/header';
import { ImageUploader } from '@/components/app/image-uploader';
import { ImageCard } from '@/components/app/image-card';
import { Bot, FileText, UploadCloud } from 'lucide-react';

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);

  const handleFilesAdded = (newFiles: File[]) => {
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };
  
  const handleClear = () => {
    setFiles([]);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="py-16 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              AI-Powered Image SEO
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Instantly generate SEO-optimized titles, descriptions, and keywords for your images. Save time and boost your online visibility.
            </p>
          </div>
        </section>

        <section id="upload-section" className="container mx-auto px-4 pb-16">
          <div className="mx-auto max-w-4xl">
            <ImageUploader onFilesAdded={handleFilesAdded} />
          </div>
        </section>
        
        {files.length > 0 && (
          <section className="container mx-auto px-4 pb-24">
             <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold tracking-tight">Your Results</h2>
              <button
                onClick={handleClear}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Start Over
              </button>
            </div>
            <div className="mt-12 grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {files.map((file, index) => (
                <ImageCard key={`${file.name}-${index}`} file={file} />
              ))}
            </div>
          </section>
        )}

        {files.length === 0 && (
          <section className="container mx-auto px-4 pb-24">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight">How It Works</h2>
              <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                Our process is simple and designed to get you results in seconds.
              </p>
            </div>

            <div className="mt-12 grid max-w-5xl mx-auto md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary">
                  <UploadCloud className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">1. Upload Image(s)</h3>
                <p className="mt-2 text-muted-foreground">
                  Drag and drop or browse to select one or more images from your device.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary">
                  <Bot className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">2. AI Analysis</h3>
                <p className="mt-2 text-muted-foreground">
                  Our AI analyzes the visual content and context of each image.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">3. Get Metadata</h3>
                <p className="mt-2 text-muted-foreground">
                  Receive SEO-friendly titles, descriptions, and keywords in an instant.
                </p>
              </div>
            </div>
          </section>
        )}

      </main>
      <footer className="py-6 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ImageMeta Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
