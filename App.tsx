
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Upload, Download, Plus, Trash2, Settings2, Layout, Smartphone, 
  CheckCircle2, AlertCircle, Loader2, Sparkles, Scissors, Layers, 
  FileSearch, ChevronRight, FileDown
} from 'lucide-react';
import Header from './components/Header';
import ImageCard from './components/ImageCard';
import { UploadedImage, PDFSettings, AppStatus, AppView, PDFPagePreview } from './types';
import { generatePDF, renderPdfPages, splitPDF, mergePDFs } from './services/pdfService';
import { suggestFilename } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('IMAGE_TO_PDF');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  
  // States for Image to PDF
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [settings, setSettings] = useState<PDFSettings>({
    pageSize: 'a4',
    orientation: 'portrait',
    margin: 10,
    filename: 'snap_document'
  });
  const [aiNaming, setAiNaming] = useState(false);

  // States for PDF processing (Split/Merge/ToImage)
  const [selectedPdfs, setSelectedPdfs] = useState<File[]>([]);
  const [pagePreviews, setPagePreviews] = useState<PDFPagePreview[]>([]);
  const [processingFile, setProcessingFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear states when switching views
  useEffect(() => {
    setImages([]);
    setSelectedPdfs([]);
    setPagePreviews([]);
    setProcessingFile(null);
  }, [view]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    if (view === 'IMAGE_TO_PDF') {
      const newImages: UploadedImage[] = files.map(file => ({
        id: Math.random().toString(36).substring(7),
        file,
        name: file.name,
        size: file.size,
        previewUrl: URL.createObjectURL(file),
        rotation: 0
      }));
      setImages(prev => [...prev, ...newImages]);
    } else {
      // PDF processing views
      if (view === 'PDF_SPLIT' || view === 'PDF_TO_IMAGE') {
        const file = files[0];
        setProcessingFile(file);
        setStatus(AppStatus.PROCESSING);
        const previews = await renderPdfPages(file);
        setPagePreviews(previews.map((url, i) => ({ index: i, dataUrl: url, selected: true })));
        setStatus(AppStatus.IDLE);
      } else if (view === 'PDF_MERGE') {
        setSelectedPdfs(prev => [...prev, ...files]);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAction = async () => {
    setStatus(AppStatus.DOWNLOADING);
    try {
      if (view === 'IMAGE_TO_PDF') {
        await generatePDF(images, settings);
      } else if (view === 'PDF_SPLIT' && processingFile) {
        const selectedIndices = pagePreviews.filter(p => p.selected).map(p => p.index);
        await splitPDF(processingFile, selectedIndices);
      } else if (view === 'PDF_MERGE') {
        await mergePDFs(selectedPdfs);
      } else if (view === 'PDF_TO_IMAGE') {
        // Download each selected page preview as PNG
        pagePreviews.filter(p => p.selected).forEach((p, i) => {
          const link = document.createElement('a');
          link.href = p.dataUrl;
          link.download = `page_${p.index + 1}.png`;
          link.click();
        });
      }
      setStatus(AppStatus.IDLE);
    } catch (error) {
      console.error(error);
      setStatus(AppStatus.ERROR);
      setTimeout(() => setStatus(AppStatus.IDLE), 3000);
    }
  };

  const togglePageSelection = (index: number) => {
    setPagePreviews(prev => prev.map(p => p.index === index ? { ...p, selected: !p.selected } : p));
  };

  const handleAiNaming = async () => {
    if (images.length === 0) return;
    setAiNaming(true);
    try {
      const getBase64 = async (url: string): Promise<string> => {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(blob);
        });
      };
      const base64Data = await getBase64(images[0].previewUrl);
      const suggestion = await suggestFilename([{ data: base64Data, mimeType: images[0].file.type }]);
      setSettings(prev => ({ ...prev, filename: suggestion }));
    } catch (e) { console.error(e); } finally { setAiNaming(false); }
  };

  const renderWorkArea = () => {
    if (view === 'IMAGE_TO_PDF') {
      return images.length === 0 ? (
        <DropZone onClick={() => fileInputRef.current?.click()} label="Drop your JPGs here" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((img, idx) => (
            <ImageCard key={img.id} image={img} index={idx} onRemove={(id) => setImages(prev => prev.filter(x => x.id !== id))} onRotate={(id) => setImages(prev => prev.map(x => x.id === id ? {...x, rotation: (x.rotation + 90) % 360} : x))} />
          ))}
          <AddMoreButton onClick={() => fileInputRef.current?.click()} />
        </div>
      );
    }

    if (view === 'PDF_SPLIT' || view === 'PDF_TO_IMAGE') {
      return !processingFile ? (
        <DropZone onClick={() => fileInputRef.current?.click()} label="Upload PDF to process" accept="application/pdf" />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Document Pages</h2>
            <div className="flex space-x-2">
               <button onClick={() => setPagePreviews(prev => prev.map(p => ({...p, selected: true})))} className="text-[10px] font-bold text-indigo-600 hover:underline">Select All</button>
               <button onClick={() => setPagePreviews(prev => prev.map(p => ({...p, selected: false})))} className="text-[10px] font-bold text-red-500 hover:underline">Deselect All</button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pagePreviews.map((p) => (
              <div key={p.index} onClick={() => togglePageSelection(p.index)} className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${p.selected ? 'border-indigo-500 scale-[0.98]' : 'border-transparent hover:border-gray-200'}`}>
                <img src={p.dataUrl} className={`w-full h-auto ${!p.selected && 'opacity-50 grayscale'}`} />
                <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-md">P{p.index + 1}</div>
                {p.selected && <div className="absolute top-2 right-2 bg-indigo-500 text-white p-1 rounded-full"><CheckCircle2 className="w-3 h-3" /></div>}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (view === 'PDF_MERGE') {
      return selectedPdfs.length === 0 ? (
        <DropZone onClick={() => fileInputRef.current?.click()} label="Upload multiple PDFs to merge" accept="application/pdf" multiple />
      ) : (
        <div className="space-y-4">
          {selectedPdfs.map((file, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between group">
              <div className="flex items-center space-x-4">
                <div className="bg-indigo-50 p-3 rounded-lg"><FileSearch className="w-5 h-5 text-indigo-500" /></div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button onClick={() => setSelectedPdfs(prev => prev.filter((_, i) => i !== idx))} className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          <AddMoreButton onClick={() => fileInputRef.current?.click()} />
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen pb-20 pt-24 bg-slate-50">
      <Header currentView={view} setView={setView} />
      
      <main className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {view === 'IMAGE_TO_PDF' && 'Image to PDF'}
                {view === 'PDF_TO_IMAGE' && 'PDF to Image'}
                {view === 'PDF_SPLIT' && 'PDF Splitter'}
                {view === 'PDF_MERGE' && 'PDF Merger'}
              </h1>
              <p className="text-sm text-gray-500">Professional tool powered by SnapPDF Engine.</p>
            </div>
          </div>

          {status === AppStatus.PROCESSING ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-4">
               <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
               <p className="text-gray-500 font-medium animate-pulse">Rendering document pages...</p>
            </div>
          ) : renderWorkArea()}

          <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple={view === 'PDF_MERGE' || view === 'IMAGE_TO_PDF'} accept={view === 'IMAGE_TO_PDF' ? "image/*" : "application/pdf"} className="hidden" />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xl shadow-indigo-100/20 sticky top-24">
            <div className="flex items-center space-x-2 mb-6">
              <Settings2 className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-gray-800">Workspace Settings</h2>
            </div>

            <div className="space-y-5">
              {view === 'IMAGE_TO_PDF' ? (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">File Name</label>
                      <button disabled={images.length === 0 || aiNaming} onClick={handleAiNaming} className="flex items-center space-x-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-50">
                        {aiNaming ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        <span>AI Suggest</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input type="text" value={settings.filename} onChange={(e) => setSettings({...settings, filename: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">.pdf</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Page Size</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['a4', 'letter'].map(s => <button key={s} onClick={() => setSettings({...settings, pageSize: s as any})} className={`py-2 text-xs font-bold rounded-xl border transition-all ${settings.pageSize === s ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-gray-200 text-gray-600'}`}>{s.toUpperCase()}</button>)}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    {view === 'PDF_SPLIT' && 'Select the pages you want to keep. We will generate a new PDF document containing only your selected pages.'}
                    {view === 'PDF_MERGE' && 'Add multiple PDF files to combine them into a single high-quality document. Drag to reorder coming soon.'}
                    {view === 'PDF_TO_IMAGE' && 'Convert your PDF pages into high-resolution PNG images directly in your browser.'}
                  </p>
                </div>
              )}

              <div className="pt-4">
                <button 
                  disabled={(view === 'IMAGE_TO_PDF' && images.length === 0) || (view === 'PDF_MERGE' && selectedPdfs.length === 0) || ((view === 'PDF_SPLIT' || view === 'PDF_TO_IMAGE') && !processingFile) || status === AppStatus.DOWNLOADING}
                  onClick={handleAction}
                  className={`w-full py-4 rounded-2xl flex items-center justify-center space-x-3 text-white font-bold transition-all shadow-xl ${
                    status === AppStatus.DOWNLOADING ? 'bg-indigo-400' : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-indigo-200 hover:-translate-y-1 active:scale-95 disabled:bg-gray-300 disabled:shadow-none'
                  }`}
                >
                  {status === AppStatus.DOWNLOADING ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Processing...</span></> : (
                    <>
                      {view === 'IMAGE_TO_PDF' && <Download className="w-5 h-5" />}
                      {view === 'PDF_SPLIT' && <Scissors className="w-5 h-5" />}
                      {view === 'PDF_MERGE' && <Layers className="w-5 h-5" />}
                      {view === 'PDF_TO_IMAGE' && <FileDown className="w-5 h-5" />}
                      <span>{view === 'PDF_TO_IMAGE' ? 'Export as PNG' : 'Process & Download'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex items-start space-x-3">
             <div className="bg-indigo-100 p-2 rounded-lg mt-0.5"><CheckCircle2 className="w-4 h-4 text-indigo-600" /></div>
             <div><h3 className="text-sm font-bold text-indigo-900">Privacy First</h3><p className="text-xs text-indigo-700/70 mt-1">All processing happens locally. Your files never leave your device.</p></div>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-100 py-3 text-center">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Designed with Precision &copy; SnapPDF Pro v3.0</p>
      </footer>
    </div>
  );
};

// UI Sub-components for cleaner code
const DropZone = ({ onClick, label, accept = "image/*", multiple = false }: any) => (
  <div onClick={onClick} className="border-2 border-dashed border-gray-300 rounded-3xl p-12 flex flex-col items-center justify-center space-y-4 bg-white hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer group">
    <div className="bg-indigo-100 p-6 rounded-full group-hover:scale-110 transition-transform"><Upload className="w-10 h-10 text-indigo-600" /></div>
    <div className="text-center"><p className="text-lg font-bold text-gray-700">{label}</p><p className="text-sm text-gray-400">or click to browse from your device</p></div>
  </div>
);

const AddMoreButton = ({ onClick }: any) => (
  <button onClick={onClick} className="aspect-[3/4] border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all">
    <Plus className="w-8 h-8 mb-1" />
    <span className="text-xs font-bold uppercase tracking-tight">Add More</span>
  </button>
);

export default App;
