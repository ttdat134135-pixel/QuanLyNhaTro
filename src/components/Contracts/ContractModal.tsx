import React, { useState } from 'react';
import { X, Printer, Copy, Check, FileDown, ShieldCheck } from 'lucide-react';
import { LandlordSettings, Room, Tenant } from '../../types';
import { formatVND, formatDateVN, numberToVietnameseWords } from '../../utils/formatters';

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant;
  room: Room;
  settings: LandlordSettings;
}

export const ContractModal: React.FC<ContractModalProps> = ({
  isOpen,
  onClose,
  tenant,
  room,
  settings,
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);

  // Today's parts for header
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = async () => {
    const el = document.getElementById('contract-document-text');
    if (!el) return;
    try {
      await navigator.clipboard.writeText(el.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert('Vui lòng chọn văn bản và sao chép thủ công.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[95vh]">
        {/* Modal Toolbar (hidden when printing) */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold">Hợp Đồng Thuê Phòng Trọ</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
              {room.name} • {tenant.fullName}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyText}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors border border-slate-700"
              title="Sao chép toàn bộ nội dung hợp đồng"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép!' : 'Chép nội dung'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Hợp đồng / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Legal Contract Body */}
        <div
          id="contract-document-text"
          className="p-8 sm:p-14 overflow-y-auto bg-white text-slate-800 text-sm leading-relaxed space-y-6"
        >
          {/* Header Quốc hiệu */}
          <div className="text-center space-y-1">
            <h2 className="text-base font-extrabold uppercase tracking-wide">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </h2>
            <p className="text-sm font-bold tracking-wide">
              Độc lập - Tự do - Hạnh phúc
            </p>
            <div className="w-36 h-0.5 bg-slate-800 mx-auto mt-1"></div>
            <p className="text-xs text-slate-500 italic pt-3">
              Hôm nay, ngày {day} tháng {month} năm {year}, tại địa chỉ: {settings.address}
            </p>
          </div>

          {/* Title */}
          <div className="text-center pt-2">
            <h1 className="text-xl font-black uppercase text-slate-900 tracking-tight">
              HỢP ĐỒNG THUÊ PHÒNG TRỌ
            </h1>
            <p className="text-xs text-slate-500 italic mt-0.5">
              (Số: HĐ-{room.name.replace(/\s+/g, '')}/{year})
            </p>
          </div>

          <p className="text-xs text-slate-600">
            Chúng tôi gồm có các bên dưới đây cùng thống nhất ký kết bản hợp đồng thuê phòng trọ với những điều khoản sau:
          </p>

          {/* Bên A (Chủ trọ) */}
          <div className="space-y-1.5 border-l-2 border-emerald-600 pl-4 py-1">
            <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">
              BÊN CHO THUÊ (BÊN A):
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div>• Họ và tên: <strong className="text-slate-900 uppercase">{settings.landlordName}</strong></div>
              <div>• Số CCCD/CMND: <strong>{settings.idCard || '079085001234'}</strong></div>
              <div>• Số điện thoại: <strong>{settings.phone}</strong></div>
              <div>• Email: <strong>{settings.email || 'Chưa cập nhật'}</strong></div>
              <div className="sm:col-span-2">• Địa chỉ liên hệ: <strong>{settings.address}</strong></div>
            </div>
          </div>

          {/* Bên B (Khách thuê) */}
          <div className="space-y-1.5 border-l-2 border-blue-600 pl-4 py-1">
            <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">
              BÊN THUÊ (BÊN B):
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div>• Họ và tên: <strong className="text-slate-900 uppercase">{tenant.fullName}</strong></div>
              <div>• Ngày sinh: <strong>{formatDateVN(tenant.birthDate) || 'Chưa cập nhật'}</strong></div>
              <div>• Số CCCD/CMND: <strong>{tenant.idCard || 'Chưa cập nhật'}</strong></div>
              <div>• Nơi cấp: <strong>{tenant.idCardPlace || 'Cục Cảnh sát QLHC về TTXH'}</strong></div>
              <div>• Quê quán / Thường trú: <strong>{tenant.hometown || 'Chưa cập nhật'}</strong></div>
              <div>• Số điện thoại: <strong>{tenant.phone}</strong></div>
              <div>• Biển số xe máy đăng ký: <strong>{tenant.vehiclePlate || 'Chưa đăng ký'}</strong></div>
              <div>• Người liên hệ khẩn cấp: <strong>{tenant.emergencyContact || 'Chưa cập nhật'}</strong></div>
            </div>
          </div>

          {/* Điều khoản hợp đồng */}
          <div className="space-y-4 pt-2 text-xs">
            <div>
              <h4 className="font-bold text-slate-900">
                ĐIỀU 1: ĐỐI TƯỢNG VÀ MỤC ĐÍCH THUÊ
              </h4>
              <p className="text-slate-700 mt-1">
                1.1. Bên A đồng ý cho Bên B thuê phòng số: <strong>{room.name}</strong> thuộc khu nhà trọ <strong>{settings.houseName}</strong> tại địa chỉ: {settings.address}.
              </p>
              <p className="text-slate-700 mt-0.5">
                1.2. Diện tích phòng: <strong>{room.area} m²</strong>. Sức chứa tối đa: <strong>{room.maxRenters} người</strong>.
              </p>
              <p className="text-slate-700 mt-0.5">
                1.3. Mục đích thuê: Chỉ dùng để ở sinh hoạt hợp pháp, không sử dụng vào mục đích kinh doanh, tàng trữ hàng cấm hoặc các hành vi vi phạm pháp luật.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900">
                ĐIỀU 2: THỜI HẠN THUÊ VÀ GIÁ THUÊ
              </h4>
              <p className="text-slate-700 mt-1">
                2.1. Thời hạn thuê là: Từ ngày <strong>{formatDateVN(tenant.startDate)}</strong> đến ngày <strong>{formatDateVN(tenant.endDate)}</strong>. Sau khi hết hạn, hai bên có thể thỏa thuận ký tiếp phụ lục hợp đồng gia hạn.
              </p>
              <p className="text-slate-700 mt-0.5">
                2.2. Giá tiền thuê phòng: <strong>{formatVND(room.price)}/tháng</strong> (Bằng chữ: <em>{numberToVietnameseWords(room.price)}</em>).
              </p>
              <p className="text-slate-700 mt-0.5">
                2.3. Kỳ thanh toán: Bên B có trách nhiệm thanh toán tiền phòng và các chi phí sinh hoạt từ ngày <strong>01 đến ngày {settings.dueDayOfMonth || 5}</strong> hằng tháng qua hình thức chuyển khoản (VietQR) hoặc tiền mặt cho Bên A.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900">
                ĐIỀU 3: TIỀN ĐẶT CỌC GIỮ PHÒNG
              </h4>
              <p className="text-slate-700 mt-1">
                3.1. Để bảo đảm việc thực hiện hợp đồng, Bên B đặt cọc cho Bên A số tiền là: <strong>{formatVND(tenant.deposit)}</strong> (Bằng chữ: <em>{numberToVietnameseWords(tenant.deposit)}</em>).
              </p>
              <p className="text-slate-700 mt-0.5">
                3.2. Tiền đặt cọc sẽ được Bên A hoàn trả lại đầy đủ cho Bên B khi chấm dứt hợp đồng đúng thời hạn, sau khi đã trừ đi các khoản tiền phòng, điện nước chưa thanh toán và các thiệt hại về trang thiết bị phòng trọ (nếu có do Bên B gây ra).
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900">
                ĐIỀU 4: CÁC KHOẢN CHI PHÍ DỊCH VỤ SINH HOẠT
              </h4>
              <p className="text-slate-700 mt-1">
                • <strong>Tiền điện:</strong> {formatVND(settings.defaultElectricRate)}/kWh (theo chỉ số công tơ điện riêng từng phòng).
              </p>
              <p className="text-slate-700 mt-0.5">
                • <strong>Tiền nước:</strong> {formatVND(settings.defaultWaterRate)}/{settings.waterBillingType === 'METER' ? 'm³' : 'người/tháng'}.
              </p>
              <p className="text-slate-700 mt-0.5">
                • <strong>Phí Internet/Wifi:</strong> {formatVND(settings.defaultInternetFee)}/phòng/tháng.
              </p>
              <p className="text-slate-700 mt-0.5">
                • <strong>Phí vệ sinh & rác:</strong> {formatVND(settings.defaultGarbageFee)}/phòng/tháng.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900">
                ĐIỀU 5: NỘI QUY & NGHĨA VỤ CỦA BÊN THUÊ (BÊN B)
              </h4>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-1 space-y-1 text-slate-700 whitespace-pre-line">
                {settings.termsAndRules}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900">
                ĐIỀU 6: CHẤM DỨT HỢP ĐỒNG
              </h4>
              <p className="text-slate-700 mt-1">
                6.1. Một trong hai bên muốn chấm dứt hợp đồng trước thời hạn phải thông báo trước bằng văn bản hoặc tin nhắn tối thiểu <strong>30 ngày</strong>.
              </p>
              <p className="text-slate-700 mt-0.5">
                6.2. Nếu Bên B tự ý dọn đi mà không báo trước hoặc vi phạm nghiêm trọng nội quy an ninh, Bên B sẽ không được nhận lại tiền cọc.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900">
                ĐIỀU 7: ĐIỀU KHOẢN THI HÀNH
              </h4>
              <p className="text-slate-700 mt-1">
                Hợp đồng này có hiệu lực kể từ ngày ký, được lập thành 02 (hai) bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản để thực hiện.
              </p>
            </div>
          </div>

          {/* Chữ ký hai bên */}
          <div className="grid grid-cols-2 pt-10 text-center text-xs">
            <div>
              <p className="font-bold text-slate-800 uppercase">ĐẠI DIỆN BÊN B (BÊN THUÊ)</p>
              <p className="text-[11px] text-slate-400 italic">(Ký và ghi rõ họ tên)</p>
              <div className="h-20"></div>
              <p className="font-bold text-slate-900 uppercase">{tenant.fullName}</p>
            </div>

            <div>
              <p className="font-bold text-slate-800 uppercase">ĐẠI DIỆN BÊN A (BÊN CHO THUÊ)</p>
              <p className="text-[11px] text-slate-400 italic">(Ký và ghi rõ họ tên)</p>
              <div className="h-20"></div>
              <p className="font-bold text-slate-900 uppercase">{settings.landlordName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
