import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle, Loader2, Upload, X } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface UploadZoneProps {
  onResult: (data: any) => void;
}

export function UploadZone({ onResult }: UploadZoneProps) {
  const [dragActive, setDragActive] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setFile(file);
    setPreview(URL.createObjectURL(file));
    setError(null);
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const uploadFile = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      onResult(response.data);
    } catch (err) {
      console.error(err);
      setError("Failed to process image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card
              className={cn(
                "relative group cursor-pointer border-dashed border-2 p-12 transition-all duration-300",
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                className="hidden"
                type="file"
                accept="image/*"
                onChange={handleChange}
              />
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <div className="p-4 rounded-full bg-background shadow-lg ring-1 ring-border group-hover:scale-110 transition-transform duration-300">
                  <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    Upload an image to analyze
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Drag and drop or click to select
                  </p>
                </div>
                <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  Supported formats: JPG, PNG
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="overflow-hidden bg-background/50 backdrop-blur">
              <div className="relative aspect-video w-full bg-black/5 flex items-center justify-center overflow-hidden">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
                  onClick={clearFile}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium truncate max-w-[200px]">
                      {file?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(file!.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button onClick={uploadFile} disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Start Analysis"
                  )}
                </Button>
              </div>
            </Card>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg text-sm"
              >
                <AlertCircle className="h-4 w-4" />
                {error}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
