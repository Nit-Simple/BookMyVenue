import { useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Modal, Button, Input, Textarea, StarInput } from '@/components/ui';
import { useCreateReview } from '../api';
import { VENUE_IMAGE_POOL } from '@/mock/seed';
import type { EventCategory } from '@/types';

/**
 * Review form shown after a completed booking. Image upload is simulated — a
 * file picker adds a placeholder image to mirror the real upload UI.
 */
export function ReviewFormModal({
  open,
  onClose,
  venueId,
  venueName,
  category,
}: {
  open: boolean;
  onClose: () => void;
  venueId: string;
  venueName: string;
  category: EventCategory;
}) {
  const createReview = useCreateReview();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string>();

  const reset = () => {
    setRating(5);
    setTitle('');
    setBody('');
    setImages([]);
    setError(undefined);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    // Simulated upload: map each picked file to a sample image URL.
    const next = Array.from(files).map(
      (_, i) => VENUE_IMAGE_POOL[(images.length + i) % VENUE_IMAGE_POOL.length],
    );
    setImages((prev) => [...prev, ...next].slice(0, 4));
  };

  const submit = () => {
    if (body.trim().length < 10) {
      setError('Please write at least 10 characters about your experience.');
      return;
    }
    createReview.mutate(
      { venueId, rating, title: title.trim() || 'Great experience', body: body.trim(), images, eventCategory: category },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Write a review"
      description={venueName}
      footer={
        <div className="flex gap-2">
          <Button variant="outline" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button fullWidth isLoading={createReview.isPending} onClick={submit}>
            Submit review
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Your rating</p>
          <StarInput value={rating} onChange={setRating} />
        </div>

        <Input
          label="Title"
          placeholder="Sum up your experience"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <Textarea
          label="Your review"
          placeholder="Tell other customers about the venue, service, food and ambience…"
          rows={5}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            setError(undefined);
          }}
          error={error}
        />

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Add photos (optional)</p>
          <div className="flex flex-wrap gap-2">
            {images.map((img, i) => (
              <div key={i} className="relative h-20 w-20 overflow-hidden rounded-lg">
                <img src={img} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute right-1 top-1 rounded-full bg-slate-900/70 p-0.5 text-white"
                  aria-label="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {images.length < 4 && (
              <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-slate-400 hover:border-brand-400 hover:text-brand-600">
                <ImagePlus className="h-5 w-5" />
                <span className="text-[10px]">Add</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </label>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
