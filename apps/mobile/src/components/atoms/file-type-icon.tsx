import React from 'react';
import { Icon } from './icon';

type FileType = 'pdf' | 'image' | 'unknown';

export interface FileTypeIconProps {
    contentType?: string;
    size?: number;
}

function resolveFileType(contentType?: string): FileType {
    if (!contentType) return 'unknown';
    if (contentType === 'application/pdf') return 'pdf';
    if (contentType.startsWith('image/')) return 'image';
    return 'unknown';
}

export function FileTypeIcon({ contentType, size = 24 }: FileTypeIconProps) {
    const type = resolveFileType(contentType);

    if (type === 'pdf')
        return (
            <Icon
                name='invoice'
                size={size}
                color='error'
            />
        );
    if (type === 'image')
        return (
            <Icon
                name='camera'
                size={size}
                color='brand'
            />
        );
    return (
        <Icon
            name='receipt'
            size={size}
            color='secondary'
        />
    );
}
