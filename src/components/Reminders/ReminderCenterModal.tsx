import React, { useState } from 'react';
import { 
  X, 
  BellRing, 
  MessageSquare, 
  Mail, 
  Copy, 
  Check, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  ExternalLink,
  Send
} from 'lucide-react';
import { Invoice, LandlordSettings, Room, Tenant } from '../../types';
import { 
  formatVND, 
  formatDateVN, 
  formatMonthVN, 
  generateZaloBillMessage, 
  generateEmailUrl, 
  getCleanPhoneForZalo 
} from '../../utils/formatters';

interface ReminderCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  rooms: Room[];
  tenants: Tenant[];
  settings: LandlordSettings;
  onMarkReminderSent: (invoiceId: string) => void;
}

export const ReminderCenterModal: React.FC<ReminderCenterModalProps> = ({
  isOpen,
  onClose,
  invoices,
  rooms,
  tenants,
  settings,
  onMarkReminderSent,
}) => {
  if (!isOpen) return null;

  const [copiedInvoiceId, setCopiedInvoiceId] = useState<string | null>(null);
  const [batchCopied, setBatchCopied] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'OVERDUE' | 'UNPAID'>('ALL');

  // Filter pending / overdue invoices
  const pendingInvoices = invoices.filter((inv) => {
    const isPending = inv.status === 'UNPAID' || inv.status === 'OVERDUE' || inv.status === 'PARTIAL';
    if (!isPending) return false;
    if (filterType === 'OVERDUE') return inv.status === 'OVERDUE';
    if (filterType === 'UNPAID') return inv.status === 'UNPAID' || inv.status === 'PARTIAL';
    return true;
  });

  const totalOutstanding = pendingInvoices.reduce(
    (sum, inv) => sum + Math.max(0, inv.totalAmount - (inv.paidAmount || 0)),
    0
  );

  // Send Zalo handler
  const handleSendZalo = async (inv: Invoice, tenant: Tenant, room: Room) => {
    const message = generateZaloBillMessage({ invoice: inv, room, tenant, settings });
    try {
      await navigator.clipboard.writeText(message);
      setCopiedInvoiceId(inv.id);
      setTimeout(() => setCopiedInvoiceId(null), 2500);

      onMarkReminderSent(inv.id);

      const cleanPhone = getCleanPhoneForZalo(tenant.phone);
      window.open(`https://zalo.me/${cleanPhone}`, '_blank');
    } catch {
      alert('Không thể sao chép tự động. Vui lòng mở Zalo thủ công.');
    }
  };

  // Copy message only
  const handleCopyMessage = async (inv: Invoice, tenant: Tenant, room: Room) => {
    const message = generateZaloBillMessage({ invoice: inv, room, tenant, settings });
    try {
      await navigator.clipboard.writeText(message);
      setCopiedInvoiceId(inv.id);
      setTimeout(() => setCopiedInvoiceId(null), 2500);
      onMarkReminderSent(inv.id);
    } catch {
      alert('Sao chép thất bại.');
    }
  };

  // Copy all reminders in one batch text
  const handleCopyAllReminders = async () => {
    const items = pendingInvoices.map((inv) => {
      const room = rooms.find((r) => r.id === inv.roomId);
      const tenant = tenants.find((t) => t.id === inv.tenantId);
      if (!room || !tenant) return '';
      return generateZaloBillMessage({ invoice: inv, room, tenant, settings });
    }).filter(Boolean);

    const fullText = items.join('\n\n=========================================\n\n');
    try {
      await navigator.clipboard.writeText(fullText);
      setBatchCopied(true);
      setTimeout(() => setBatchCopied(false), 3000);
    } catch {
      alert('Sao chép hàng loạt thất bại.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <BellRing className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Trung tâm nhắc lịch thu tiền tự động</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-mono">
                  {pendingInvoices.length} phòng cần thu
                </span>
              </h2>
              <p className="text-xs text-amber-100">
                Gửi tin nhắn mẫu chi tiết qua Zalo hoặc Email chỉ với 1 cú click chuột
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-amber-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary banner & Batch Action */}
        <div className="p-4 bg-amber-50 border-b border-amber-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4 text-xs">
            <div>
              <span className="text-slate-500 block">Tổng công nợ cần nhắc:</span>
              <span className="text-lg font-black text-rose-600">{formatVND(totalOutstanding)}</span>
            </div>

            <div className="border-l border-amber-200 pl-4">
              <span className="text-slate-500 block">Bộ lọc trạng thái:</span>
              <div className="flex items-center space-x-1 mt-0.5">
                <button
                  onClick={() => setFilterType('ALL')}
                  className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    filterType === 'ALL' ? 'bg-amber-700 text-white' : 'bg-white text-slate-700'
                  }`}
                >
                  Tất cả ({invoices.filter((i) => i.status !== 'PAID').length})
                </button>
                <button
                  onClick={() => setFilterType('OVERDUE')}
                  className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    filterType === 'OVERDUE' ? 'bg-rose-600 text-white' : 'bg-white text-rose-700'
                  }`}
                >
                  Quá hạn ({invoices.filter((i) => i.status === 'OVERDUE').length})
                </button>
                <button
                  onClick={() => setFilterType('UNPAID')}
                  className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    filterType === 'UNPAID' ? 'bg-amber-600 text-white' : 'bg-white text-amber-800'
                  }`}
                >
                  Chưa nộp ({invoices.filter((i) => i.status === 'UNPAID' || i.status === 'PARTIAL').length})
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleCopyAllReminders}
            disabled={pendingInvoices.length === 0}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            {batchCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{batchCopied ? 'Đã sao chép toàn bộ!' : 'Sao chép toàn bộ tin nhắn'}</span>
          </button>
        </div>

        {/* List of pending rooms */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {pendingInvoices.length > 0 ? (
            pendingInvoices.map((inv) => {
              const room = rooms.find((r) => r.id === inv.roomId);
              const tenant = tenants.find((t) => t.id === inv.tenantId);
              if (!room || !tenant) return null;

              const remaining = Math.max(0, inv.totalAmount - (inv.paidAmount || 0));
              const isOverdue = inv.status === 'OVERDUE';
              const emailUrl = generateEmailUrl({ invoice: inv, room, tenant, settings });
              const isCopied = copiedInvoiceId === inv.id;

              return (
                <div
                  key={inv.id}
                  className={`p-4 rounded-xl border transition-all duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isOverdue
                      ? 'bg-rose-50/40 border-rose-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Left Info */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-slate-900 text-sm">{room.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {room.group}
                      </span>
                      {isOverdue ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>Quá hạn thanh toán</span>
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                          Chưa thanh toán
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 flex items-center space-x-3">
                      <span>
                        👤 Người thuê: <strong>{tenant.fullName}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        📞 SĐT: <strong>{tenant.phone}</strong>
                      </span>
                      {tenant.email && (
                        <>
                          <span>•</span>
                          <span className="text-slate-400 truncate max-w-[150px]">
                            ✉️ {tenant.email}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 flex items-center space-x-3 pt-0.5">
                      <span>Kỳ: <strong>{formatMonthVN(inv.month)}</strong></span>
                      <span>•</span>
                      <span>Hạn: <strong>{formatDateVN(inv.dueDate)}</strong></span>
                      {inv.lastReminderSentAt && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700 italic">
                            Đã nhắc gần nhất: {inv.lastReminderSentAt}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Financial & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="text-right sm:mr-2">
                      <span className="text-[11px] text-slate-400 block uppercase font-semibold">
                        Cần thanh toán
                      </span>
                      <span className="text-base font-black text-rose-600">
                        {formatVND(remaining)}
                      </span>
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex items-center space-x-1.5">
                      {/* Copy message */}
                      <button
                        onClick={() => handleCopyMessage(inv, tenant, room)}
                        className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors"
                        title="Sao chép nội dung tin nhắn nhắc nợ"
                      >
                        {isCopied ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-600" />
                        )}
                      </button>

                      {/* Zalo Button */}
                      <button
                        onClick={() => handleSendZalo(inv, tenant, room)}
                        className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                        title="Sao chép nội dung & Mở Zalo nhắn cho khách"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Nhắn Zalo</span>
                      </button>

                      {/* Email Button */}
                      {tenant.email && (
                        <a
                          href={emailUrl}
                          onClick={() => onMarkReminderSent(inv.id)}
                          className="inline-flex items-center space-x-1 px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                          title="Gửi email nhắc tiền"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Email</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center text-slate-500">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">
                Tuyệt vời! Không có phòng nào còn nợ tiền
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Tất cả khách thuê đã thanh toán đủ tiền phòng và dịch vụ cho kỳ này.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            💡 Mẹo: Nhấn nút <strong>"Nhắn Zalo"</strong> hệ thống sẽ tự động sao chép mẫu tin nhắn chi tiết kèm số tài khoản và mở khung chat Zalo với khách.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
