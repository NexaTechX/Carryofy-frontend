import { useState } from 'react';
import { ZoomIn, ZoomOut, Download, X, FileText, ExternalLink } from 'lucide-react';

interface DocumentViewerProps {
  idImage: string;
  addressProofImage?: string;
  idType: string;
  idNumber: string;
  businessType: string;
  registrationNumber?: string;
  taxId?: string;
  bvn?: string;
  onClose?: () => void;
}

// Helper to check if URL is a PDF (checks both extension and Cloudinary raw/pdf paths)
const isPdfUrl = (url: string): boolean => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.includes('.pdf') ||
    lowerUrl.includes('/raw/upload/') || // Cloudinary raw uploads are often PDFs
    lowerUrl.includes('resource_type=raw')
  );
};

// Helper to check if URL is likely an image
const isImageUrl = (url: string): boolean => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.includes('/image/upload/') ||
    lowerUrl.includes('.jpg') ||
    lowerUrl.includes('.jpeg') ||
    lowerUrl.includes('.png') ||
    lowerUrl.includes('.webp') ||
    lowerUrl.includes('.gif')
  );
};

// Get file extension for download
const getFileExtension = (url: string): string => {
  if (isPdfUrl(url) && !isImageUrl(url)) return 'pdf';
  if (url.includes('.png')) return 'png';
  return 'jpg';
};

export default function DocumentViewer({
  idImage,
  addressProofImage,
  idType,
  idNumber,
  businessType,
  registrationNumber,
  taxId,
  bvn,
  onClose,
}: DocumentViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Download by fetching the file and creating a blob
  const handleDownload = async (url: string, filename: string) => {
    try {
      // For Cloudinary URLs, we can add fl_attachment to force download
      let downloadUrl = url;
      if (url.includes('cloudinary.com')) {
        // Add fl_attachment transformation for Cloudinary
        downloadUrl = url.replace('/upload/', '/upload/fl_attachment/');
      }
      
      // Open in new tab - this works better for cross-origin files
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  const handleImageClick = (url: string) => {
    setSelectedImage(url);
    setZoom(1);
  };

  const handleImageError = (url: string) => {
    setImageErrors(prev => ({ ...prev, [url]: true }));
  };

  const ImagePreview = ({ url, title }: { url: string; title: string }) => {
    const isPdf = isPdfUrl(url) && !isImageUrl(url);
    const hasError = imageErrors[url];
    const ext = getFileExtension(url);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-300">{title}</h4>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleDownload(url, `${title.toLowerCase().replace(/\s+/g, '-')}.${ext}`)}
              className="p-1.5 rounded border border-[#2a2a2a] hover:bg-[#0f1419] transition"
              title="Download"
            >
              <Download className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        <div
          className="relative border border-[#2a2a2a] rounded-lg overflow-hidden bg-[#0f1419] cursor-pointer group"
          onClick={() => !isPdf && !hasError && handleImageClick(url)}
        >
          {isPdf || hasError ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-400 text-sm mb-2">
                {hasError ? 'Unable to preview document' : 'PDF Document'}
              </p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3" />
                Open Document
              </a>
            </div>
          ) : (
            <img
              src={url}
              alt={title}
              className="w-full h-auto max-h-64 object-contain"
              onError={() => handleImageError(url)}
            />
          )}
          {!isPdf && !hasError && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
              <ZoomIn className="w-8 h-8 text-white" />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* KYC Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">KYC Information</h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 mb-1">
                Business Type
              </p>
              <p className="text-white">{businessType}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 mb-1">
                ID Type
              </p>
              <p className="text-white">{idType}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 mb-1">
                ID Number
              </p>
              <p className="text-white font-mono">{idNumber}</p>
            </div>
            {registrationNumber && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 mb-1">
                  Registration Number
                </p>
                <p className="text-white">{registrationNumber}</p>
              </div>
            )}
            {taxId && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 mb-1">
                  Tax ID
                </p>
                <p className="text-white">{taxId}</p>
              </div>
            )}
            {bvn && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 mb-1">
                  BVN
                </p>
                <p className="text-white font-mono">{bvn}</p>
              </div>
            )}
          </div>
        </div>

        {/* Documents */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">Documents</h3>
          
          <ImagePreview url={idImage} title={`${idType} Document`} />
          
          {addressProofImage && (
            <ImagePreview url={addressProofImage} title="Address Proof" />
          )}
        </div>
      </div>

      {/* Full Screen Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition z-10"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <div className="flex items-center gap-4 mb-4">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom(Math.min(zoom + 0.25, 3));
                }}
                className="p-2 bg-black/50 rounded hover:bg-black/70 transition"
                disabled={zoom >= 3}
              >
                <ZoomIn className="w-5 h-5 text-white" />
              </button>
              <span className="text-white text-sm">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom(Math.max(zoom - 0.25, 0.5));
                }}
                className="p-2 bg-black/50 rounded hover:bg-black/70 transition"
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="w-5 h-5 text-white" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(selectedImage, `document.${getFileExtension(selectedImage)}`);
                }}
                className="p-2 bg-black/50 rounded hover:bg-black/70 transition"
              >
                <Download className="w-5 h-5 text-white" />
              </button>
            </div>
            <img
              src={selectedImage}
              alt="Document"
              className="max-w-full max-h-[80vh] object-contain"
              style={{ transform: `scale(${zoom})` }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}

