import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Check, Barcode } from 'lucide-react';

const BarcodeScannerCamera = ({ onScan, onError, onClose }) => {
  const scannerRef = useRef(null);
  const containerRef = useRef(null);
  const [manualCode, setManualCode] = useState('');

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

      try {
        const formatsToSupport = [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE
        ];

        html5QrCode = new Html5Qrcode(scannerId, { formatsToSupport, verbose: false });
        scannerRef.current = html5QrCode;

        const scanConfig = {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const width = Math.min(Math.floor(viewfinderWidth * 0.88), 340);
            const height = Math.min(Math.floor(viewfinderHeight * 0.55), 180);
            return { width: Math.max(width, 220), height: Math.max(height, 100) };
          },
          aspectRatio: 1.33,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        };

        html5QrCode
          .start(
            { facingMode: 'environment' },
            scanConfig,
            (decodedText) => {
              if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().then(() => {
                  onScan(decodedText);
                }).catch(() => {
                  onScan(decodedText);
                });
              }
            },
            () => {} // Ignore continuous scan frame misses
          )
          .then(() => {
            if (!isMounted && html5QrCode) {
              if (html5QrCode.isScanning) {
                html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {});
              } else {
                try { html5QrCode.clear(); } catch (e) {}
              }
            }
          })
          .catch((err) => {
            console.warn('Primary camera error, trying fallback camera constraints...', err);
            // Fallback for laptops/desktops without environmental camera label
            if (isMounted && html5QrCode) {
              html5QrCode.start(
                { facingMode: 'user' },
                scanConfig,
                (decodedText) => {
                  if (html5QrCode && html5QrCode.isScanning) {
                    html5QrCode.stop().then(() => onScan(decodedText)).catch(() => onScan(decodedText));
                  }
                },
                () => {}
              ).catch((fallbackErr) => {
                console.error('Camera start failed:', fallbackErr);
                if (isMounted && onError) onError(fallbackErr);
              });
            }
          });
      } catch (e) {
        console.error('Html5Qrcode init error:', e);
      }
    }, 100);

    return () => {
      isMounted = false;
      if (startTimeout) clearTimeout(startTimeout);
      if (html5QrCode) {
        if (html5QrCode.isScanning) {
          html5QrCode.stop().then(() => {
            try { html5QrCode.clear(); } catch (e) {}
          }).catch(() => {});
        } else {
          try { html5QrCode.clear(); } catch (e) {}
        }
      }
    };
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().catch(() => {});
    }
    onScan(manualCode.trim());
  };

  return (
    <div style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '18px', padding: '16px', marginTop: '10px', maxWidth: '440px', width: '100%', color: '#f8fafc' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Barcode style={{ width: '16px', height: '16px', color: '#818cf8' }} /> High-Precision Barcode Scanner
        </h4>
        <button
          type="button"
          onClick={() => {
            if (scannerRef.current && scannerRef.current.isScanning) {
              scannerRef.current.stop().catch(() => {});
            }
            if (onClose) onClose();
          }}
          style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(248, 113, 113, 0.15)', border: '1px solid rgba(248, 113, 113, 0.3)', color: '#f87171', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <X style={{ width: '14px', height: '14px' }} /> Close
        </button>
      </div>

      <div
        ref={containerRef}
        style={{ overflow: 'hidden', borderRadius: '12px', maxWidth: '400px', margin: '0 auto', border: '1px solid rgba(255, 255, 255, 0.12)' }}
      />
      <p style={{ marginTop: '8px', textAlign: 'center', fontSize: '11px', color: '#94a3b8' }}>
        Hold product barcode close to camera. It will auto-detect.
      </p>

      {/* Manual Code Input Fallback */}
      <form onSubmit={handleManualSubmit} style={{ marginTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#c7d2fe', marginBottom: '6px' }}>
          Can't scan or camera blurry? Type code below:
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="e.g. 8901117083202"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none' }}
          />
          <button
            type="submit"
            style={{ padding: '8px 14px', borderRadius: '8px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Check style={{ width: '14px', height: '14px' }} /> Apply
          </button>
        </div>
      </form>
    </div>
  );
};

export default BarcodeScannerCamera;
