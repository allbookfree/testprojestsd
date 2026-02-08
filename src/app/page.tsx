'use client';

import { useState, useEffect, useRef } from 'react';
import { ImageUploader } from '@/components/app/image-uploader';
import { ImageCard } from '@/components/app/image-card';
import { Bot, Download, FileText, UploadCloud, Loader, CircleCheck, Trash2, AlertTriangle } from 'lucide-react';
import { PageHeader, PageHeaderDescription, PageHeaderHeading } from '@/components/app/page-header';
import type { GenerateImageMetadataOutput } from '@/ai/flows/generate-image-metadata';
import { Button } from '@/components/ui/button';
import { runGenerateImageMetadata } from '@/app/actions';
import { useSettings } from '@/hooks/use-settings';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

type FileStatus = 'queued' | 'processing' | 'success' | 'error';

interface FileState {
    file: File;
    status: FileStatus;
    metadata?: GenerateImageMetadataOutput;
    error?: string;
    previewUrl: string;
}

const resizeImage = (file: File, maxSize: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxSize) {
                        height = Math.round((height * maxSize) / width);
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width = Math.round((width * maxSize) / height);
                        height = maxSize;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }
                ctx.drawImage(img, 0, 0, width, height);
                
                resolve(canvas.toDataURL('image/jpeg', 0.9));
            };
            img.onerror = (err) => reject(new Error('Image failed to load'));
            if (event.target?.result) {
                img.src = event.target.result as string;
            } else {
                reject(new Error('Could not read file for resizing'));
            }
        };
        reader.onerror = (err) => reject(new Error('File reader error'));
        reader.readAsDataURL(file);
    });
};


