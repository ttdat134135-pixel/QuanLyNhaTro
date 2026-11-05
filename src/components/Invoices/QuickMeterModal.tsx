import React, { useState } from 'react';
import { X, Check, Zap, Droplets, Save, ArrowRight } from 'lucide-react';
import { Invoice, LandlordSettings, Room, Tenant } from '../../types';
import { formatVND, formatNumber } from '../../utils/formatters';

interface QuickMeterModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  tenants: Tenant[];
  invoices: Invoice[];
  settings: LandlordSettings;
  onSaveBatch: (updatedRooms: Room[], newInvoices: Invoice[]) => void;
}

interface MeterRowState {
  roomId: string;
  prevElectric: number;
  currElectric: number;
  prevWater: number;
  currWater: number;
  waterCount: number;
}

export const QuickMeterModal: React.FC<QuickMeterModalProps> = ({
  isOpen,
  onClose,
  rooms,
  tenants,
  invoices,
  settings,
  onSaveBatch,
}) => {
  if (!isOpen) return null;

  // Selected month (e.g. current month)
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  // Filter occupied rooms
  const occupiedRooms = rooms.filter((r) => r.status === 'OCCUPIED');

  // Initialize meter state from existing rooms & existing invoices for this month
  const [meterRows, setMeterRows] = useState<MeterRowState[]>(() => {
    return occupiedRooms.map((room) => {
      const existingInv = invoices.find(
        (inv) => inv.roomId === room.id && inv.month === currentMonthStr
      );

      return {
        roomId: room.id,
        prevElectric: existingInv ? existingInv.prevElectric : room.lastElectricNumber,
        currElectric: existingInv ? existingInv.currElectric : room.lastElectricNumber + 50,
        prevWater: existingInv ? existingInv.prevWater : room.lastWaterNumber,
        currWater: existingInv ? existingInv.currWater : room.lastWaterNumber + 5,
        waterCount: room.currentRentersCount || 1,
      };
    });
  });

  const handleElectricChange = (roomId: string, val: number) => {
    setMeterRows((prev) =>
      prev.map((row) => (row.roomId === roomId ? { ...row, currElectric: val } : row))
    );
  };

  const handleWaterChange = (roomId: string, val: number) => {
    setMeterRows((prev) =>
      prev.map((row) => (row.roomId === roomId ? { ...row, currWater: val } : row))
    );
  };

  const handleSave = () => {
    const updatedRooms = [...rooms];
    const generatedInvoices: Invoice[] = [];

    const dueDate = `${selectedMonth}-${String(settings.dueDayOfMonth || 5).padStart(2, '0')}`;
    const todayStr = new Date().toISOString().slice(0, 10);

    meterRows.forEach((row) => {
      const roomIndex = updatedRooms.findIndex((r) => r.id === row.roomId);
      if (roomIndex === -1) return;

      const room = updatedRooms[roomIndex];
      const tenant = tenants.find((t) => t.roomId === room.id && t.status === 'ACTIVE');

      // Update room's last meter readings
      updatedRooms[roomIndex] = {
        ...room,
        lastElectricNumber: row.currElectric,
        lastWaterNumber: row.currWater,
      };

      // Check if invoice already exists for this room & month
      const existingInv = invoices.find(
        (inv) => inv.roomId === room.id && inv.month === selectedMonth
      );

      const electricKwh = Math.max(0, row.currElectric - row.prevElectric);
      const electricTotal = electricKwh * settings.defaultElectricRate;

      let waterTotal = 0;
      if (settings.waterBillingType === 'METER') {
        const waterM3 = Math.max(0, row.currWater - row.prevWater);
        waterTotal = waterM3 * settings.defaultWaterRate;
      } else if (settings.waterBillingType === 'PER_PERSON') {
        waterTotal = row.waterCount * settings.defaultWaterRate;
      } else {
        waterTotal = settings.defaultWaterRate;
      }

      const roomFee = room.price;
      const internetFee = settings.defaultInternetFee;
      const garbageFee = settings.defaultGarbageFee;
      const otherFee = existingInv?.otherFee || 0;
      const discount = existingInv?.discount || 0;
      const grandTotal = roomFee + electricTotal + waterTotal + internetFee + garbageFee + otherFee - discount;

      const inv: Invoice = {
        id: existingInv ? existingInv.id : `inv-${selectedMonth}-${room.id}-${Date.now().toString().slice(-4)}`,
        roomId: room.id,
        tenantId: tenant ? tenant.id : existingInv?.tenantId || '',
        month: selectedMonth,
        issueDate: existingInv?.issueDate || todayStr,
        dueDate: existingInv?.dueDate || dueDate,
        roomFee,
        prevElectric: row.prevElectric,
        currElectric: row.currElectric,
        electricPrice: settings.defaultElectricRate,
        electricTotal,
        waterType: settings.waterBillingType,
        prevWater: row.prevWater,
        currWater: row.currWater,
        waterPrice: settings.defaultWaterRate,
        waterCount: settings.waterBillingType === 'METER' ? Math.max(0, row.currWater - row.prevWater) : row.waterCount,
        waterTotal,
        internetFee,
        garbageFee,
        otherFee,
        otherFeeDescription: existingInv?.otherFeeDescription || '',
        discount,
        totalAmount: grandTotal,
        paidAmount: existingInv ? existingInv.paidAmount : 0,
        status: existingInv ? existingInv.status : 'UNPAID',
        notes: existingInv?.notes || '',
      };

      generatedInvoices.push(inv);
    });

    onSaveBatch(updatedRooms, generatedInvoices);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in duration-200">
        <div className="px-6 py-4 bg-teal-50 border-b border-teal-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-teal-950">
                Ghi điện nước nhanh hàng loạt
              </h2>
              <p className="text-xs text-teal-700">
                Nhập số điện, nước cho tất cả các phòng đang thuê để tự động sinh hóa đơn tháng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-teal-700 hover:text-teal-900 hover:bg-teal-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Month selector & unit rates info */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-2">
              <label className="text-xs font-bold text-slate-700">Kỳ chốt số:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white font-bold text-slate-800"
              />
            </div>

            <div className="text-xs text-slate-600 flex items-center space-x-4">
              <span>
                ⚡ Giá điện: <strong className="text-amber-700">{formatVND(settings.defaultElectricRate)}/kWh</strong>
              </span>
              <span>
                💧 Giá nước: <strong className="text-blue-700">{formatVND(settings.defaultWaterRate)}/{settings.waterBillingType === 'METER' ? 'm³' : 'người'}</strong>
              </span>
            </div>
          </div>

          {/* Meter Entry Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[55vh] overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2.5">Phòng / Khách thuê</th>
                  <th className="px-3 py-2.5 text-center bg-amber-50 text-amber-900 border-x border-amber-200/50">
                    ⚡ Điện số cũ
                  </th>
                  <th className="px-3 py-2.5 text-center bg-amber-50 text-amber-900 border-r border-amber-200/50">
                    ⚡ Điện số mới
                  </th>
                  <th className="px-3 py-2.5 text-center bg-amber-50 text-amber-900 border-r border-amber-200/50">
                    Tiêu thụ (kWh)
                  </th>
                  <th className="px-3 py-2.5 text-center bg-blue-50 text-blue-900 border-r border-blue-200/50">
                    💧 Nước số cũ
                  </th>
                  <th className="px-3 py-2.5 text-center bg-blue-50 text-blue-900 border-r border-blue-200/50">
                    💧 Nước số mới
                  </th>
                  <th className="px-3 py-2.5 text-center bg-blue-50 text-blue-900">
                    Tiêu thụ (m³)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {meterRows.map((row) => {
                  const room = rooms.find((r) => r.id === row.roomId);
                  const tenant = tenants.find((t) => t.roomId === row.roomId && t.status === 'ACTIVE');
                  const kwh = Math.max(0, row.currElectric - row.prevElectric);
                  const m3 = Math.max(0, row.currWater - row.prevWater);

                  return (
                    <tr key={row.roomId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2">
                        <div className="font-bold text-slate-800 text-sm">{room?.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {tenant ? tenant.fullName : 'Chưa gán khách'}
                        </div>
                      </td>

                      {/* Electric old */}
                      <td className="px-3 py-2 text-center font-medium bg-amber-50/20 text-slate-600 border-x border-slate-100">
                        {row.prevElectric}
                      </td>

                      {/* Electric new input */}
                      <td className="px-2 py-2 text-center bg-amber-50/20 border-r border-slate-100">
                        <input
                          type="number"
                          min={row.prevElectric}
                          value={row.currElectric}
                          onChange={(e) => handleElectricChange(row.roomId, Number(e.target.value) || 0)}
                          className="w-20 px-2 py-1 text-center font-bold text-sm border border-amber-300 rounded-lg bg-white focus:outline-amber-600"
                        />
                      </td>

                      {/* kWh diff */}
                      <td className="px-3 py-2 text-center font-bold text-amber-700 bg-amber-50/20 border-r border-slate-100">
                        +{kwh} kWh
                      </td>

                      {/* Water old */}
                      <td className="px-3 py-2 text-center font-medium bg-blue-50/20 text-slate-600 border-r border-slate-100">
                        {row.prevWater}
                      </td>

                      {/* Water new input */}
                      <td className="px-2 py-2 text-center bg-blue-50/20 border-r border-slate-100">
                        <input
                          type="number"
                          min={row.prevWater}
                          value={row.currWater}
                          onChange={(e) => handleWaterChange(row.roomId, Number(e.target.value) || 0)}
                          className="w-20 px-2 py-1 text-center font-bold text-sm border border-blue-300 rounded-lg bg-white focus:outline-blue-600"
                        />
                      </td>

                      {/* m3 diff */}
                      <td className="px-3 py-2 text-center font-bold text-blue-700 bg-blue-50/20">
                        +{m3} m³
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Tổng cộng {meterRows.length} phòng đang thuê được cập nhật
            </span>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center space-x-1.5 px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Lưu & Tạo hóa đơn tháng {selectedMonth}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
