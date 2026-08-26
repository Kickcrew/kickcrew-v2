"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUpload({
  value,
  onChange,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  async function uploadImage(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    setUploading(true);

    const fileName = `${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("player-photos")
      .upload(fileName, file);

    if (error) {
      alert(error.message);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from("player-photos")
      .getPublicUrl(fileName);

    onChange(publicUrl);

    setUploading(false);
  }

  return (
    <div className="space-y-4">

      {value && (
        <img
          src={value}
          alt="Player"
          className="w-32 h-32 rounded-xl object-cover border border-[#D4AF37]/30"
        />
      )}

      <input
        type="file"
        accept="image/*"
        onChange={uploadImage}
      />

      {uploading && (
        <p className="text-[#D4AF37]">
          Uploading image...
        </p>
      )}

    </div>
  );
}