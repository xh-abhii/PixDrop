import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  CheckCircle,
  Copy,
  FileImage,
  X,
  Server,
  Cloud,
  Info,
  ExternalLink,
  AlertTriangle,
  Loader2,
  List,
  Trash2,
  Sparkles,
  ClipboardCheck
} from "lucide-react";

interface UploadedFile {
  id: string;
  url: string;
  name: string;
  timestamp: number;
  source: "cloudinary" | "local_storage";
}

interface ConfigStatus {
  cloudinaryConfigured: boolean;
  cloudName: string | null;
  fallbackToLocal: boolean;
}

export default function App() {
  // State for config status
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);

  // States for the current upload workflow
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [customSlug, setCustomSlug] = useState<string>("");
  const [selectedFileSize, setSelectedFileSize] = useState<string>("");
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Success state
  const [uploadResult, setUploadResult] = useState<{
    url: string;
    source: "cloudinary" | "local_storage";
    filename?: string;
  } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Client-side Session History list (saved in localStorage)
  const [history, setHistory] = useState<UploadedFile[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch server config on mount
  useEffect(() => {
    fetch("/api/config-status")
      .then((res) => res.json())
      .then((data: ConfigStatus) => {
        setConfigStatus(data);
      })
      .catch((err) => {
        console.error("Error reading configuration status", err);
      });
  }, []);

  // Hydrate local upload history from localStorage on mounting
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem("pizza_menu_upload_history");
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error("Could not parse saved uploading history", e);
    }
  }, []);

  // Helper helper to handle file selection and read as base64
  const handleFileSelection = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WEBP, GIF, SVG).");
      return;
    }

    // Limit client-side reading to reasonable sizes to prevent crashes (e.g. 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setError("Image file is too large. Please select an image under 15MB.");
      return;
    }

    setError(null);
    setSelectedFileName(file.name);
    // Suggest a neat, clean URL slug from the filename without extension
    const baseName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
    setCustomSlug(baseName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase());

    // Calculate human-readable size
    const sizeInKB = file.size / 1024;
    const formattedSize =
      sizeInKB > 1024
        ? `${(sizeInKB / 1024).toFixed(1)} MB`
        : `${sizeInKB.toFixed(0)} KB`;
    setSelectedFileSize(formattedSize);

    // Read as Base64 encoded string
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedFile(e.target?.result as string);
    };
    reader.onerror = () => {
      setError("Failed to read the image file. Please try another file.");
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  // Drag-and-drop mechanics
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
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Upload function targeting the API router
  const handleUpload = async () => {
    if (!selectedFile) {
      setError("No image has been loaded. Please drag in or choose a file first.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file: selectedFile,
          name: customSlug || "menu_item",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "An server failure occurred during upload.");
      }

      const result = {
        url: data.url,
        source: data.source as "cloudinary" | "local_storage",
        filename: data.filename,
      };

      setUploadResult(result);

      // Add to session / local history list
      const historyItem: UploadedFile = {
        id: Date.now().toString(),
        url: data.url,
        name: customSlug || selectedFileName,
        timestamp: Date.now(),
        source: data.source,
      };

      const updatedHistory = [historyItem, ...history];
      setHistory(updatedHistory);
      localStorage.setItem("pizza_menu_upload_history", JSON.stringify(updatedHistory));
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred. Please verify your connection.");
    } finally {
      setUploading(false);
    }
  };

  // Reset states to upload another file
  const handleReset = () => {
    setSelectedFile(null);
    setSelectedFileName("");
    setCustomSlug("");
    setSelectedFileSize("");
    setUploadResult(null);
    setError(null);
    setCopied(false);
  };

  // Direct clipboard feedback action
  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy url to clipboard", err);
      });
  };

  // Delete a single history record from user's client list
  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    localStorage.setItem("pizza_menu_upload_history", JSON.stringify(updated));
  };

  // Clear all storage records
  const clearAllHistory = () => {
    if (confirm("Are you sure you want to clear your local image history log?")) {
      setHistory([]);
      localStorage.removeItem("pizza_menu_upload_history");
    }
  };

  return (
    <div id="app" className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans selection:bg-orange-100 selection:text-orange-900 pb-16">
      {/* Decorative Warm Top Line */}
      <div className="h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 w-full" />

      <main className="max-w-4xl mx-auto px-4 pt-10 sm:pt-14">
        {/* Crisp Header */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border border-orange-100">
            <Sparkles className="w-3.5 h-3.5" /> Image Link Generator
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 mb-3 font-sans">
            Image Link Uploader
          </h1>
          <p className="text-slate-600 text-sm max-w-lg leading-relaxed">
            Drag, preview, and instantly upload high-resolution pizza images or food assets to retrieve
            clean, direct image links perfectly suited for embed scripts or cafe website menu displays.
          </p>
        </div>

        {/* Server State Indicator Badge */}
        {configStatus && (
          <div className="mb-8 max-w-xl mx-auto">
            {configStatus.cloudinaryConfigured ? (
              <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-emerald-800 text-xs shadow-xs">
                <Cloud className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-emerald-950 flex items-center gap-1.5 text-sm">
                    Cloudinary Storage System Active
                  </div>
                  <p className="text-emerald-700/90 leading-relaxed mt-0.5">
                    Images are securely processed server-side and hosted permanently on your Cloudinary cloud 
                    (<span className="font-mono bg-emerald-100/60 px-1 rounded text-emerald-950">{configStatus.cloudName}</span>).
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5 bg-amber-50 border border-amber-200/80 p-4.5 rounded-xl text-amber-800 text-xs shadow-xs">
                <div className="flex items-start gap-3">
                  <Server className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-amber-950 flex items-center gap-1.5 text-sm">
                      Running in Local Host Mode (Sandbox)
                    </div>
                    <p className="text-amber-800/90 leading-relaxed mt-0.5 mb-1.5">
                      Your Cloudinary parameters are configured with default placeholders. All uploads will compile and store
                      locally inside the filesystem container (<span className="font-mono bg-amber-100 px-1 rounded text-amber-950">/uploads/*</span>) which allows you to inspect them immediately!
                    </p>
                  </div>
                </div>

                <div className="border-t border-amber-200/50 pt-3">
                  <div className="font-semibold text-slate-800 flex items-center gap-1 mb-1 font-mono uppercase tracking-wider text-[10px]">
                    <Info className="w-3 h-3 text-amber-600" /> Easy 1-Minute Cloudinary Setup:
                  </div>
                  <ol className="list-decimal list-inside pl-1 text-[11px] text-slate-600 space-y-1">
                    <li>Open Cloud Run variable settings or edit the locally generated <code className="bg-slate-100/80 px-1 rounded font-mono select-all">.env</code> configurations.</li>
                    <li>Define <code className="font-semibold text-slate-800">CLOUDINARY_CLOUD_NAME</code> with your true Cloudinary account identifier.</li>
                    <li>Provide your API Key & Secret (loaded into placeholders dynamically). Then, restart.</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Central Card Block */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden max-w-xl mx-auto transition-all">
          
          {/* Work Stage: Setup or Selected File Area */}
          {!uploadResult ? (
            <div className="p-6">
              
              {/* Image Input Selection Area */}
              <div
                id="drop-zone"
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={selectedFile ? undefined : triggerFileSelect}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                  dragActive
                    ? "border-orange-500 bg-orange-50/50"
                    : selectedFile
                    ? "border-slate-200 hover:bg-slate-50/20"
                    : "border-slate-300 hover:border-orange-400 hover:bg-slate-50/40"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleInputChange}
                  className="hidden"
                />

                {selectedFile ? (
                  /* Current Select Status with Small Layout Thumbnail */
                  <div className="w-full flex flex-col items-center">
                    <div className="relative group max-w-xs overflow-hidden rounded-lg border border-slate-200 shadow-xs mb-4">
                      <img
                        src={selectedFile}
                        alt="Preview of menu item upload"
                        className="max-h-48 w-auto object-contain bg-slate-50"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReset();
                        }}
                        className="absolute top-1.5 right-1.5 bg-slate-900/80 hover:bg-slate-950 text-white rounded-full p-1.5 shadow-sm transition-all text-xs"
                        title="Remove image"
                        type="button"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full font-mono max-w-full">
                      <FileImage className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate max-w-[140px] sm:max-w-xs">{selectedFileName}</span>
                      <span className="text-slate-400">({selectedFileSize})</span>
                    </div>
                  </div>
                ) : (
                  /* Unselected State Prompt */
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mb-4 transition-all">
                      <UploadCloud className="w-6 h-6 animate-pulse" />
                    </div>
                    <span className="text-sm font-semibold text-slate-800">
                      Drag & Drop your menu image here
                    </span>
                    <span className="text-xs text-slate-400 mt-1">
                      or click to explore files from your computing device
                    </span>
                    <span className="text-[10px] text-slate-400 mt-4 bg-slate-100 px-2 py-0.5 rounded">
                      Supports JPG, PNG, WEBP up to 15MB
                    </span>
                  </div>
                )}
              </div>

              {/* Error Segment */}
              {error && (
                <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-100 p-3.5 rounded-xl text-red-800 text-xs">
                  <AlertTriangle className="w-4.5 h-4.5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold block mb-0.5">Upload Action Interrupted</span>
                    {error}
                  </div>
                </div>
              )}

              {/* Advanced Parameters: Filename custom slugs */}
              {selectedFile && (
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <label htmlFor="slug-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Direct Link Slug Name (Recommended for Menu Web-SEO)
                  </label>
                  <div className="flex items-center">
                    <span className="bg-slate-100 text-slate-500 border border-r-0 border-slate-200 text-xs px-3 py-2 rounded-l-lg font-mono">
                      {configStatus?.cloudinaryConfigured ? "pizza_cafe_menu/" : "uploads/"}
                    </span>
                    <input
                      id="slug-input"
                      type="text"
                      value={customSlug}
                      onChange={(e) => setCustomSlug(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                      placeholder="margherita_pizza_special"
                      className="flex-1 w-full border border-slate-200 px-3 py-2 text-xs rounded-r-lg font-mono text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1.5 block">
                    Use letters, numbers, and dashes. A high-quality filename increases menu discovery on web search.
                  </span>
                </div>
              )}

              {/* Action Upload Trigger */}
              {selectedFile && (
                <div className="mt-5">
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium text-sm py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading & generating direct link...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>Upload and Get Public Direct Link</span>
                      </>
                    )}
                  </button>
                </div>
              )}

            </div>
          ) : (
            
            /* Success State Results Panel */
            <div className="p-6">
              
              {/* Header Status Flag */}
              <div className="flex flex-col items-center text-center pb-5 mb-5 border-b border-slate-100">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle className="w-6 h-6 animate-bounce" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Image Asset Uploaded Successfully!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Stored on {uploadResult.source === "cloudinary" ? "Cloudinary Hosting CDN" : "Local Server Database Directory"}.
                </p>
              </div>

              {/* Dynamic Image Canvas Verification */}
              <div className="flex justify-center mb-6">
                <div className="relative group max-w-xs overflow-hidden rounded-xl border border-slate-100 shadow-sm bg-slate-50 p-1">
                  <img
                    src={uploadResult.url}
                    alt="Uploaded source verification"
                    className="max-h-52 w-auto object-contain rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center rounded-lg">
                    <a
                      href={uploadResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white bg-slate-900 border border-slate-700/80 text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-black transition-all"
                    >
                      Verify In New Tab <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Public Share URL Textbox Display */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Direct Embed Link (For Pizza Cafe Website Menu)
                </label>
                <div className="flex items-stretch shadow-xs rounded-xl overflow-hidden border border-slate-200">
                  <input
                    type="text"
                    readOnly
                    value={uploadResult.url}
                    className="flex-1 w-full bg-slate-50 text-slate-800 text-xs font-mono py-3 px-4.5 select-all focus:outline-none"
                    onClick={() => copyToClipboard(uploadResult.url)}
                  />
                  <button
                    onClick={() => copyToClipboard(uploadResult.url)}
                    className={`px-5 text-xs font-medium flex items-center gap-1.5 transition-all outline-none border-l border-slate-200 ${
                      copied
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {copied ? (
                      <>
                        <ClipboardCheck className="w-4 /4 text-white animate-scale" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 italic">
                  * Note: This direct link points to the exact static asset file ending in its formatted extension. Paste it in your HTML tag, like: <code className="bg-slate-100 px-1 rounded select-all font-mono">&lt;img src="{uploadResult.url.substring(0, 20)}..." /&gt;</code>
                </p>
              </div>

              {/* Work Stage Switch Button Grid */}
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 text-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm py-3 px-4 rounded-xl transition-all"
                >
                  Upload Another Image
                </button>
                <a
                  href={uploadResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center flex items-center justify-center gap-1.5 bg-orange-50 border border-orange-200 hover:bg-orange-100/60 text-orange-700 font-medium text-sm py-3 px-4 rounded-xl transition-all"
                >
                  <span>Verify Embed URL</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

            </div>
          )}

        </div>

        {/* Local Session History Logs */}
        <div className="max-w-xl mx-auto mt-7 text-center">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-slate-500 hover:text-orange-600 transition-all text-xs font-semibold inline-flex items-center gap-1.5 mx-auto bg-white border border-slate-200 rounded-full px-4.5 py-2 shadow-xs"
          >
            <List className="w-3.5 h-3.5" />
            <span>
              {showHistory ? "Hide Asset History Vault" : `Show Previous Uploads (${history.length})`}
            </span>
          </button>
        </div>

        {showHistory && (
          <div className="max-w-xl mx-auto mt-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                Session Link Storage
              </h4>
              {history.length > 0 && (
                <button
                  onClick={clearAllHistory}
                  className="text-slate-400 hover:text-red-500 text-xs font-medium flex items-center gap-1 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear Logs
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-8">
                No files uploaded recently. Your uploads will render here for quick subsequent reference copy actions!
              </p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 transition-all cursor-pointer group"
                    onClick={() => copyToClipboard(item.url)}
                  >
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-10 h-10 object-cover bg-slate-200 rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 text-xs font-semibold truncate font-sans">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono scale-95 origin-left truncate mt-0.5">
                        {item.url}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <button
                        title="Copy direct file link"
                        className="p-1.5 hover:bg-white hover:text-orange-500 border border-transparent hover:border-slate-200 rounded-lg group-hover:scale-105 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(item.url);
                        }}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Delete record from workspace list"
                        className="p-1.5 hover:bg-white hover:text-red-500 border border-transparent hover:border-slate-200 rounded-lg"
                        onClick={(e) => deleteHistoryItem(item.id, e)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
