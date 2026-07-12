import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Star, Trash2, UploadCloud } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface UploadFile {
  id: string;
  file: File;
  preview: string;
}

interface MediaUploaderProps {
  files: UploadFile[];
  onChange: (files: UploadFile[]) => void;
  minFiles?: number;
  maxFiles?: number;
  disabled?: boolean;
}

/**
 * Multi-image uploader with drag-and-drop, previews and a "primary" marker.
 * The first image is treated as primary (sort_order 0), matching the backend's
 * media model. Files are held in memory until the venue is created (multipart).
 */
export function MediaUploader({
  files,
  onChange,
  minFiles = 3,
  maxFiles = 10,
  disabled,
}: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Revoke object URLs on unmount to avoid leaks.
  useEffect(() => {
    return () => files.forEach((f) => URL.revokeObjectURL(f.preview));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, maxFiles - files.length)
      .map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        preview: URL.createObjectURL(file),
      }));
    onChange([...files, ...incoming]);
  };

  const remove = (id: string) => {
    const target = files.find((f) => f.id === id);
    if (target) URL.revokeObjectURL(target.preview);
    onChange(files.filter((f) => f.id !== id));
  };

  const makePrimary = (id: string) => {
    const target = files.find((f) => f.id === id);
    if (!target) return;
    onChange([target, ...files.filter((f) => f.id !== id)]);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled) addFiles(e.dataTransfer.files);
        }}
        disabled={disabled || files.length >= maxFiles}
        className={cn(
          'focus-ring flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-60',
          dragOver ? 'border-brand-500 bg-brand-50' : 'border-slate-300 hover:border-brand-400',
        )}
      >
        <UploadCloud className="h-8 w-8 text-brand-500" />
        <span className="text-sm font-medium text-slate-700">
          Drag & drop images, or <span className="text-brand-700">browse</span>
        </span>
        <span className="text-xs text-slate-400">
          PNG / JPG · at least {minFiles} images · up to {maxFiles}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => addFiles(e.target.files)}
      />

      {files.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {files.map((f, i) => (
            <div
              key={f.id}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200"
            >
              <img src={f.preview} alt="" className="h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-brand-700 px-2 py-0.5 text-[10px] font-semibold text-white">
                  <Star className="h-2.5 w-2.5" /> Primary
                </span>
              )}
              {!disabled && (
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-900/50 opacity-0 transition-opacity group-hover:opacity-100">
                  {i !== 0 && (
                    <button
                      type="button"
                      onClick={() => makePrimary(f.id)}
                      title="Set as primary"
                      className="rounded-lg bg-white/90 p-2 text-slate-700 hover:bg-white"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(f.id)}
                    title="Remove"
                    className="rounded-lg bg-white/90 p-2 text-red-600 hover:bg-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
          {files.length < maxFiles && !disabled && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="focus-ring flex aspect-[4/3] items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-brand-400 hover:text-brand-500"
            >
              <ImagePlus className="h-6 w-6" />
            </button>
          )}
        </div>
      )}

      {files.length > 0 && files.length < minFiles && (
        <p className="mt-2 text-xs font-medium text-amber-600">
          Add {minFiles - files.length} more image{minFiles - files.length > 1 ? 's' : ''} (minimum{' '}
          {minFiles}).
        </p>
      )}
    </div>
  );
}
