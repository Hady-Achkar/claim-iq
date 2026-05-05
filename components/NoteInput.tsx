"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface NoteInputProps {
  onSubmit: (note: string) => void;
  loading: boolean;
}

const PLACEHOLDER = `e.g. "Patient presents with pain in lower right molar. Deep caries noted, recommend composite filling. If pulp is affected, root canal therapy will be required."`;

export function NoteInput({ onSubmit, loading }: NoteInputProps) {
  const [note, setNote] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={PLACEHOLDER}
        rows={5}
        className="resize-none text-sm"
        disabled={loading}
      />
      <Button
        onClick={() => onSubmit(note)}
        disabled={loading || note.trim().length === 0}
        className="self-end"
      >
        {loading ? "Analysing…" : "Optimise Treatment →"}
      </Button>
    </div>
  );
}
