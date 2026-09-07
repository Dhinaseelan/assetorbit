import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { Asset } from '../types';
import { QrCode, X, Printer, Camera, Search, CheckCircle2, AlertTriangle, VideoOff, Sparkles, Volume2 } from 'lucide-react';

interface QRModalProps {
  isOpen: boolean;
  asset: Asset | null;
  assets?: Asset[];
  onClose: () => void;
  onSelectScannedAsset?: (asset: Asset) => void;
}

export const QRModal: React.FC<QRModalProps> = ({
  isOpen,
  asset,
  assets = [],
  onClose,
  onSelectScannedAsset
}) => {
  const [activeTab, setActiveTab] = useState<'view' | 'scan'>(asset ? 'view' : 'scan');
  const [simulatedCode, setSimulatedCode] = useState('');
  const [scannedAssetResult, setScannedAssetResult] = useState<Asset | null>(null);
  const [lastScannedRawText, setLastScannedRawText] = useState<string | null>(null);

  // Live Camera WebRTC & Decoding State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastDetectionRef = useRef<{ value: string; time: number } | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (asset) {
      setActiveTab('view');
    } else {
      setActiveTab('scan');
    }
    if (isOpen) {
      setScannedAssetResult(null);
      setLastScannedRawText(null);
      setSimulatedCode('');
      lastDetectionRef.current = null;
    }
  }, [asset, isOpen]);

  // Audio Beep generator for successful QR detection
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880 Hz tone
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {}
  };

  // Process a detected raw string from QR code / Barcode
  const handleRawCodeDetected = (rawText: string) => {
    const normalizedRawText = rawText.trim();
    if (!normalizedRawText) return;

    const now = Date.now();
    const lastDetection = lastDetectionRef.current;
    if (
      lastDetection &&
      lastDetection.value === normalizedRawText &&
      now - lastDetection.time < 2000
    ) {
      return;
    }
    lastDetectionRef.current = { value: normalizedRawText, time: now };

    // Generated labels use "Assetorbit:<organization>:<asset tag>:<serial>".
    // Older labels may omit the organization, while manual scanners may return
    // only an asset tag or serial number.
    setLastScannedRawText(normalizedRawText);
    playBeep();

    const parts = normalizedRawText.split(':').map(part => part.trim()).filter(Boolean);
    const candidates = parts[0]?.toLowerCase() === 'assetorbit'
      ? parts.slice(1)
      : parts;
    candidates.push(normalizedRawText);
    const normalizedCandidates = new Set(candidates.map(value => value.toLowerCase()));

    const matchedAsset = assets.find(
      a => normalizedCandidates.has(a.assetTag.trim().toLowerCase()) ||
           normalizedCandidates.has(a.serialNumber.trim().toLowerCase())
    );

    if (matchedAsset) {
      setScannedAssetResult(matchedAsset);
    } else {
      // Fallback first asset if tag matches, or keep raw string display
      setScannedAssetResult(null);
    }
  };

  // Continuous Camera Frame Scanning Loop
  const startScanningLoop = () => {
    if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);

    const scanFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');
      canvasRef.current = canvas;

      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // 1. Try jsQR decode on image frame
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth'
          });

          if (code && code.data) {
            handleRawCodeDetected(code.data);
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(scanFrame);
    };

    animFrameIdRef.current = requestAnimationFrame(scanFrame);
  };

  // Handle Camera initialization & cleanup
  useEffect(() => {
    let isMounted = true;

    async function startCamera() {
      if (!isOpen || activeTab !== 'scan') {
        stopCamera();
        return;
      }

      setCameraError(null);
      setIsScanning(true);

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access API is not supported on this browser.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        setCameraActive(true);

        // Start continuous image decoding loop
        startScanningLoop();
      } catch (err: any) {
        console.warn('Camera access issue:', err);
        if (isMounted) {
          setCameraActive(false);
          setIsScanning(false);
          setCameraError(
            err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
              ? 'Camera permission denied. Please allow camera access in browser settings.'
              : err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError'
              ? 'No camera device detected on this computer.'
              : err.message || 'Unable to start live camera video feed.'
          );
        }
      }
    }

    if (isOpen && activeTab === 'scan') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const stopCamera = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsScanning(false);
  };

  const handleCloseModal = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedCode) return;
    handleRawCodeDetected(simulatedCode);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <QrCode className="h-5 w-5 text-brand-400" />
            <h3 className="text-sm font-bold text-white">Asset Barcode & QR Center</h3>
          </div>
          <button onClick={handleCloseModal} className="p-1 rounded-lg text-slate-400 hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 border-b border-slate-800 pb-2">
          {asset && (
            <button
              onClick={() => setActiveTab('view')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 ${
                activeTab === 'view' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>Asset QR Label</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('scan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 ${
              activeTab === 'scan' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Live Camera Scanner</span>
          </button>
        </div>

        {/* Tab 1: Asset QR Code Label */}
        {activeTab === 'view' && asset && (
          <div className="space-y-4 text-center py-2">
            <div className="bg-white p-6 rounded-2xl inline-block shadow-xl border-4 border-slate-200">
              {asset.qrCodeUrl ? (
                <img src={asset.qrCodeUrl} alt={`QR for ${asset.assetTag}`} className="h-44 w-44 mx-auto" />
              ) : (
                <div className="h-44 w-44 bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-mono">
                  [QR Code]
                </div>
              )}
              <div className="mt-2 pt-2 border-t border-slate-200">
                <p className="text-sm font-extrabold text-slate-900 tracking-wider font-mono">{asset.assetTag}</p>
                <p className="text-[10px] text-slate-600 font-semibold">{asset.name}</p>
                <p className="text-[9px] text-slate-400 font-mono">S/N: {asset.serialNumber}</p>
              </div>
            </div>

            <div className="text-xs text-slate-400">
              <p>Scan printable label with any camera or scanner device.</p>
            </div>

            <div className="pt-2 flex items-center justify-center space-x-3">
              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center space-x-2"
              >
                <Printer className="h-4 w-4 text-brand-400" />
                <span>Print Asset Tag Label</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Live Camera Optical Decoder View */}
        {activeTab === 'scan' && (
          <div className="space-y-4 py-1">
            {/* Camera Viewport Container */}
            <div className="relative h-64 w-full rounded-2xl bg-slate-950 border-2 border-slate-800 overflow-hidden flex items-center justify-center">
              {/* Real Video Stream Element */}
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              />

              {/* Scanning Laser Overlay when camera is active */}
              {cameraActive && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-4">
                  <div className="w-full flex justify-between text-[10px] font-mono text-emerald-400 font-bold bg-slate-950/70 px-3 py-1 rounded-lg backdrop-blur-sm">
                    <span className="flex items-center space-x-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>REAL-TIME QR DECODER ACTIVE</span>
                    </span>
                    <span>jsQR Optical Motor</span>
                  </div>

                  {/* Scanning Frame Reticle */}
                  <div className="relative w-52 h-40 border-2 border-dashed border-emerald-400/90 rounded-2xl flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.35)]">
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-bounce shadow-lg shadow-emerald-400/90" />
                  </div>

                  <p className="text-[11px] font-medium text-slate-200 bg-slate-950/80 px-3.5 py-1 rounded-lg backdrop-blur-sm">
                    Hold physical QR code or barcode up to camera
                  </p>
                </div>
              )}

              {/* Fallback Notice when Camera is Inactive or Permission Denied */}
              {!cameraActive && (
                <div className="p-6 text-center space-y-3">
                  {cameraError ? (
                    <div className="space-y-2">
                      <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto" />
                      <p className="text-xs font-bold text-slate-200">Camera Permission Required</p>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                        {cameraError}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <VideoOff className="h-8 w-8 text-slate-500 mx-auto animate-pulse" />
                      <p className="text-xs font-bold text-slate-300">Starting Camera Hardware...</p>
                      <p className="text-[11px] text-slate-500">Requesting WebRTC video permissions...</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Manual Code / Tag Lookup Search Bar */}
            <form onSubmit={handleManualSearch} className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Enter Tag (e.g. AST-1001) or S/N..."
                  value={simulatedCode}
                  onChange={e => setSimulatedCode(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/30"
              >
                Scan Code
              </button>
            </form>

            {/* Real-time Decoded Asset Card */}
            {scannedAssetResult ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Asset Matched from Optical Feed!</span>
                  </div>
                  <Volume2 className="h-4 w-4 text-emerald-400 animate-pulse" />
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-white text-sm">{scannedAssetResult.name}</p>
                  <p className="text-slate-300 font-mono text-[11px]">
                    Tag: <strong className="text-emerald-300">{scannedAssetResult.assetTag}</strong> | S/N: {scannedAssetResult.serialNumber}
                  </p>
                  <p className="text-slate-400">
                    Category: {scannedAssetResult.category} | Status: <span className="text-emerald-300 font-bold">{scannedAssetResult.status}</span>
                  </p>
                </div>
                {onSelectScannedAsset && (
                  <button
                    onClick={() => {
                      onSelectScannedAsset(scannedAssetResult);
                      handleCloseModal();
                    }}
                    className="w-full mt-2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all"
                  >
                    Open Asset Details & Lifecycle Timeline
                  </button>
                )}
              </div>
            ) : lastScannedRawText ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium space-y-1">
                <p className="font-bold">Raw QR Code Scanned:</p>
                <p className="font-mono text-[11px] text-slate-200">{lastScannedRawText}</p>
                <p className="text-[10px] text-amber-400 font-normal">No registered inventory item matched this code in the database.</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
