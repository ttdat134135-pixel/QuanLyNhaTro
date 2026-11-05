import React, { useState } from 'react';
import { 
  BarChart3, 
  Calendar, 
  Layers, 
  Home, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Droplets, 
  Printer, 
  Download,
  Filter
} from 'lucide-react';
import { Invoice, Room, Tenant, LandlordSettings } from '../../types';
import { formatVND, formatNumber, formatMonthVN, formatDateVN } from '../../utils/formatters';
import { exportToCSV } from '../../utils/storage';

interface ReportViewProps {
  invoices: Invoice[];
  rooms: Room[];
  tenants: Tenant[];
  settings: LandlordSettings;
}

export const ReportView: React.FC<ReportViewProps> = ({
  invoices,
  rooms,
  tenants,
  settings,
}) => {
  // Extract all available years and months
  const allMonths = Array.from(new Set(invoices.map((i) => i.month))).sort().reverse();
  const allYears = Array.from(new Set(invoices.map((i) => i.month.split('-')[0]))).sort().reverse();
  const allGroups = Array.from(new Set(rooms.map((r) => r.group))).filter(Boolean);

  // Time filter type: 'MONTH' | 'YEAR' | 'ALL'
  const [timeFilterType, setTimeFilterType] = useState<'MONTH' | 'YEAR' | 'ALL'>('MONTH');
  const [selectedMonth, setSelectedMonth] = useState<string>(allMonths[0] || '2025-05');
  const [selectedYear, setSelectedYear] = useState<string>(allYears[0] || '2025');

  // Scope filter: 'ALL' | 'GROUP' | 'ROOM'
  const [scopeFilterType, setScopeFilterType] = useState<'ALL' | 'GROUP' | 'ROOM'>('ALL');
  const [selectedGroup, setSelectedGroup] = useState<string>(allGroups[0] || 'Tầng 1');
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || '');

  // Filter invoices based on time and scope
  const filteredInvoices = invoices.filter((inv) => {
    // Time filter
    let matchTime = true;
    if (timeFilterType === 'MONTH') {
      matchTime = inv.month === selectedMonth;
    } else if (timeFilterType === 'YEAR') {
      matchTime = inv.month.startsWith(selectedYear);
    }

    // Scope filter
    let matchScope = true;
    if (scopeFilterType === 'GROUP') {
      const room = rooms.find((r) => r.id === inv.roomId);
      matchScope = room?.group === selectedGroup;
    } else if (scopeFilterType === 'ROOM') {
      matchScope = inv.roomId === selectedRoomId;
    }

    return matchTime && matchScope;
  });

  // Calculate Metrics
  const totalBilled = filteredInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const totalCollected = filteredInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const totalDebt = Math.max(0, totalBilled - totalCollected);
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  // Breakdown by service
  const totalRoomFees = filteredInvoices.reduce((sum, inv) => sum + (inv.roomFee || 0), 0);
  const totalElectricFees = filteredInvoices.reduce((sum, inv) => sum + (inv.electricTotal || 0), 0);
  const totalWaterFees = filteredInvoices.reduce((sum, inv) => sum + (inv.waterTotal || 0), 0);
  const totalInternetFees = filteredInvoices.reduce((sum, inv) => sum + (inv.internetFee || 0), 0);
  const totalGarbageFees = filteredInvoices.reduce((sum, inv) => sum + (inv.garbageFee || 0), 0);
  const totalOtherFees = filteredInvoices.reduce((sum, inv) => sum + (inv.otherFee || 0), 0);
  const totalDiscounts = filteredInvoices.reduce((sum, inv) => sum + (inv.discount || 0), 0);

  // Consumption metrics
  const totalElectricKwh = filteredInvoices.reduce(
    (sum, inv) => sum + Math.max(0, inv.currElectric - inv.prevElectric),
    0
  );
  const totalWaterM3 = filteredInvoices.reduce((sum, inv) => {
    if (inv.waterType === 'METER') {
      return sum + Math.max(0, inv.currWater - inv.prevWater);
    }
    return sum;
  }, 0);

  // Room occupancy in selected scope
  const targetRooms = rooms.filter((r) => {
    if (scopeFilterType === 'GROUP') return r.group === selectedGroup;
    if (scopeFilterType === 'ROOM') return r.id === selectedRoomId;
    return true;
  });
  const occupiedCount = targetRooms.filter((r) => r.status === 'OCCUPIED').length;
  const occupancyRate = targetRooms.length > 0 ? Math.round((occupiedCount / targetRooms.length) * 100) : 0;

  // Monthly breakdown for bar chart (if YEAR or ALL selected, or previous months)
  const monthlyData: { [key: string]: { billed: number; collected: number } } = {};
  filteredInvoices.forEach((inv) => {
    if (!monthlyData[inv.month]) {
      monthlyData[inv.month] = { billed: 0, collected: 0 };
    }
    monthlyData[inv.month].billed += inv.totalAmount || 0;
    monthlyData[inv.month].collected += inv.paidAmount || 0;
  });

  const chartMonths = Object.keys(monthlyData).sort();
  const maxMonthValue = Math.max(
    ...chartMonths.map((m) => Math.max(monthlyData[m].billed, monthlyData[m].collected)),
    1
  );

  // Breakdown percentages
  const grandSum = totalRoomFees + totalElectricFees + totalWaterFees + totalInternetFees + totalGarbageFees + totalOtherFees;
  const roomPct = grandSum > 0 ? Math.round((totalRoomFees / grandSum) * 100) : 0;
  const electricPct = grandSum > 0 ? Math.round((totalElectricFees / grandSum) * 100) : 0;
  const waterPct = grandSum > 0 ? Math.round((totalWaterFees / grandSum) * 100) : 0;
  const otherPct = Math.max(0, 100 - roomPct - electricPct - waterPct);

  // Room Ranking by revenue
  const roomRevenues: { [roomId: string]: { name: string; group: string; amount: number; paid: number } } = {};
  filteredInvoices.forEach((inv) => {
    const room = rooms.find((r) => r.id === inv.roomId);
    const rId = inv.roomId;
    if (!roomRevenues[rId]) {
      roomRevenues[rId] = {
        name: room?.name || 'Phòng ?',
        group: room?.group || '',
        amount: 0,
        paid: 0,
      };
    }
    roomRevenues[rId].amount += inv.totalAmount;
    roomRevenues[rId].paid += inv.paidAmount;
  });

  const rankedRooms = Object.values(roomRevenues).sort((a, b) => b.amount - a.amount);

  // Handle Export CSV
  const handleExportCSV = () => {
    const title = `Báo cáo doanh thu ${
      timeFilterType === 'MONTH'
        ? formatMonthVN(selectedMonth)
        : timeFilterType === 'YEAR'
        ? `Năm ${selectedYear}`
        : 'Toàn bộ'
    } - ${
      scopeFilterType === 'GROUP'
        ? `Nhóm ${selectedGroup}`
        : scopeFilterType === 'ROOM'
        ? rooms.find((r) => r.id === selectedRoomId)?.name
        : 'Tất cả phòng'
    }`;

    const headers = [
      'Mã HĐ',
      'Kỳ',
      'Phòng',
      'Tiền phòng',
      'Tiền điện',
      'Tiền nước',
      'Dịch vụ khác',
      'Giảm giá',
      'Tổng tiền',
      'Đã thu',
      'Còn nợ',
      'Trạng thái',
    ];

    const rows = filteredInvoices.map((inv) => {
      const room = rooms.find((r) => r.id === inv.roomId);
      return [
        inv.id,
        inv.month,
        room?.name || '',
        String(inv.roomFee),
        String(inv.electricTotal),
        String(inv.waterTotal),
        String(inv.internetFee + inv.garbageFee + inv.otherFee),
        String(inv.discount),
        String(inv.totalAmount),
        String(inv.paidAmount),
        String(Math.max(0, inv.totalAmount - inv.paidAmount)),
        inv.status,
      ];
    });

    exportToCSV(`bao-cao-doanh-thu-${new Date().toISOString().slice(0, 10)}.csv`, [
      [title],
      [],
      headers,
      ...rows,
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 no-print">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              Tùy chọn Báo cáo & Thống kê
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Excel/CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Báo Cáo</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Time Filter */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600">
              1. Khoảng thời gian:
            </label>
            <div className="flex items-center space-x-2">
              <select
                value={timeFilterType}
                onChange={(e) => setTimeFilterType(e.target.value as any)}
                className="py-1.5 px-3 border border-slate-300 rounded-lg text-xs bg-white font-medium"
              >
                <option value="MONTH">Theo tháng cụ thể</option>
                <option value="YEAR">Theo cả năm</option>
                <option value="ALL">Toàn bộ thời gian</option>
              </select>

              {timeFilterType === 'MONTH' && (
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="py-1.5 px-3 border border-emerald-300 rounded-lg text-xs bg-emerald-50 font-bold text-emerald-900"
                >
                  {allMonths.map((m) => (
                    <option key={m} value={m}>
                      {formatMonthVN(m)}
                    </option>
                  ))}
                </select>
              )}

              {timeFilterType === 'YEAR' && (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="py-1.5 px-3 border border-emerald-300 rounded-lg text-xs bg-emerald-50 font-bold text-emerald-900"
                >
                  {allYears.map((y) => (
                    <option key={y} value={y}>
                      Năm {y}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* 2. Scope Filter */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600">
              2. Phạm vi phòng trọ:
            </label>
            <div className="flex items-center space-x-2">
              <select
                value={scopeFilterType}
                onChange={(e) => setScopeFilterType(e.target.value as any)}
                className="py-1.5 px-3 border border-slate-300 rounded-lg text-xs bg-white font-medium"
              >
                <option value="ALL">Tất cả các phòng ({rooms.length})</option>
                <option value="GROUP">Theo nhóm / tầng</option>
                <option value="ROOM">Theo phòng cụ thể</option>
              </select>

              {scopeFilterType === 'GROUP' && (
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="py-1.5 px-3 border border-blue-300 rounded-lg text-xs bg-blue-50 font-bold text-blue-900"
                >
                  {allGroups.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              )}

              {scopeFilterType === 'ROOM' && (
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="py-1.5 px-3 border border-blue-300 rounded-lg text-xs bg-blue-50 font-bold text-blue-900"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.group})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="w-2 h-full bg-emerald-500 absolute left-0 top-0"></div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Doanh thu thực tế (Đã thu)
          </span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">
            {formatVND(totalCollected)}
          </span>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Tiến độ:</span>
            <strong className="text-emerald-700">{collectionRate}% tổng tiền</strong>
          </div>
        </div>

        {/* Total Debt */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="w-2 h-full bg-rose-500 absolute left-0 top-0"></div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Công nợ còn lại (Chưa thu)
          </span>
          <span className="text-2xl font-black text-rose-600 mt-1 block">
            {formatVND(totalDebt)}
          </span>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Tổng phát sinh:</span>
            <strong className="text-slate-800">{formatVND(totalBilled)}</strong>
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="w-2 h-full bg-blue-500 absolute left-0 top-0"></div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Tỷ lệ lấp đầy phòng
          </span>
          <span className="text-2xl font-black text-blue-600 mt-1 block">
            {occupancyRate}%
          </span>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Đang thuê:</span>
            <strong className="text-slate-800">{occupiedCount}/{targetRooms.length} phòng</strong>
          </div>
        </div>

        {/* Utility Usage */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="w-2 h-full bg-amber-500 absolute left-0 top-0"></div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Tiêu thụ Điện & Nước
          </span>
          <div className="mt-1 flex items-baseline space-x-3">
            <span className="text-lg font-bold text-amber-700">
              ⚡ {formatNumber(totalElectricKwh)} <span className="text-xs font-normal">kWh</span>
            </span>
            <span className="text-lg font-bold text-blue-700">
              💧 {formatNumber(totalWaterM3)} <span className="text-xs font-normal">m³</span>
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Tiền điện + nước:</span>
            <strong className="text-slate-800">{formatVND(totalElectricFees + totalWaterFees)}</strong>
          </div>
        </div>
      </div>

      {/* Visual Charts & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Biểu đồ doanh thu theo tháng</span>
            </h4>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1">
                <span className="w-3 h-3 bg-slate-300 rounded-sm"></span>
                <span className="text-slate-500">Phát sinh</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-3 h-3 bg-emerald-500 rounded-sm"></span>
                <span className="text-slate-700 font-semibold">Đã thu</span>
              </span>
            </div>
          </div>

          {/* Bar Chart Container */}
          {chartMonths.length > 0 ? (
            <div className="h-64 flex items-end justify-around gap-2 pt-6 pb-2 border-b border-slate-200">
              {chartMonths.map((m) => {
                const item = monthlyData[m];
                const billedHeight = Math.max(8, Math.round((item.billed / maxMonthValue) * 200));
                const collectedHeight = Math.max(8, Math.round((item.collected / maxMonthValue) * 200));

                return (
                  <div key={m} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-12 bg-slate-900 text-white text-[11px] py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-lg">
                      <div>{formatMonthVN(m)}</div>
                      <div>Đã thu: {formatVND(item.collected)}</div>
                      <div>Tổng: {formatVND(item.billed)}</div>
                    </div>

                    <div className="w-full max-w-[48px] flex items-end justify-center space-x-1">
                      {/* Billed bar */}
                      <div
                        className="w-1/2 bg-slate-200 hover:bg-slate-300 rounded-t-md transition-all"
                        style={{ height: `${billedHeight}px` }}
                      ></div>
                      {/* Collected bar */}
                      <div
                        className="w-1/2 bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all shadow-xs"
                        style={{ height: `${collectedHeight}px` }}
                      ></div>
                    </div>

                    <span className="text-[11px] font-semibold text-slate-600 mt-2 rotate-[-25px] sm:rotate-0">
                      {m.slice(5)}/{m.slice(2, 4)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              Chưa có dữ liệu cho khoảng thời gian này
            </div>
          )}
        </div>

        {/* Revenue Structure Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-3">
              Cơ cấu các khoản thu
            </h4>

            {/* Proportion Bar */}
            <div className="w-full h-4 rounded-full bg-slate-100 flex overflow-hidden shadow-inner mb-4">
              <div
                className="bg-emerald-500 transition-all"
                style={{ width: `${roomPct}%` }}
                title={`Tiền phòng: ${roomPct}%`}
              ></div>
              <div
                className="bg-amber-500 transition-all"
                style={{ width: `${electricPct}%` }}
                title={`Tiền điện: ${electricPct}%`}
              ></div>
              <div
                className="bg-blue-500 transition-all"
                style={{ width: `${waterPct}%` }}
                title={`Tiền nước: ${waterPct}%`}
              ></div>
              <div
                className="bg-purple-500 transition-all"
                style={{ width: `${otherPct}%` }}
                title={`Khác: ${otherPct}%`}
              ></div>
            </div>

            {/* Itemized List */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-600">Tiền phòng ({roomPct}%)</span>
                </span>
                <span className="font-bold text-slate-800">{formatVND(totalRoomFees)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-slate-600">Tiền điện ({electricPct}%)</span>
                </span>
                <span className="font-bold text-slate-800">{formatVND(totalElectricFees)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span className="text-slate-600">Tiền nước ({waterPct}%)</span>
                </span>
                <span className="font-bold text-slate-800">{formatVND(totalWaterFees)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  <span className="text-slate-600">Wifi, rác & dịch vụ khác</span>
                </span>
                <span className="font-bold text-slate-800">
                  {formatVND(totalInternetFees + totalGarbageFees + totalOtherFees)}
                </span>
              </div>

              {totalDiscounts > 0 && (
                <div className="flex items-center justify-between text-rose-600 pt-1 border-t border-slate-100">
                  <span>Giảm trừ / Khuyến mãi</span>
                  <span className="font-bold">-{formatVND(totalDiscounts)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
            <span className="text-emerald-900 block font-semibold">Lợi nhuận ước tính:</span>
            <span className="text-emerald-950 text-base font-black">
              {formatVND(totalCollected)}
            </span>
          </div>
        </div>
      </div>

      {/* Room Revenue Ranking */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h4 className="font-bold text-slate-800 text-sm">
            Bảng kê chi tiết doanh thu theo từng phòng
          </h4>
          <span className="text-xs text-slate-500 font-medium">
            {rankedRooms.length} phòng có phát sinh
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase">
              <tr>
                <th className="px-4 py-3">Phòng</th>
                <th className="px-4 py-3">Nhóm / Tầng</th>
                <th className="px-4 py-3">Tổng phát sinh</th>
                <th className="px-4 py-3">Đã thu</th>
                <th className="px-4 py-3">Còn nợ</th>
                <th className="px-4 py-3">Tỷ lệ thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rankedRooms.map((r, idx) => {
                const debt = Math.max(0, r.amount - r.paid);
                const rate = r.amount > 0 ? Math.round((r.paid / r.amount) * 100) : 0;

                return (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">{r.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{r.group}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {formatVND(r.amount)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">
                      {formatVND(r.paid)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-rose-600">
                      {debt > 0 ? formatVND(debt) : '0 đ'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              rate === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${rate}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-slate-700">{rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
