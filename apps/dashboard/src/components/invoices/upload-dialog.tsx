import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import {
    IconCheck,
    IconFile,
    IconFileTypePdf,
    IconPhoto,
    IconUpload,
    IconX,
} from '@tabler/icons-react';
import type { AllowedContentType } from '@/api/invoices';
import { createInvoice, presignUpload, uploadFileToS3 } from '@/api/invoices';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const ACCEPTED_TYPES: Array<AllowedContentType> = ['application/pdf', 'image/jpeg', 'image/png'];
const ACCEPTED_EXTENSIONS = '.pdf,.jpg,.jpeg,.png';

function getFileIcon(type: string) {
    if (type === 'application/pdf') return IconFileTypePdf;
    if (type.startsWith('image/')) return IconPhoto;
    return IconFile;
}

function getContentType(file: File): AllowedContentType | null {
    if (ACCEPTED_TYPES.includes(file.type as AllowedContentType)) {
        return file.type as AllowedContentType;
    }
    return null;
}

type UploadStage = 'idle' | 'uploading' | 'creating' | 'done' | 'error';

interface UploadDialogProps {
    teamId: string;
}

export function UploadDialog({ teamId }: UploadDialogProps) {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [dragging, setDragging] = useState(false);
    const [stage, setStage] = useState<UploadStage>('idle');
    const [progress, setProgress] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');

    const reset = () => {
        setFile(null);
        setStage('idle');
        setProgress(0);
        setErrorMessage('');
    };

    const handleOpenChange = (next: boolean) => {
        if (!next) reset();
        setOpen(next);
    };

    const handleFile = (candidate: File) => {
        const ct = getContentType(candidate);
        if (!ct) {
            setErrorMessage('Only PDF, JPEG, and PNG files are supported.');
            return;
        }
        setErrorMessage('');
        setFile(candidate);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) handleFile(dropped);
    }, []);

    const handleUpload = async () => {
        if (!file) return;
        const contentType = getContentType(file);
        if (!contentType) return;

        setStage('uploading');
        setProgress(0);
        setErrorMessage('');

        try {
            const { uploadUrl, fileObjectId } = await presignUpload(
                teamId,
                file.name,
                contentType,
                file.size
            );

            await uploadFileToS3(uploadUrl, file, setProgress);

            setStage('creating');
            await createInvoice(teamId, fileObjectId, file.name, contentType);

            setStage('done');
            queryClient.invalidateQueries({ queryKey: ['invoices', teamId] });

            setTimeout(() => handleOpenChange(false), 1200);
        } catch (err) {
            setStage('error');
            setErrorMessage(
                err instanceof Error ? err.message : 'Upload failed. Please try again.'
            );
        }
    };

    const isUploading = stage === 'uploading' || stage === 'creating';

    return (
        <Dialog
            open={open}
            onOpenChange={handleOpenChange}
        >
            <DialogTrigger asChild>
                <Button size='sm'>
                    <IconUpload size={14} />
                    Upload invoice
                </Button>
            </DialogTrigger>

            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle>Upload invoice</DialogTitle>
                    <DialogDescription>PDF, JPEG, or PNG</DialogDescription>
                </DialogHeader>

                <div className='flex flex-col gap-4 py-2'>
                    <button
                        type='button'
                        disabled={isUploading || stage === 'done'}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        className={cn(
                            'relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-sm transition-colors',
                            'hover:border-primary/60 hover:bg-primary/5',
                            dragging && 'border-primary bg-primary/5',
                            !dragging && !file && 'border-wire',
                            file &&
                                !isUploading &&
                                stage !== 'done' &&
                                'border-primary/40 bg-primary/5',
                            (isUploading || stage === 'done') && 'pointer-events-none'
                        )}
                    >
                        {stage === 'done' ? (
                            <>
                                <div className='flex size-10 items-center justify-center rounded-full bg-jade-subtle text-jade'>
                                    <IconCheck size={20} />
                                </div>
                                <p className='font-medium text-jade'>Invoice uploaded</p>
                            </>
                        ) : file ? (
                            <>
                                {(() => {
                                    const Icon = getFileIcon(file.type);
                                    return (
                                        <Icon
                                            size={32}
                                            className='text-primary'
                                        />
                                    );
                                })()}
                                <div className='text-center'>
                                    <p className='max-w-65 truncate font-medium'>{file.name}</p>
                                    <p className='mt-0.5 text-xs text-ink-faint'>
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                                {!isUploading && (
                                    <button
                                        type='button'
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFile(null);
                                        }}
                                        className='absolute top-3 right-3 text-ink-faint hover:text-ink'
                                    >
                                        <IconX size={15} />
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                <div className='flex size-10 items-center justify-center rounded-full bg-muted'>
                                    <IconUpload
                                        size={18}
                                        className='text-ink-faint'
                                    />
                                </div>
                                <div className='text-center'>
                                    <p className='font-medium'>
                                        Drop a file or <span className='text-primary'>browse</span>
                                    </p>
                                    <p className='mt-1 text-xs text-ink-faint'>
                                        PDF, JPEG, PNG up to 10 MB
                                    </p>
                                </div>
                            </>
                        )}
                    </button>

                    <input
                        ref={fileInputRef}
                        type='file'
                        accept={ACCEPTED_EXTENSIONS}
                        className='sr-only'
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFile(f);
                            e.target.value = '';
                        }}
                    />

                    {isUploading && (
                        <div className='flex flex-col gap-1.5'>
                            <div className='flex justify-between text-xs text-ink-muted'>
                                <span>
                                    {stage === 'uploading'
                                        ? 'Uploading…'
                                        : 'Creating invoice record…'}
                                </span>
                                {stage === 'uploading' && <span>{progress}%</span>}
                            </div>
                            <Progress
                                value={stage === 'uploading' ? progress : 100}
                                className='h-1.5'
                            />
                        </div>
                    )}

                    {errorMessage && <p className='text-sm text-crimson'>{errorMessage}</p>}
                </div>

                <DialogFooter>
                    <Button
                        variant='outline'
                        onClick={() => handleOpenChange(false)}
                        disabled={isUploading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpload}
                        disabled={!file || isUploading || stage === 'done'}
                    >
                        {isUploading ? 'Uploading…' : 'Upload'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
