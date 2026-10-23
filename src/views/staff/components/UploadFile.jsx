import { useState } from 'react';
import api from '../services/api';
import { UploadCloud, CheckCircle, AlertCircle, File } from 'lucide-react';

const UploadFile = ({ onUploaded }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!file) return setError('Please select a file first.');
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post('/uploads', form, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      setResult(res.data);
      if (onUploaded) onUploaded(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const removeFile = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-6 transition-all duration-300 ${
          isDragOver
            ? 'border-brand-500 bg-brand-50/50 scale-[1.02]'
            : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-50/80'
        }`}
      >
        <input
          type="file"
          id="file-upload"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {!file && (
          <div className="text-center pointer-events-none">
            <UploadCloud className="mx-auto h-10 w-10 text-slate-400 animate-float" />
            <p className="mt-2 text-sm font-semibold text-slate-700">Drag & Drop or Click to Browse</p>
            <p className="mt-1 text-xs text-slate-400">Supports images, PDF, CSV, Excel, up to 10MB</p>
          </div>
        )}

        {file && (
          <div className="text-center w-full z-10">
            <File className="mx-auto h-10 w-10 text-brand-500" />
            <p className="mt-2 text-sm font-semibold text-slate-900 truncate max-w-xs mx-auto">
              {file.name}
            </p>
            <p className="text-xs text-slate-500">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            {!result && !loading && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={handleUpload}
                  className="rounded-full bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-2 text-xs font-semibold text-white shadow-md hover:scale-105 transition-all duration-300"
                >
                  Upload File
                </button>
                <button
                  onClick={removeFile}
                  className="rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all duration-300"
                >
                  Change
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-brand-600 font-medium justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500"></div>
          <span>Uploading to server...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 p-3 text-sm text-rose-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">
            Successfully uploaded!{' '}
            <a
              href={result.url}
              target="_blank"
              rel="noreferrer"
              className="font-bold underline text-emerald-800 hover:text-emerald-950"
            >
              View Document
            </a>
          </span>
          <button
            onClick={removeFile}
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadFile;
