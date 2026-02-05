'use client';

import { useState, useEffect, useRef } from 'react';
import { ImageUploader } from '@/components/app/image-uploader';
import { ImageCard } from '@/components/app/image-card';
import { Bot, Download, FileText, UploadCloud, Loader, CircleCheck, Trash2 } from 'lucide-react';
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
    path: string; // This will hold the actual file path from the user's computer
    status: FileStatus;
    metadata?: GenerateImageMetadataOutput;
    error?: string;
    previewUrl: string;
}

export default function Home() {
    const [fileStates, setFileStates] = useState<FileState[]>([]);
    const [settings] = useSettings();
    const { toast } = useToast();
    const isProcessingRef = useRef(false);

    const processQueue = async () => {
        if (isProcessingRef.current) return;

        const nextFileIndex = fileStates.findIndex(f => f.status === 'queued');
        if (nextFileIndex === -1) {
            isProcessingRef.current = false;
            return;
        }

        isProcessingRef.current = true;
        const currentFileState = fileStates[nextFileIndex];

        setFileStates(prev =>
            prev.map((fs, index) =>
                index === nextFileIndex ? { ...fs, status: 'processing' } : fs
            )
        );

        try {
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(currentFileState.file);
            });

            const result = await runGenerateImageMetadata(dataUrl, settings);

            if ('error' in result) {
                throw new Error(result.error);
            }

            setFileStates(prev =>
                prev.map((fs, index) =>
                    index === nextFileIndex
                        ? { ...fs, status: 'success', metadata: result }
                        : fs
                )
            );
        } catch (e: any) {
            setFileStates(prev =>
                prev.map((fs, index) =>
                    index === nextFileIndex
                        ? { ...fs, status: 'error', error: e.message || 'An unknown error occurred' }
                        : fs
                )
            );
        } finally {
            isProcessingRef.current = false;
        }
    };
    
    useEffect(() => {
        const hasQueuedFiles = fileStates.some(f => f.status === 'queued');
        if (hasQueuedFiles) {
            processQueue();
        }
    }, [fileStates]);


    const handleFilesAdded = (newFiles: File[]) => {
        const newFileStates: FileState[] = newFiles.map(file => ({
            file,
            // In Electron, the File object has a special 'path' property
            // that gives us the real file location on the user's computer.
            path: (file as any).path, 
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
    
    const handleSaveMetadata = async (fileState: FileState) => {
        if (!fileState.metadata || !fileState.path) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Metadata or file path is missing.',
            });
            return;
        }

        // The 'electronAPI' is exposed by preload.js. We check if it exists.
        if ((window as any).electronAPI) {
            const result = await (window as any).electronAPI.saveMetadata(fileState.path, fileState.metadata);
            if (result.success) {
                toast({
                    title: 'Metadata Saved!',
                    description: `Metadata has been written to ${fileState.file.name}.`,
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Failed to Save Metadata',
                    description: result.error,
                });
            }
        } else {
            // This message will show if the app is run in a regular web browser
            toast({
                variant: 'destructive',
                title: 'Feature Not Available',
                description: 'Saving metadata to a file is only available in the desktop app.',
            });
        }
    };


    const handleClear = () => {
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
            const row = [
                `"${file.name.replace(/"/g, '""')}"`,
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
                                    onSaveMetadata={handleSaveMetadata}
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
                                <h3 className="mt-6 text-lg font-semibold">3. Get & Save Metadata</h3>
                                <p className="mt-2 text-muted-foreground">
                                    Receive SEO-friendly data and save it directly to your image file.
                                </p>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </>
    );
}
