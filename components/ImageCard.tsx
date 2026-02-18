
import React from 'react';
import { Trash2, RotateCcw, Maximize2 } from 'lucide-react';
import { UploadedImage } from '../types';

interface ImageCardProps {
  image: UploadedImage;
  onRemove: (id: string) => void;
  onRotate: (id: string) => void;
  index: number;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, onRemove, onRotate, index }) => {
  return (
    <div className="group relative bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
      <div className="absolute top-2 left-2 z-10">
        <span className="bg-black/50 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-sm">
          #{index + 1}
        </span>
      </div>
      
      <div className="aspect-[3/4] overflow-hidden bg-gray-100 flex items-center justify-center">
        <img 
          src={image.previewUrl} 
          alt={image.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          style={{ transform: `rotate(${image.rotation}deg)` }}
        />
      </div>

      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
        <button 
          onClick={() => onRotate(image.id)}
          className="p-2 bg-white rounded-full text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
          title="Rotate"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button 
          onClick={() => onRemove(image.id)}
          className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50 transition-colors"
          title="Remove"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="p-3">
        <p className="text-xs font-medium text-gray-700 truncate">{image.name}</p>
        <p className="text-[10px] text-gray-400 mt-1">{(image.size / 1024 / 1024).toFixed(2)} MB</p>
      </div>
    </div>
  );
};

export default ImageCard;
