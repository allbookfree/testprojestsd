'use client';

import { useState } from 'react';
import { ImageUploader } from '@/components/app/image-uploader';
import { ImageCard } from '@/components/app/image-card';
import { Bot, FileText, UploadCloud } from 'lucide-react';
import { PageHeader, PageHeaderDescription, PageHeaderHeading } from '@/components/app/page-header';

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);

  const handleFilesAdded = (newFiles: File[]) => {
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };
  
  const handleClear = () => {
    setFiles([]);
  }

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Metadata Generator</PageHeaderHeading>
        <PageHeaderDescription>
          Instantly generate SEO-optimized titles, descriptions, and keywords for your images. Save time and boost your online visibility.
        </PageHeaderDescription>
      </PageHeader>
      
      <div className="container mx-auto px-4 md:px-8 pb-16">
        <section className="mb-12">
          <div className="mx-auto max-w-4xl">
            <ImageUploader onFilesAdded={handleFilesAdded} />
          </div>
        </section>
        
        {files.length > 0 && (
          <section>
             <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold tracking-tight">Your Results</h2>
              <button
                onClick={handleClear}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Start Over
              </button>
            </div>
            <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {files.map((file, index) => (
                <ImageCard key={`${file.name}-${index}`} file={file} />
              ))}
            </div>
          </section>
        )}

        {files.length === 0 && (
          <section>
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold tracking-tight">How It Works</h2>
              <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                Our process is simple and designed to get you results in seconds.
              </p>
            </div>

            <div className="mt-12 grid max-w-5xl mx-auto md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center p-4 rounded-lg hover:bg-card">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary">
                  <UploadCloud className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-lg font-semibold">1. Upload Image(s)</h3>
                <p className="mt-2 text-muted-foreground">
                  Drag and drop or browse to select one or more images from your device.
                </p>
              </div>
              <div className="flex flex-col items-center p-4 rounded-lg hover:bg-card">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary">
                  <Bot className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-lg font-semibold">2. AI Analysis</h3>
                <p className="mt-2 text-muted-foreground">
                  Our AI analyzes the visual content and context of each image.
                </p>
              </div>
              <div className="flex flex-col items-center p-4 rounded-lg hover:bg-card">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-lg font-semibold">3. Get Metadata</h3>
                <p className="mt-2 text-muted-foreground">
                  Receive SEO-friendly titles, descriptions, and keywords in an instant.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
