import React from 'react';
import { X, Printer, Share2, Copy, Check, MessageSquare, Mail } from 'lucide-react';
import { Invoice, LandlordSettings, Room, Tenant } from '../../types';
import { 
  formatVND, 
  formatDateVN, 
  formatMonthVN, 
  formatNumber, 
  numberToVietnameseWords, 
  getVietQRUrl,
  generateZaloBillMessage,
  generateEmailUrl,
  getCleanPhoneForZalo
} from '../../utils/formatters';

interface InvoicePrintViewProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  room: Room;
  tenant: Tenant;
  settings: LandlordSettings;
}

export const InvoicePrintView: React.FC<InvoicePrintViewProps> = ({
  isOpen,
  onClose,
  invoice,
  room,
  tenant,
  settings,
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = React.useState(false);

  const transferContent = `${room.name.replace(/\s+/g, '')} ${invoice.month.replace('-', '')}`;
  const vietQrUrl = getVietQRUrl({
    bankCode: settings.bankCode,
    accountNumber: settings.accountNumber,
    accountHolder: settings.accountHolder,
    amount: invoice.totalAmount,
    description: transferContent,
  });

  const zaloMessage = generateZaloBillMessage({ invoice, room, tenant, settings });
  const emailUrl = generateEmailUrl({ invoice, room, tenant, settings });
  const cleanPhone = getCleanPhoneForZalo(tenant.phone);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyZalo = async () => {
    try {
      await navigator.clipboard.writeText(zaloMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert('Không thể sao chép tự động. Vui lòng chọn và sao chép thủ công.');
    }
  };

  const electricKwh = Math.max(0, invoice.currElectric - invoice.prevElectric);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[95vh]">
        {/* Header toolbar (Hidden when printed) */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold">Phiếu Thu Tiền Phòng Trọ</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
              {invoice.id}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyZalo}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors border border-slate-700"
              title="Sao chép nội dung tin nhắn gửi Zalo"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã chép tin nhắn!' : 'Chép tin Zalo'}</span>
            </button>

            <a
              href={`https://zalo.me/${cleanPhone}`}
              target="_blank"
              rel="noreferrer"
              onClick={handleCopyZalo}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
              title="Mở Zalo nhắn cho khách"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Gửi Zalo</span>
            </a>

            {tenant.email && (
              <a
                href={emailUrl}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors border border-slate-700"
                title="Mở ứng dụng Email gửi hóa đơn"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Gửi Email</span>
              </a>
            )}

            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In hóa đơn / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="p-6 sm:p-10 overflow-y-auto bg-white text-slate-800 space-y-6">
          {/* Top Brand & Title */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 border-b-2 border-slate-800 gap-4">
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                {settings.houseName || 'KHU TRỌ AN NHIÊN'}
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">{settings.address}</p>
              <p className="text-xs text-slate-600">
                Hotline / Zalo: <strong>{settings.phone}</strong> (Quản lý: {settings.landlordName})
              </p>
            </div>

            <div className="sm:text-right">
              <h2 className="text-lg font-extrabold text-emerald-800 tracking-wide uppercase">
                PHIẾU THU TIỀN TRỌ
              </h2>
              <p className="text-xs font-bold text-slate-700 mt-0.5">
                {formatMonthVN(invoice.month).toUpperCase()}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                Số phiếu: {invoice.id} • Ngày lập: {formatDateVN(invoice.issueDate)}
              </p>
            </div>
          </div>

          {/* Tenant Details Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block">Phòng trọ</span>
              <strong className="text-sm font-bold text-emerald-800">{room.name}</strong>
              <span className="text-slate-500 block">({room.group})</span>
            </div>
            <div>
              <span className="text-slate-400 block">Người thuê</span>
              <strong className="text-sm font-bold text-slate-800">{tenant.fullName}</strong>
              <span className="text-slate-500 block">{tenant.phone}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Hạn nộp tiền</span>
              <strong className="text-slate-800 font-bold">{formatDateVN(invoice.dueDate)}</strong>
              <span className="text-slate-500 block">(Trước ngày 05)</span>
            </div>
            <div>
              <span className="text-slate-400 block">Trạng thái</span>
              <span
                className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                  invoice.status === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800'
                    : invoice.status === 'PARTIAL'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {invoice.status === 'PAID'
                  ? 'ĐÃ THANH TOÁN'
                  : invoice.status === 'PARTIAL'
                  ? 'TRẢ MỘT PHẦN'
                  : 'CHƯA THANH TOÁN'}
              </span>
            </div>
          </div>

          {/* Breakdown Items Table */}
          <table className="w-full text-xs text-left border-collapse border border-slate-200">
            <thead className="bg-slate-100 text-slate-800 font-bold uppercase border-b border-slate-300">
              <tr>
                <th className="p-2.5 border border-slate-200 w-10 text-center">STT</th>
                <th className="p-2.5 border border-slate-200">Khoản mục thanh toán</th>
                <th className="p-2.5 border border-slate-200 text-center">Chỉ số cũ - mới</th>
                <th className="p-2.5 border border-slate-200 text-center">Số lượng</th>
                <th className="p-2.5 border border-slate-200 text-right">Đơn giá</th>
                <th className="p-2.5 border border-slate-200 text-right">Thành tiền (VNĐ)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {/* 1. Room fee */}
              <tr>
                <td className="p-2.5 border border-slate-200 text-center font-medium">1</td>
                <td className="p-2.5 border border-slate-200 font-bold text-slate-800">
                  Tiền thuê phòng {room.name}
                </td>
                <td className="p-2.5 border border-slate-200 text-center text-slate-400">-</td>
                <td className="p-2.5 border border-slate-200 text-center">1 tháng</td>
                <td className="p-2.5 border border-slate-200 text-right">{formatVND(invoice.roomFee)}</td>
                <td className="p-2.5 border border-slate-200 text-right font-bold text-slate-800">
                  {formatVND(invoice.roomFee)}
                </td>
              </tr>

              {/* 2. Electricity */}
              <tr>
                <td className="p-2.5 border border-slate-200 text-center font-medium">2</td>
                <td className="p-2.5 border border-slate-200">
                  <div className="font-bold text-slate-800">Tiền điện sinh hoạt</div>
                  <div className="text-[11px] text-slate-500">Chỉ số công tơ điện riêng của phòng</div>
                </td>
                <td className="p-2.5 border border-slate-200 text-center font-mono">
                  {invoice.prevElectric} ➜ {invoice.currElectric}
                </td>
                <td className="p-2.5 border border-slate-200 text-center font-bold">
                  {electricKwh} kWh
                </td>
                <td className="p-2.5 border border-slate-200 text-right">
                  {formatVND(invoice.electricPrice)}
                </td>
                <td className="p-2.5 border border-slate-200 text-right font-bold text-slate-800">
                  {formatVND(invoice.electricTotal)}
                </td>
              </tr>

              {/* 3. Water */}
              <tr>
                <td className="p-2.5 border border-slate-200 text-center font-medium">3</td>
                <td className="p-2.5 border border-slate-200">
                  <div className="font-bold text-slate-800">Tiền nước sinh hoạt</div>
                  <div className="text-[11px] text-slate-500">
                    {invoice.waterType === 'METER'
                      ? 'Tính theo khối lượng thực tế qua đồng hồ'
                      : invoice.waterType === 'PER_PERSON'
                      ? 'Tính theo định mức đầu người ở'
                      : 'Khoán cố định phòng'}
                  </div>
                </td>
                <td className="p-2.5 border border-slate-200 text-center font-mono">
                  {invoice.waterType === 'METER'
                    ? `${invoice.prevWater} ➜ ${invoice.currWater}`
                    : '-'}
                </td>
                <td className="p-2.5 border border-slate-200 text-center font-bold">
                  {invoice.waterType === 'METER'
                    ? `${Math.max(0, invoice.currWater - invoice.prevWater)} m³`
                    : invoice.waterType === 'PER_PERSON'
                    ? `${invoice.waterCount} người`
                    : '1 phòng'}
                </td>
                <td className="p-2.5 border border-slate-200 text-right">
                  {formatVND(invoice.waterPrice)}
                </td>
                <td className="p-2.5 border border-slate-200 text-right font-bold text-slate-800">
                  {formatVND(invoice.waterTotal)}
                </td>
              </tr>

              {/* 4. Internet */}
              {invoice.internetFee > 0 && (
                <tr>
                  <td className="p-2.5 border border-slate-200 text-center font-medium">4</td>
                  <td className="p-2.5 border border-slate-200 font-medium">Cáp quang Internet / Wifi</td>
                  <td className="p-2.5 border border-slate-200 text-center text-slate-400">-</td>
                  <td className="p-2.5 border border-slate-200 text-center">1 phòng</td>
                  <td className="p-2.5 border border-slate-200 text-right">
                    {formatVND(invoice.internetFee)}
                  </td>
                  <td className="p-2.5 border border-slate-200 text-right font-bold text-slate-800">
                    {formatVND(invoice.internetFee)}
                  </td>
                </tr>
              )}

              {/* 5. Garbage */}
              {invoice.garbageFee > 0 && (
                <tr>
                  <td className="p-2.5 border border-slate-200 text-center font-medium">5</td>
                  <td className="p-2.5 border border-slate-200 font-medium">Phí vệ sinh & Thu gom rác</td>
                  <td className="p-2.5 border border-slate-200 text-center text-slate-400">-</td>
                  <td className="p-2.5 border border-slate-200 text-center">1 phòng</td>
                  <td className="p-2.5 border border-slate-200 text-right">
                    {formatVND(invoice.garbageFee)}
                  </td>
                  <td className="p-2.5 border border-slate-200 text-right font-bold text-slate-800">
                    {formatVND(invoice.garbageFee)}
                  </td>
                </tr>
              )}

              {/* 6. Other fees */}
              {invoice.otherFee > 0 && (
                <tr>
                  <td className="p-2.5 border border-slate-200 text-center font-medium">6</td>
                  <td className="p-2.5 border border-slate-200 font-medium">
                    Phí dịch vụ khác ({invoice.otherFeeDescription || 'Khác'})
                  </td>
                  <td className="p-2.5 border border-slate-200 text-center text-slate-400">-</td>
                  <td className="p-2.5 border border-slate-200 text-center">1 khoản</td>
                  <td className="p-2.5 border border-slate-200 text-right">
                    {formatVND(invoice.otherFee)}
                  </td>
                  <td className="p-2.5 border border-slate-200 text-right font-bold text-slate-800">
                    {formatVND(invoice.otherFee)}
                  </td>
                </tr>
              )}

              {/* Discount if any */}
              {invoice.discount > 0 && (
                <tr className="bg-rose-50/50">
                  <td className="p-2.5 border border-slate-200 text-center font-medium">-</td>
                  <td className="p-2.5 border border-slate-200 font-medium text-rose-700">
                    Giảm trừ / Khuyến mãi
                  </td>
                  <td className="p-2.5 border border-slate-200 text-center text-slate-400">-</td>
                  <td className="p-2.5 border border-slate-200 text-center">-</td>
                  <td className="p-2.5 border border-slate-200 text-right text-rose-600">
                    -{formatVND(invoice.discount)}
                  </td>
                  <td className="p-2.5 border border-slate-200 text-right font-bold text-rose-700">
                    -{formatVND(invoice.discount)}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-800">
              <tr>
                <td colSpan={5} className="p-3 text-right uppercase text-slate-800">
                  TỔNG CỘNG PHẢI THANH TOÁN:
                </td>
                <td className="p-3 text-right text-base text-emerald-800 font-black">
                  {formatVND(invoice.totalAmount)}
                </td>
              </tr>
              {invoice.paidAmount > 0 && (
                <>
                  <tr>
                    <td colSpan={5} className="p-2 text-right text-slate-600">
                      Số tiền đã thanh toán:
                    </td>
                    <td className="p-2 text-right font-bold text-slate-700">
                      {formatVND(invoice.paidAmount)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={5} className="p-2 text-right text-rose-700 uppercase">
                      CÒN PHẢI NỘP:
                    </td>
                    <td className="p-2 text-right font-black text-rose-700">
                      {formatVND(Math.max(0, invoice.totalAmount - invoice.paidAmount))}
                    </td>
                  </tr>
                </>
              )}
            </tfoot>
          </table>

          {/* Amount in words */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
            <span className="text-emerald-800 font-semibold">Số tiền viết bằng chữ: </span>
            <strong className="text-emerald-950 italic">
              {numberToVietnameseWords(invoice.totalAmount)}
            </strong>
          </div>

          {/* VietQR Section & Payment Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-200">
            <div className="sm:col-span-2 space-y-2 text-xs">
              <h4 className="font-bold text-slate-800 uppercase tracking-wide">
                Thông tin thanh toán chuyển khoản:
              </h4>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 font-mono">
                <div>• Ngân hàng: <strong className="text-slate-800">{settings.bankName} ({settings.bankCode})</strong></div>
                <div>• Số tài khoản: <strong className="text-slate-900 text-sm">{settings.accountNumber}</strong></div>
                <div>• Chủ tài khoản: <strong className="text-slate-900">{settings.accountHolder.toUpperCase()}</strong></div>
                <div>• Nội dung chuyển khoản: <strong className="text-emerald-700 text-sm">{transferContent}</strong></div>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                * Quý khách mở bất kỳ App ngân hàng nào để quét mã QR bên cạnh. Số tiền và nội dung chuyển khoản sẽ tự động được điền chính xác.
              </p>
            </div>

            {/* VietQR Live Image */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              {vietQrUrl ? (
                <>
                  <img
                    src={vietQrUrl}
                    alt="VietQR Code"
                    className="w-32 h-32 object-contain rounded-lg border border-slate-200 bg-white p-1 shadow-xs"
                  />
                  <span className="text-[10px] text-slate-500 mt-1.5 font-medium">
                    Quét VietQR chuyển khoản
                  </span>
                </>
              ) : (
                <div className="text-xs text-slate-400 p-4">
                  Chưa cấu hình tài khoản ngân hàng trong Cài đặt
                </div>
              )}
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 pt-8 text-center text-xs">
            <div>
              <p className="font-bold text-slate-700 uppercase">Người nộp tiền</p>
              <p className="text-[11px] text-slate-400 italic">(Ký và ghi rõ họ tên)</p>
              <div className="h-16"></div>
              <p className="font-semibold text-slate-800">{tenant.fullName}</p>
            </div>

            <div>
              <p className="font-bold text-slate-700 uppercase">Người lập phiếu (Chủ trọ)</p>
              <p className="text-[11px] text-slate-400 italic">(Ký và ghi rõ họ tên)</p>
              <div className="h-16"></div>
              <p className="font-semibold text-slate-800">{settings.landlordName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
