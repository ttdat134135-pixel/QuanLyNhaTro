import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Printer, 
  Share2, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Download,
  Zap,
  Check,
  MessageSquare,
  CreditCard
} from 'lucide-react';
import { Invoice, LandlordSettings, Room, Tenant } from '../../types';
import { formatVND, formatDateVN, formatMonthVN, getCleanPhoneForZalo, generateZaloBillMessage } from '../../utils/formatters';
import { exportToCSV } from '../../utils/storage';

interface InvoiceListProps {
  invoices: Invoice[];
  rooms: Room[];
  tenants: Tenant[];
  settings: LandlordSettings;
  onCreateInvoice: () => void;
  onOpenQuickMeter: () => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onPrintInvoice: (invoice: Invoice) => void;
  onUpdateInvoiceStatus: (invoiceId: string, status: Invoice['status'], paidAmount: number) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  rooms,
  tenants,
  settings,
  onCreateInvoice,
  onOpenQuickMeter,
  onEditInvoice,
  onDeleteInvoice,
  onPrintInvoice,
  onUpdateInvoiceStatus,
}) => {
  // Get all unique months from invoices
  const availableMonths = Array.from(new Set(invoices.map((inv) => inv.month))).sort().reverse();
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [selectedMonth, setSelectedMonth] = useState<string>(
    availableMonths[0] || currentMonth
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'UNPAID' | 'OVERDUE'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    const room = rooms.find((r) => r.id === inv.roomId);
    const tenant = tenants.find((t) => t.id === inv.tenantId);

    const matchesMonth = selectedMonth === 'ALL' || inv.month === selectedMonth;
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const matchesSearch =
      (room && room.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tenant && tenant.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tenant && tenant.phone.includes(searchQuery)) ||
      inv.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesMonth && matchesStatus && matchesSearch;
  });

  // Calculate stats for current filter
  const currentMonthInvoices = invoices.filter(
    (inv) => selectedMonth === 'ALL' || inv.month === selectedMonth
  );
  const totalBilled = currentMonthInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const totalCollected = currentMonthInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const totalRemaining = Math.max(0, totalBilled - totalCollected);
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  // Handle Quick Zalo Copy
  const handleQuickZalo = async (inv: Invoice) => {
    const room = rooms.find((r) => r.id === inv.roomId);
    const tenant = tenants.find((t) => t.id === inv.tenantId);
    if (!room || !tenant) return;

    const message = generateZaloBillMessage({ invoice: inv, room, tenant, settings });
    try {
      await navigator.clipboard.writeText(message);
      setCopiedId(inv.id);
      setTimeout(() => setCopiedId(null), 2000);
      const cleanPhone = getCleanPhoneForZalo(tenant.phone);
      window.open(`https://zalo.me/${cleanPhone}`, '_blank');
    } catch {
      alert('Đã tạo liên kết mở Zalo.');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Mã hóa đơn',
      'Kỳ thu',
      'Phòng',
      'Khách thuê',
      'SĐT',
      'Tiền phòng',
      'Điện (kWh)',
      'Tiền điện',
      'Nước (m3/người)',
      'Tiền nước',
      'Wifi',
      'Rác',
      'Khác',
      'Giảm giá',
      'Tổng tiền',
      'Đã trả',
      'Còn lại',
      'Trạng thái',
      'Hạn nộp',
    ];

    const rows = filteredInvoices.map((inv) => {
      const room = rooms.find((r) => r.id === inv.roomId);
      const tenant = tenants.find((t) => t.id === inv.tenantId);
      const electricKwh = Math.max(0, inv.currElectric - inv.prevElectric);

      return [
        inv.id,
        inv.month,
        room ? room.name : '',
        tenant ? tenant.fullName : '',
        tenant ? tenant.phone : '',
        String(inv.roomFee),
        String(electricKwh),
        String(inv.electricTotal),
        String(inv.waterCount),
        String(inv.waterTotal),
        String(inv.internetFee),
        String(inv.garbageFee),
        String(inv.otherFee),
        String(inv.discount),
        String(inv.totalAmount),
        String(inv.paidAmount),
        String(Math.max(0, inv.totalAmount - inv.paidAmount)),
        inv.status,
        inv.dueDate,
      ];
    });

    exportToCSV(`hoa-don-${selectedMonth}-${new Date().toISOString().slice(0, 10)}.csv`, [
      headers,
      ...rows,
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Financial KPI bar for the selected period */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Tổng tiền phát sinh
          </span>
          <span className="text-xl font-black text-slate-900 mt-1 block">
            {formatVND(totalBilled)}
          </span>
          <span className="text-xs text-slate-400">{currentMonthInvoices.length} hóa đơn</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Đã thu thực tế
          </span>
          <span className="text-xl font-black text-emerald-600 mt-1 block">
            {formatVND(totalCollected)}
          </span>
          <span className="text-xs text-emerald-600 font-medium">
            Đạt {collectionRate}% tổng tiền
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Còn phải thu (Nợ)
          </span>
          <span className="text-xl font-black text-rose-600 mt-1 block">
            {formatVND(totalRemaining)}
          </span>
          <span className="text-xs text-rose-500 font-medium">
            {currentMonthInvoices.filter((i) => i.status !== 'PAID').length} phòng chưa đóng
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Tiến độ thu tiền
          </span>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden mt-1">
            <div
              className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, collectionRate)}%` }}
            ></div>
          </div>
          <span className="text-xs text-slate-500 mt-1 font-medium text-right">
            {collectionRate}% Hoàn tất
          </span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Month Dropdown */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-600">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="py-2 px-3 border border-slate-300 rounded-xl bg-white text-sm font-bold text-slate-800 focus:outline-emerald-600 shadow-xs"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthVN(m)}
                </option>
              ))}
              <option value="ALL">Tất cả các tháng</option>
            </select>
          </div>

          {/* Search */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo phòng, tên khách, SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-emerald-600 focus:border-emerald-600 bg-slate-50/50"
            />
          </div>

          {/* Status filter */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'ALL' ? 'bg-white shadow-xs text-slate-800' : 'text-slate-500'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setStatusFilter('PAID')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'PAID' ? 'bg-white shadow-xs text-emerald-700 font-bold' : 'text-slate-500'
              }`}
            >
              Đã thu
            </button>
            <button
              onClick={() => setStatusFilter('UNPAID')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'UNPAID' ? 'bg-white shadow-xs text-amber-700 font-bold' : 'text-slate-500'
              }`}
            >
              Chưa thu
            </button>
            <button
              onClick={() => setStatusFilter('OVERDUE')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'OVERDUE' ? 'bg-white shadow-xs text-rose-700 font-bold' : 'text-slate-500'
              }`}
            >
              Quá hạn
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenQuickMeter}
            className="inline-flex items-center space-x-1.5 px-3 py-2 border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold rounded-xl transition-colors shadow-xs"
            title="Ghi chỉ số điện nước cuối tháng hàng loạt"
          >
            <Zap className="w-3.5 h-3.5 text-teal-600" />
            <span>Ghi điện nước nhanh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-xs"
            title="Xuất danh sách hóa đơn ra Excel/CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV</span>
          </button>

          <button
            onClick={onCreateInvoice}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Lập hóa đơn</span>
          </button>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Phòng / Khách</th>
                <th className="px-4 py-3">Kỳ thu</th>
                <th className="px-4 py-3">Điện (kWh)</th>
                <th className="px-4 py-3">Nước</th>
                <th className="px-4 py-3">Tổng cộng</th>
                <th className="px-4 py-3">Đã thu / Còn lại</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => {
                const room = rooms.find((r) => r.id === inv.roomId);
                const tenant = tenants.find((t) => t.id === inv.tenantId);
                const electricKwh = Math.max(0, inv.currElectric - inv.prevElectric);
                const remaining = Math.max(0, inv.totalAmount - inv.paidAmount);

                return (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Room & Tenant */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{room?.name || 'Phòng ?'}</div>
                      <div className="text-xs text-slate-500">
                        {tenant ? `${tenant.fullName} • ${tenant.phone}` : 'Chưa có thông tin khách'}
                      </div>
                    </td>

                    {/* Month */}
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                      {formatMonthVN(inv.month)}
                      <div className="text-[11px] text-slate-400 font-normal">
                        Hạn: {formatDateVN(inv.dueDate)}
                      </div>
                    </td>

                    {/* Electric */}
                    <td className="px-4 py-3 text-xs">
                      <div className="font-semibold text-slate-800">
                        {electricKwh} kWh
                      </div>
                      <div className="text-[11px] text-slate-500">
                        ({inv.prevElectric} ➜ {inv.currElectric}) = {formatVND(inv.electricTotal)}
                      </div>
                    </td>

                    {/* Water */}
                    <td className="px-4 py-3 text-xs">
                      <div className="font-semibold text-slate-800">
                        {inv.waterType === 'METER'
                          ? `${Math.max(0, inv.currWater - inv.prevWater)} m³`
                          : `${inv.waterCount} người`}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {formatVND(inv.waterTotal)}
                      </div>
                    </td>

                    {/* Grand Total */}
                    <td className="px-4 py-3 font-black text-slate-900 text-sm">
                      {formatVND(inv.totalAmount)}
                    </td>

                    {/* Paid & Remaining */}
                    <td className="px-4 py-3 text-xs">
                      <div className="text-emerald-700 font-bold">
                        Đã trả: {formatVND(inv.paidAmount)}
                      </div>
                      {remaining > 0 && (
                        <div className="text-rose-600 font-semibold">
                          Còn nợ: {formatVND(remaining)}
                        </div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3">
                      {inv.status === 'PAID' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Đã thu</span>
                        </span>
                      ) : inv.status === 'PARTIAL' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Trả một phần</span>
                        </span>
                      ) : inv.status === 'OVERDUE' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>Quá hạn</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>Chưa thu</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center space-x-1">
                        {/* Quick toggle paid status */}
                        {inv.status !== 'PAID' ? (
                          <button
                            onClick={() => onUpdateInvoiceStatus(inv.id, 'PAID', inv.totalAmount)}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold border border-emerald-200 transition-colors"
                            title="Xác nhận đã thu đủ tiền"
                          >
                            <Check className="w-3.5 h-3.5 inline mr-0.5" />
                            Đã nhận
                          </button>
                        ) : (
                          <button
                            onClick={() => onUpdateInvoiceStatus(inv.id, 'UNPAID', 0)}
                            className="px-2 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-[11px] transition-colors"
                            title="Chuyển lại trạng thái chưa thu"
                          >
                            Hủy thu
                          </button>
                        )}

                        {/* Print / View QR */}
                        <button
                          onClick={() => onPrintInvoice(inv)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="In phiếu thu / Xem mã VietQR"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Send Zalo */}
                        {tenant && (
                          <button
                            onClick={() => handleQuickZalo(inv)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Chép tin nhắn và mở Zalo gửi khách"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        )}

                        {/* Edit */}
                        <button
                          onClick={() => onEditInvoice(inv)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Sửa hóa đơn"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => {
                            if (confirm('Bạn có chắc chắn muốn xóa hóa đơn này?')) {
                              onDeleteInvoice(inv.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa hóa đơn"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="p-10 text-center text-slate-500">
            Không tìm thấy hóa đơn nào cho bộ lọc này.
          </div>
        )}
      </div>
    </div>
  );
};
