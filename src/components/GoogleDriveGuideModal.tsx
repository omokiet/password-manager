import React from 'react';
import { AlertTriangle, ExternalLink, ShieldCheck, X } from 'lucide-react';

interface GoogleDriveGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const GoogleDriveGuideModal: React.FC<GoogleDriveGuideModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-zinc-100">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors hover:bg-zinc-800"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">
              Hướng dẫn xác thực Google Drive
            </h3>
            <p className="text-xs text-zinc-400">
              Cách vượt qua màn hình cảnh báo "Ứng dụng chưa xác minh"
            </p>
          </div>
        </div>

        <div className="space-y-3.5 mb-6 text-sm text-zinc-300">
          <div className="p-3 bg-zinc-800/60 border border-zinc-700/50 rounded-xl flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-xs text-zinc-300 leading-relaxed">
              <strong className="text-emerald-400">Cam kết Zero-Knowledge:</strong> Dữ liệu sao lưu được mã hóa 100% bằng AES-256-GCM trước khi gửi. Google chỉ nhận file nhị phân mã hóa và không thể đọc mật khẩu của bạn.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
              Các bước thực hiện trên trình duyệt:
            </p>
            <ol className="space-y-2 text-xs">
              <li className="flex items-start gap-2 bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-800">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 font-bold text-[11px] shrink-0">1</span>
                <span>Chọn tài khoản Google của bạn trên tab trình duyệt vừa mở.</span>
              </li>
              <li className="flex items-start gap-2 bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-800">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 font-bold text-[11px] shrink-0">2</span>
                <span>Khi thấy thông báo <em>"Google chưa xác minh ứng dụng này"</em>, hãy bấm liên kết <strong>Nâng cao (Advanced)</strong> ở góc dưới bên trái.</span>
              </li>
              <li className="flex items-start gap-2 bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-800">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 font-bold text-[11px] shrink-0">3</span>
                <span>Bấm <strong>Đi tới Password Manager (không an toàn)</strong> rồi chọn <strong>Tiếp tục</strong> để cấp quyền lưu trữ bản sao lưu.</span>
              </li>
            </ol>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Đang chờ đăng nhập...</span>
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4" />
                <span>Đã hiểu, mở trình duyệt đăng nhập</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleDriveGuideModal;