export default function Home() {
    const [fileStates, setFileStates] = useState<FileState[]>([]);
    const [settings] = useSettings();
    const { toast } = useToast();
    const isProcessingRef = useRef(false);
    const [isQueueHalted, setIsQueueHalted] = useState(false);

    const processQueue = async () => {
        if (isProcessingRef.current || isQueueHalted) return;

        const nextFileIndex = fileStates.findIndex(f => f.status === 'queued');
        if (nextFileIndex === -1) {
            isProcessingRef.current = false;
            return;
        }

        isProcessingRef.current = true;
        
        setFileStates(prev =>
            prev.map((fs, index) =>
                index === nextFileIndex ? { ...fs, status: 'processing' } : fs
            )
        );

        try {
            const dataUrl = await resizeImage(fileStates[nextFileIndex].file, 1920);

            const result = await runGenerateImageMetadata(dataUrl, settings);

            if ('error' in result) {
                setIsQueueHalted(true);
                setFileStates(prev =>
                    prev.map((fs, index) => {
                        if (index === nextFileIndex) {
                            return { ...fs, status: 'error', error: result.error };
                        }
                        if (fs.status === 'queued') {
                            return { ...fs, status: 'error', error: 'Processing halted due to an API error on a previous file.' };
                        }
                        return fs;
                    })
                );
                isProcessingRef.current = false;
                return;
            }

            setFileStates(prev =>
                prev.map((fs, index) =>
                    index === nextFileIndex
                        ? { ...fs, status: 'success', metadata: result }
                        : fs
                )
            );
        } catch (e: any) {
            setIsQueueHalted(true);
            setFileStates(prev =>
                prev.map((fs, index) => {
                    if (index === nextFileIndex) {
                        return { ...fs, status: 'error', error: e.message || 'An unknown error occurred' };
                    }
                    if (fs.status === 'queued') {
                        return { ...fs, status: 'error', error: 'Processing halted due to an unexpected error.' };
                    }
                    return fs;
                })
            );
        } finally {
            isProcessingRef.current = false;
        }
    };
    
    useEffect(() => {
        const hasQueuedFiles = fileStates.some(f => f.status === 'queued');
        if (hasQueuedFiles && !isQueueHalted) {
            processQueue();
        }
    }, [fileStates, isQueueHalted]);


    const handleFilesAdded = (newFiles: File[]) => {
        setIsQueueHalted(false);
        const newFileStates: FileState[] = newFiles.map(file => ({
            file,
            status: 'queued',
            previewUrl: URL.createObjectURL(file),
        }));
        setFileStates(prevFiles => [...prevFiles, ...newFileStates]);
    };

    const handleRemoveFile = (previewUrlToRemove: string) => {
        setFileStates(prevStates => {
            const fileToRevoke = prevStates.find(fs => fs.previewUrl === previewUrlToRemove);
            if (fileToRevoke) {
                URL.revokeObjectURL(fileToRevoke.previewUrl);
            }
            return prevStates.filter(fs => fs.previewUrl !== previewUrlToRemove);
        });
    };

    const handleClear = () => {
        setIsQueueHalted(false);
        fileStates.forEach(fs => URL.revokeObjectURL(fs.previewUrl));
        setFileStates([]);
    };

    const handleDownloadAll = () => {
        const successfulMetadata = fileStates.filter(fs => fs.status === 'success' && fs.metadata);
        if (successfulMetadata.length === 0) return;

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "FileName,Title,Description,Keywords,Rating\r\n"; // Header

        successfulMetadata.forEach(({ file, metadata }) => {
            if (!metadata) return;
            const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
            const row = [
                `"${fileNameWithoutExt.replace(/"/g, '""')}"`,
                `"${metadata.title.replace(/"/g, '""')}"`,
                `"${metadata.description.replace(/"/g, '""')}"`,
                `"${metadata.keywords.replace(/"/g, '""')}"`,
                metadata.rating
            ].join(',');
            csvContent += row + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `metadata_export_${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const getOverallStatus = () => {
        const total = fileStates.length;
        if (total === 0) return null;
        
        if (isQueueHalted) {
             return (
                <div className="mx-auto max-w-4xl space-y-4 mb-12">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Processing Halted</AlertTitle>
                        <AlertDescription>
                            An API error occurred. Please check your API keys in settings. To resume, clear the current batch and upload again.
                        </AlertDescription>
                    </Alert>
                </div>
            )
        }
        
        const done = fileStates.filter(f => f.status === 'success' || f.status === 'error').length;
        const processing = fileStates.some(f => f.status === 'processing');
        const queued = fileStates.some(f => f.status === 'queued');
        
        if (done === total) return null;

        let title = "Processing complete";
        if(processing) title = `Processing file ${done + 1} of ${total}...`;
        else if(queued) title = `Waiting to process... ${done} of ${total} complete.`;

        return (
            <div className="mx-auto max-w-4xl space-y-4 mb-12">
                <Alert>
                    <div className='flex items-center'>
                        {processing || queued ? <Loader className="h-4 w-4 animate-spin mr-2" /> : <CircleCheck className="h-4 w-4 mr-2 text-green-500" />}
                        <AlertTitle>{title}</AlertTitle>
                    </div>
                    <AlertDescription className="pl-6">
                        Processing images one-by-one to avoid API rate limits. Please be patient.
                    </AlertDescription>
                </Alert>
                <Progress value={(done / total) * 100} className="w-full h-2" />
            </div>
        )
    }

    return (
        <>
            <PageHeader>
                <PageHeaderHeading>Metadata Generator</PageHeaderHeading>
                <PageHeaderDescription>
                    Instantly generate SEO-optimized titles, descriptions, and keywords for your images. Save time and boost your online visibility.
                </PageHeaderDescription>
            </PageHeader>

            <div className="pb-16">
                <section className="mb-12">
                    <div className="mx-auto max-w-4xl">
                        <ImageUploader onFilesAdded={handleFilesAdded} />
                    </div>
                </section>

                {fileStates.length > 0 && (
                    <section>
                        {getOverallStatus()}

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                            <h2 className="text-2xl font-bold tracking-tight">Your Results</h2>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleClear}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Clear All
                                </Button>
                                <Button
                                    onClick={handleDownloadAll}
                                    disabled={fileStates.every(f => f.status !== 'success')}
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download (.csv)
                                </Button>
                            </div>
                        </div>
                        <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {fileStates.map((fs) => (
                                <ImageCard
                                    key={fs.previewUrl}
                                    fileState={fs}
                                    onRemove={handleRemoveFile}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {fileStates.length === 0 && (
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
                                    Our AI analyzes the visual content of each image one-by-one.
                                </p>
                            </div>
                            <div className="flex flex-col items-center p-4 rounded-lg hover:bg-card">
                                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary">
                                    <FileText className="h-8 w-8" />
                                </div>
                                <h3 className="mt-6 text-lg font-semibold">3. Get Metadata</h3>
                                <p className="mt-2 text-muted-foreground">
                                    Receive SEO-friendly data and download it as a CSV file.
                                </p>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </>
    );
}
