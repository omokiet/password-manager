import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { X, QrCode, Camera, Upload, Check, AlertCircle } from 'lucide-react';
import { PasswordEntry } from '../types';
import { encryptEntryPayload, decryptEntryPayload } from '../utils/qrCrypto';

interface Props {
  mode: 'export' | 'import';
  entry?: PasswordEntry | null;
  onClose: () => void;
  onImportEntry?: (entry: Partial<PasswordEntry>) => Promise<void>;
}

export default function QrTransferModal({ mode, entry, onClose, onImportEntry }: Props) {
  const [pin, setPin] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isScanningCamera, setIsScanningCamera] = useState(false);
  const [scannedPayload, setScannedPayload] = useState('');
  const [inputPin, setInputPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Export mode: Generate random PIN and encrypted QR
  useEffect(() => {
    if (mode === 'export' && entry) {
      const generatedPin = Math.floor(1000 + Math.random() * 9000).toString();
      setPin(generatedPin);

      encryptEntryPayload(entry, generatedPin)
        .then((payload) => QRCode.toDataURL(payload, { width: 280, margin: 2 }))
        .then((url) => setQrDataUrl(url))
        .catch((err) => setErrorMsg(err.message));
    }
  }, [mode, entry]);

  // Import mode: Camera scanning loop
  const startCamera = async () => {
    try {
      setErrorMsg('');
      setIsScanningCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        scanVideoFrame();
      }
    } catch (err: any) {
      setIsScanningCamera(false);
      setErrorMsg('Không thể mở camera: ' + (err.message || 'Thiết bị không hỗ trợ'));
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanningCamera(false);
  };

  const scanVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && code.data) {
        stopCamera();
        setScannedPayload(code.data);
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            setScannedPayload(code.data);
          } else {
            setErrorMsg('Không tìm thấy mã QR hợp lệ trong ảnh');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDecryptAndImport = async () => {
    if (!inputPin || inputPin.length < 4) {
      setErrorMsg('Vui lòng nhập mã PIN 4 chữ số');
      return;
    }

    try {
      setErrorMsg('');
      const decryptedEntry = await decryptEntryPayload(scannedPayload, inputPin);
      if (onImportEntry) {
        await onImportEntry(decryptedEntry);
        setSuccessMsg(`Đã nhập thành công mục: ${decryptedEntry.title}`);
        setTimeout(() => onClose(), 1200);
      }
    } catch (err: any) {
      setErrorMsg('Mã PIN không chính xác hoặc dữ liệu QR bị hỏng');
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200 p-4">
      <div className="w-full max-w-sm bg-[#111] border border-white/10 rounded-3xl p-6 shadow-2xl relative flex flex-col items-center">
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-white">
          <QrCode size={20} />
        </div>

        <h3 className="text-xl font-medium text-white mb-2">
          {mode === 'export' ? 'Chia sẻ mã QR mã hóa' : 'Quét mã QR để nhận'}
        </h3>

        {errorMsg && (
          <div className="w-full mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="w-full mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <Check size={14} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {mode === 'export' && (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="p-3 bg-white rounded-2xl shadow-lg">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Mã QR mã hóa" className="w-56 h-56" />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-zinc-400 text-xs">Đang tạo...</div>
              )}
            </div>

            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3">
              <span className="text-xs text-zinc-400">Mã PIN một lần:</span>
              <span className="font-mono text-lg font-bold text-white tracking-widest">{pin}</span>
            </div>
            <p className="text-[11px] text-zinc-500 text-center">
              Dữ liệu được mã hóa AES-256-GCM. Thiết bị nhận cần quét mã và nhập đúng mã PIN này.
            </p>
          </div>
        )}

        {mode === 'import' && !scannedPayload && (
          <div className="flex flex-col items-center gap-4 w-full">
            {isScanningCamera ? (
              <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden border border-white/10">
                <video ref={videoRef} className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-8 border-2 border-dashed border-white/60 rounded-xl pointer-events-none animate-pulse" />
                <button 
                  onClick={stopCamera}
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs border border-white/10"
                >
                  Dừng Camera
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 w-full pt-2">
                <button 
                  onClick={startCamera}
                  className="w-full py-3.5 bg-white text-black font-medium rounded-full text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Camera size={16} /> Mở Camera để quét
                </button>

                <label className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-full text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors">
                  <Upload size={16} /> Chọn ảnh QR từ thiết bị
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            )}
          </div>
        )}

        {mode === 'import' && scannedPayload && (
          <div className="flex flex-col items-center gap-4 w-full pt-2">
            <p className="text-xs text-zinc-400 text-center">
              Đã nhận diện mã QR. Vui lòng nhập mã PIN gồm 4 số để giải mã:
            </p>
            <input 
              type="text" 
              maxLength={4}
              placeholder="PIN 4 số"
              value={inputPin}
              onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ''))}
              className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-center font-mono text-xl tracking-widest text-white focus:outline-none focus:border-white/20 w-40"
              autoFocus
            />
            <div className="flex gap-2 w-full justify-end pt-2">
              <button 
                onClick={() => setScannedPayload('')}
                className="px-5 py-2.5 rounded-full text-xs font-medium text-zinc-400 bg-white/5 hover:bg-white/10 transition-colors"
              >
                Quét lại
              </button>
              <button 
                onClick={handleDecryptAndImport}
                className="px-6 py-2.5 rounded-full text-xs font-medium text-black bg-white hover:bg-zinc-100 transition-colors"
              >
                Giải mã & Nhập
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
