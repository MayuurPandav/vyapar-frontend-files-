import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X } from 'lucide-react';

const BarcodeScannerCamera = ({ onScan, onError, onClose }) => {
  const scannerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    let html5QrCode = null;
    let startTimeout = null;
    const scannerId = 'barcode-scanner-' + Date.now();
    
    startTimeout = setTimeout(() => {
      if (!isMounted) return;

      // Create the scanner container div
      if (containerRef.current) {
        const scannerDiv = document.createElement('div');
        scannerDiv.id = scannerId;
        containerRef.current.appendChild(scannerDiv);
      }

      html5QrCode = new Html5Qrcode(scannerId);
      scannerRef.current = html5QrCode;

      html5QrCode
        .start(
          { facingMode: 'environment' }, // Use rear camera
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.5,
          },
          (decodedText) => {
            // On successful scan
            if (html5QrCode && html5QrCode.isScanning) {
              html5QrCode.stop().then(() => {
                onScan(decodedText);
              }).catch(() => {
                onScan(decodedText);
              });
            }
          },
          (errorMessage) => {
            // Ignore scan-miss errors (they fire constantly)
          }
        )
        .then(() => {
          // If the component was unmounted before start finished resolving, stop scanning immediately
          if (!isMounted) {
            if (html5QrCode.isScanning) {
              html5QrCode.stop().then(() => {
                html5QrCode.clear();
              }).catch(() => {});
            } else {
              try {
                html5QrCode.clear();
              } catch (e) {}
            }
          }
        })
        .catch((err) => {
          console.error('Camera start error:', err);
          if (isMounted && onError) onError(err);
        });
    }, 100);

    return () => {
      isMounted = false;
      if (startTimeout) {
        clearTimeout(startTimeout);
      }
      if (html5QrCode) {
        if (html5QrCode.isScanning) {
          html5QrCode.stop().then(() => {
            try {
              html5QrCode.clear();
            } catch (e) {}
          }).catch(() => {});
        } else {
          try {
            html5QrCode.clear();
          } catch (e) {}
        }
      }
    };
  }, []);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-slate-700">📷 Camera Scanner</h4>
        <button
          onClick={() => {
            if (scannerRef.current && scannerRef.current.isScanning) {
              scannerRef.current.stop().catch(() => {});
            }
            if (onClose) onClose();
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-600 transition"
        >
          <X className="h-4 w-4" /> Close Camera
        </button>
      </div>
      <div
        ref={containerRef}
        className="overflow-hidden rounded-xl"
        style={{ maxWidth: 400, margin: '0 auto' }}
      />
      <p className="mt-3 text-center text-xs text-slate-500">
        Point your camera at a barcode. It will be detected automatically.
      </p>
    </div>
  );
};

export default BarcodeScannerCamera;
