import { useState } from 'react';
import {
  ArrowLeft, Home, ChevronDown,
  Lock, Unlock, Plus, Search, Activity, Settings,
  Star, KeyRound, Download, Trash2, ShieldCheck, Clipboard, Eye, Upload
} from 'lucide-react';

interface Props {
  onBack: () => void;
  onHome: () => void;
}

interface GuideSection {
  id: string;
  icon: React.ReactNode;
  title: string;
  color: string;
  borderColor: string;
  content: React.ReactNode;
}

export default function UserGuide({ onBack, onHome }: Props) {
  const [openId, setOpenId] = useState<string | null>('create-vault');

  const toggle = (id: string) => {
    setOpenId(prev => prev === id ? null : id);
  };

  const sections: GuideSection[] = [
    {
      id: 'create-vault',
      icon: <Lock size={18} />,
      title: '1. Lần đầu mở ứng dụng — Tạo Vault',
      color: 'bg-blue-500/10 text-blue-500',
      borderColor: 'border-blue-500/20',
      content: (
        <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
          <p>
            <strong className="text-white">Vault</strong> là "két sắt số" chứa toàn bộ mật khẩu của bạn.
            Khi mở ứng dụng lần đầu, bạn sẽ thấy màn hình <em>"Tạo Vault"</em>.
          </p>
          <div className="space-y-2">
            <p className="font-medium text-white">Các bước:</p>
            <ol className="list-decimal list-inside space-y-1.5 ml-1">
              <li>Nghĩ ra một <strong className="text-white">mật khẩu chủ</strong> (ít nhất 8 ký tự)</li>
              <li>Nhập mật khẩu chủ vào ô đầu tiên</li>
              <li>Nhập lại mật khẩu chủ vào ô "Xác nhận"</li>
              <li>Nhấn nút <strong className="text-white">Khởi tạo</strong></li>
            </ol>
          </div>
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 flex gap-3 items-start">
            <Trash2 size={16} className="mt-0.5 shrink-0 text-red-400" />
            <div>
              <p className="font-semibold text-red-400 mb-1">Quan trọng</p>
              <p>Ứng dụng <strong>không lưu</strong> mật khẩu chủ của bạn. Nếu bạn quên, <strong>toàn bộ dữ liệu sẽ mất vĩnh viễn</strong> và không có cách nào khôi phục. Hãy ghi nhớ thật kỹ hoặc viết ra giấy cất ở nơi an toàn.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'unlock-vault',
      icon: <Unlock size={18} />,
      title: '2. Mở khóa Vault hàng ngày',
      color: 'bg-emerald-500/10 text-emerald-500',
      borderColor: 'border-emerald-500/20',
      content: (
        <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
          <p>Mỗi lần mở ứng dụng, bạn cần nhập mật khẩu chủ để mở két sắt.</p>
          <div className="space-y-2">
            <ol className="list-decimal list-inside space-y-1.5 ml-1">
              <li>Nhập mật khẩu chủ</li>
              <li>Nhấn <strong className="text-white">Mở khóa</strong></li>
              <li>Nhấn biểu tượng <Eye size={12} className="inline -mt-0.5" /> bên phải ô mật khẩu để xem/ẩn nội dung đang gõ</li>
            </ol>
          </div>
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-300 flex gap-3 items-start">
            <Lock size={16} className="mt-0.5 shrink-0 text-blue-400" />
            <p>Ứng dụng sẽ <strong>tự động khóa</strong> sau 5 phút không thao tác để bảo vệ dữ liệu của bạn. Bạn chỉ cần nhập lại mật khẩu chủ để tiếp tục.</p>
          </div>
        </div>
      ),
    },
    {
      id: 'crud',
      icon: <Plus size={18} />,
      title: '3. Thêm / Sửa / Xóa mật khẩu',
      color: 'bg-violet-500/10 text-violet-500',
      borderColor: 'border-violet-500/20',
      content: (
        <div className="space-y-5 text-sm text-zinc-300 leading-relaxed">
          <div>
            <p className="font-medium text-white mb-2 flex items-center gap-2"><Plus size={14} /> Thêm mật khẩu mới</p>
            <ol className="list-decimal list-inside space-y-1.5 ml-1">
              <li>Nhấn nút <strong className="text-white">"Mật khẩu mới"</strong> ở cuối thanh bên trái</li>
              <li>Điền các thông tin: Tiêu đề, Tên đăng nhập, Mật khẩu, URL, Danh mục</li>
              <li>Muốn tạo mật khẩu ngẫu nhiên mạnh? Nhấn nút <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-lg text-[11px] font-medium text-white"><KeyRound size={10} /> Auto</span> bên cạnh ô mật khẩu</li>
              <li>Nhấn <strong className="text-white">Lưu thay đổi</strong></li>
            </ol>
          </div>

          <div>
            <p className="font-medium text-white mb-2 flex items-center gap-2"><Star size={14} /> Đánh dấu yêu thích</p>
            <p>Khi đang sửa, nhấn biểu tượng <Star size={12} className="inline -mt-0.5 text-yellow-500" /> để đánh dấu. Mục yêu thích sẽ luôn được <strong className="text-white">ghim lên đầu</strong> danh sách.</p>
          </div>

          <div>
            <p className="font-medium text-white mb-2 flex items-center gap-2"><Upload size={14} /> Trường tùy chỉnh</p>
            <p>Khi đang sửa, kéo xuống dưới cùng để thấy nút <strong className="text-white">"Thêm trường"</strong>. Có 2 loại:</p>
            <ul className="list-disc list-inside space-y-1 ml-1 mt-1.5">
              <li><strong className="text-white">Văn bản</strong>: Lưu ghi chú, mã PIN, khóa API... (có thể import từ file .txt, .pem, .json)</li>
              <li><strong className="text-white">Mật khẩu</strong>: Lưu mật khẩu phụ, tự động ẩn khi xem</li>
            </ul>
          </div>

          <div>
            <p className="font-medium text-white mb-2 flex items-center gap-2"><Trash2 size={14} className="text-red-400" /> Xóa mật khẩu</p>
            <p>Chọn mục → nhấn biểu tượng 🗑️ → xác nhận. <strong className="text-red-400">Không thể hoàn tác.</strong></p>
          </div>
        </div>
      ),
    },
    {
      id: 'search',
      icon: <Search size={18} />,
      title: '4. Tìm kiếm & Phân loại',
      color: 'bg-cyan-500/10 text-cyan-500',
      borderColor: 'border-cyan-500/20',
      content: (
        <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
          <div>
            <p className="font-medium text-white mb-2">Tìm kiếm</p>
            <p>Gõ vào ô <strong className="text-white">"Tìm kiếm..."</strong> ở thanh bên trái. Ứng dụng sẽ lọc tức thì theo tiêu đề hoặc nội dung trường tùy chỉnh.</p>
          </div>
          <div>
            <p className="font-medium text-white mb-2">Phân loại theo danh mục</p>
            <p>Khi tạo mật khẩu, gõ tên danh mục (ví dụ: "Game", "Công việc"). Ứng dụng sẽ tự động tạo các <strong className="text-white">tab lọc</strong> ở thanh bên trái. Nhấn vào tab để lọc theo danh mục đó.</p>
          </div>
          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 flex gap-3 items-start">
            <Clipboard size={16} className="mt-0.5 shrink-0 text-cyan-400" />
            <p><strong>Mẹo:</strong> Chọn một mục trong danh sách, sau đó nhấn <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">Ctrl+C</kbd> để copy mật khẩu ngay mà không cần mở trang chi tiết.</p>
          </div>
        </div>
      ),
    },
    {
      id: 'health',
      icon: <Activity size={18} />,
      title: '5. Kiểm tra độ mạnh mật khẩu',
      color: 'bg-rose-500/10 text-rose-500',
      borderColor: 'border-rose-500/20',
      content: (
        <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
          <p>Nhấn biểu tượng <Activity size={12} className="inline -mt-0.5" /> ở góc trên bên phải thanh bên trái để mở bảng phân tích.</p>
          <div>
            <p className="font-medium text-white mb-2">Ứng dụng sẽ kiểm tra:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-1">
              <li><strong className="text-white">Điểm tổng (%)</strong>: Đánh giá chung mức độ an toàn</li>
              <li><strong className="text-red-400">Mật khẩu yếu</strong>: Quá ngắn hoặc thiếu chữ hoa/số/ký tự đặc biệt</li>
              <li><strong className="text-orange-400">Mật khẩu trùng lặp</strong>: Dùng cùng 1 mật khẩu cho nhiều tài khoản</li>
              <li><strong className="text-yellow-400">Mật khẩu cũ</strong>: Chưa đổi hơn 90 ngày</li>
            </ul>
          </div>
          <p>Nhấn vào tên mục bị cảnh báo → nhảy thẳng sang trang sửa để đổi mật khẩu ngay.</p>
        </div>
      ),
    },
    {
      id: 'settings',
      icon: <Settings size={18} />,
      title: '6. Cài đặt & Sao lưu',
      color: 'bg-purple-500/10 text-purple-500',
      borderColor: 'border-purple-500/20',
      content: (
        <div className="space-y-5 text-sm text-zinc-300 leading-relaxed">
          <div>
            <p className="font-medium text-white mb-2">Đổi mật khẩu chủ</p>
            <p>Nhấn biểu tượng <Settings size={12} className="inline -mt-0.5" /> ở góc trên → Nhập mật khẩu cũ → Nhập mật khẩu mới. Thanh đánh giá độ mạnh sẽ hiển thị bên phải ô nhập.</p>
          </div>
          <div>
            <p className="font-medium text-white mb-2 flex items-center gap-2"><Download size={14} /> Sao lưu dữ liệu</p>
            <p>Trong trang Cài đặt, nhấn <strong className="text-white">"Chọn nơi lưu & Tạo bản sao lưu"</strong>. Ứng dụng sẽ mở hộp thoại để bạn chọn nơi lưu file <code className="px-1.5 py-0.5 bg-white/10 rounded text-[11px]">.vaultbak</code> trên máy tính.</p>
          </div>
          <div>
            <p className="font-medium text-white mb-2">Khôi phục từ bản sao lưu</p>
            <p>Trên <strong className="text-white">màn hình khóa</strong> (trước khi đăng nhập), nhấn <strong className="text-white">"Khôi phục từ bản sao lưu"</strong> ở cuối trang → chọn file <code className="px-1.5 py-0.5 bg-white/10 rounded text-[11px]">.vaultbak</code>. Sau đó đăng nhập bằng mật khẩu chủ của bản sao lưu đó.</p>
          </div>
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 flex gap-3 items-start">
            <Trash2 size={16} className="mt-0.5 shrink-0 text-red-400" />
            <div>
              <p className="font-semibold text-red-400 mb-1">Vùng nguy hiểm</p>
              <p>Nút "Xóa toàn bộ mật khẩu" sẽ xóa <strong>vĩnh viễn</strong> toàn bộ dữ liệu. Bạn phải gõ chữ <code className="px-1.5 py-0.5 bg-white/10 rounded text-[11px]">CONFIRM</code> để xác nhận. Hãy sao lưu trước khi thực hiện.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'tips',
      icon: <ShieldCheck size={18} />,
      title: '7. Mẹo giữ an toàn',
      color: 'bg-amber-500/10 text-amber-500',
      borderColor: 'border-amber-500/20',
      content: (
        <div className="space-y-3 text-sm text-zinc-300 leading-relaxed">
          <ul className="space-y-3">
            <li className="flex gap-3 items-start">
              <span className="text-amber-400 mt-0.5 shrink-0">✦</span>
              <span>Đặt mật khẩu chủ <strong className="text-white">dài và dễ nhớ</strong> — ví dụ: cụm từ tiếng Việt như <code className="px-1.5 py-0.5 bg-white/10 rounded text-[11px]">ConMeoNhaDiChoMuaCa2025</code></span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-amber-400 mt-0.5 shrink-0">✦</span>
              <span><strong className="text-white">Sao lưu định kỳ</strong> — cất file <code className="px-1.5 py-0.5 bg-white/10 rounded text-[11px]">.vaultbak</code> vào USB hoặc ổ cứng ngoài</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-amber-400 mt-0.5 shrink-0">✦</span>
              <span>Khi copy mật khẩu, clipboard sẽ <strong className="text-white">tự động xóa sau 30 giây</strong> — bạn không cần lo lắng</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-amber-400 mt-0.5 shrink-0">✦</span>
              <span>Dùng nút <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-lg text-[11px] font-medium text-white"><KeyRound size={10} /> Auto</span> để tạo mật khẩu ngẫu nhiên mạnh cho mỗi tài khoản — <strong className="text-white">không nên dùng chung</strong> 1 mật khẩu cho nhiều nơi</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-amber-400 mt-0.5 shrink-0">✦</span>
              <span>Kiểm tra trang <strong className="text-white">Độ mạnh mật khẩu</strong> thường xuyên để phát hiện mật khẩu yếu hoặc quá cũ</span>
            </li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-3xl w-full mx-auto px-10 py-16 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
      <div className="mb-12 flex items-start justify-between">
        <div>
          <div className="inline-block rounded-full px-3 py-1 mb-4 text-[9px] uppercase tracking-[0.25em] font-medium bg-white/5 text-zinc-400 border border-white/10">
            Guide
          </div>
          <h2 className="text-5xl font-medium text-white tracking-tight leading-tight">
            Hướng dẫn sử dụng
          </h2>
          <p className="text-sm text-zinc-500 mt-3">Nhấn vào từng mục để xem chi tiết.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10 active:scale-95 text-white"
            title="Quay lại"
          >
            <ArrowLeft size={16} />
          </button>
          <button
            onClick={onHome}
            className="w-10 h-10 flex items-center justify-center bg-white text-black hover:bg-zinc-100 rounded-full transition-colors border border-transparent active:scale-95"
            title="Về Trang chủ"
          >
            <Home size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {sections.map((section, i) => (
          <div
            key={section.id}
            className="p-1.5 rounded-[2rem] bg-white/[0.02] border border-white/5 shadow-2xl animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
          >
            <div className="bg-[#0a0a0a]/60 backdrop-blur-3xl rounded-[calc(2rem-0.375rem)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/5 overflow-hidden">
              <button
                onClick={() => toggle(section.id)}
                className="w-full flex items-center gap-4 p-6 text-left transition-colors hover:bg-white/[0.02]"
              >
                <div className={`w-10 h-10 rounded-2xl ${section.color} ${section.borderColor} border flex items-center justify-center shrink-0`}>
                  {section.icon}
                </div>
                <h3 className="flex-1 font-medium text-white text-sm tracking-tight">
                  {section.title}
                </h3>
                <ChevronDown
                  size={16}
                  className={`text-zinc-500 transition-transform duration-300 shrink-0 ${openId === section.id ? 'rotate-180' : ''}`}
                />
              </button>

              <div
                className={`grid transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${openId === section.id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
              >
                <div className="overflow-hidden">
                  <div className="px-6 pb-6 pt-0 ml-14">
                    {section.content}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
