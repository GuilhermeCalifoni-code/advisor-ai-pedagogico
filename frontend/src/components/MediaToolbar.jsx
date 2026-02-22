import React, { useRef, useState } from 'react';
import { useReactMediaRecorder } from "react-media-recorder";
import { 
  MicrophoneIcon, 
  StopIcon, 
  PaperClipIcon, 
  CameraIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';

const MediaToolbar = ({ onMediaSelected }) => {
  const [activeMedia, setActiveMedia] = useState(null);
  const fileInputRef = useRef(null);

  const { status, startRecording, stopRecording } = useReactMediaRecorder({ 
    audio: true,
    onStop: async (blobUrl, blob) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        handleMediaConfirm({ type: 'audio', url: blobUrl, base64: reader.result, name: 'Áudio do Professor.wav' });
      };
    }
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleMediaConfirm({ 
          type: file.type.includes('image') ? 'image' : 'file', 
          url: URL.createObjectURL(file), 
          base64: reader.result,
          name: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScreenshot = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const track = stream.getVideoTracks()[0];
      const imageCapture = new ImageCapture(track);
      const bitmap = await imageCapture.grabFrame();
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d');
      context.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);
      const base64 = canvas.toDataURL('image/png');
      track.stop();
      handleMediaConfirm({ type: 'image', url: base64, base64, name: 'Evidência de Aula.png' });
    } catch (err) {
      console.error("Print cancelado:", err);
    }
  };

  const handleMediaConfirm = (mediaObj) => {
    setActiveMedia(mediaObj);
    onMediaSelected(mediaObj);
  };

  const clearMedia = () => {
    setActiveMedia(null);
    onMediaSelected(null);
  };

  return (
    <div className="flex items-center gap-2">
      {activeMedia && (
        <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 mr-2 shadow-sm">
          <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">{activeMedia.type}</span>
          <button onClick={clearMedia} className="text-indigo-400 hover:text-rose-500 transition-colors"><XMarkIcon className="w-4 h-4" /></button>
        </div>
      )}
      <div className="flex gap-1">
        {status === 'recording' ? (
          <button onClick={stopRecording} className="p-2 text-rose-600 animate-pulse bg-rose-50 rounded-lg"><StopIcon className="w-5 h-5" /></button>
        ) : (
          <button onClick={startRecording} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><MicrophoneIcon className="w-5 h-5" /></button>
        )}
        <button onClick={handleScreenshot} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Tirar Print da Tela"><CameraIcon className="w-5 h-5" /></button>
        <button onClick={() => fileInputRef.current.click()} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Anexar Arquivo"><PaperClipIcon className="w-5 h-5" /></button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf" />
      </div>
    </div>
  );
};

export default MediaToolbar;