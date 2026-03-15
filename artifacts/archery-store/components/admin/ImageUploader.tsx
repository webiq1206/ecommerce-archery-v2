"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          newUrls.push(data.url);
        } else {
          // Fall back to local URL input if UploadThing not configured
          const objectUrl = URL.createObjectURL(file);
          newUrls.push(objectUrl);
        }
      } catch {
        // For local dev: use file name as placeholder
        newUrls.push(`/uploads/${file.name}`);
      }
    }

    onChange([...images.filter(Boolean), ...newUrls]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  const addUrlManually = () => {
    const url = prompt("Enter image URL:");
    if (url) onChange([...images, url]);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.filter(Boolean).map((url, i) => (
          <div key={`${url}-${i}`} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
            <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">{i + 1}</span>
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-primary flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-primary transition-colors"
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <Upload className="w-6 h-6" />
              <span className="text-xs font-medium">Upload</span>
            </>
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => e.target.files && handleUpload(e.target.files)}
        className="hidden"
      />

      <button type="button" onClick={addUrlManually} className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary">
        <ImageIcon className="w-4 h-4" /> Add image by URL
      </button>
    </div>
  );
}
