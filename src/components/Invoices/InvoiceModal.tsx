import React, { useState, useEffect } from 'react';
import { X, Check, Calculator } from 'lucide-react';
import { Invoice, LandlordSettings, Room, Tenant, WaterBillingType } from '../../types';
import { formatVND, numberToVietnameseWords } from '../../utils/formatters';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Invoice) => void;
  initialInvoice?: Invoice | null;
  rooms: Room[];
  tenants: Tenant[];
  settings: LandlordSettings;
  defaultRoomId?: string;
  defaultMonth?: string;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialInvoice,
  rooms,
  tenants,
  settings,
  defaultRoomId,
  defaultMonth,
}) => {
  if (!isOpen) return null;

  // Initial state setup
  const [roomId, setRoomId] = useState(
    initialInvoice?.roomId || defaultRoomId || rooms.find((r) => r.status === 'OCCUPIED')?.id || rooms[0]?.id || ''
  );
  
  const selectedRoom = rooms.find((r) => r.id === roomId);
  const activeTenant = tenants.find((t) => t.roomId === roomId && t.status === 'ACTIVE');

  const [month, setMonth] = useState(
    initialInvoice?.month || defaultMonth || new Date().toISOString().slice(0, 7)
  );

  const defaultDueDate = `${month}-${String(settings.dueDayOfMonth || 5).padStart(2, '0')}`;
  const [issueDate, setIssueDate] = useState(initialInvoice?.issueDate || new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(initialInvoice?.dueDate || defaultDueDate);

  // Fees
  const [roomFee, setRoomFee] = useState<number>(
    initialInvoice ? initialInvoice.roomFee : selectedRoom?.price || 3000000
  );

  // Electric
  const [prevElectric, setPrevElectric] = useState<number>(
    initialInvoice ? initialInvoice.prevElectric : selectedRoom?.lastElectricNumber || 0
  );
  const [currElectric, setCurrElectric] = useState<number>(
    initialInvoice ? initialInvoice.currElectric : (selectedRoom?.lastElectricNumber || 0) + 80
  );
  const [electricPrice, setElectricPrice] = useState<number>(
    initialInvoice ? initialInvoice.electricPrice : settings.defaultElectricRate || 3500
  );

  // Water
  const [waterType, setWaterType] = useState<WaterBillingType>(
    initialInvoice ? initialInvoice.waterType : settings.waterBillingType || 'METER'
  );
  const [prevWater, setPrevWater] = useState<number>(
    initialInvoice ? initialInvoice.prevWater : selectedRoom?.lastWaterNumber || 0
  );
  const [currWater, setCurrWater] = useState<number>(
    initialInvoice ? initialInvoice.currWater : (selectedRoom?.lastWaterNumber || 0) + 7
  );
  const [waterPrice, setWaterPrice] = useState<number>(
    initialInvoice ? initialInvoice.waterPrice : settings.defaultWaterRate || 15000
  );
  const [waterCount, setWaterCount] = useState<number>(
    initialInvoice ? initialInvoice.waterCount : selectedRoom?.currentRentersCount || 2
  );

  // Other fees
  const [internetFee, setInternetFee] = useState<number>(
    initialInvoice ? initialInvoice.internetFee : settings.defaultInternetFee || 50000
  );
  const [garbageFee, setGarbageFee] = useState<number>(
    initialInvoice ? initialInvoice.garbageFee : settings.defaultGarbageFee || 30000
  );
  const [otherFee, setOtherFee] = useState<number>(initialInvoice ? initialInvoice.otherFee : 0);
  const [otherFeeDescription, setOtherFeeDescription] = useState<string>(
    initialInvoice?.otherFeeDescription || ''
  );
  const [discount, setDiscount] = useState<number>(initialInvoice ? initialInvoice.discount : 0);

  // Status & payment
  const [status, setStatus] = useState<Invoice['status']>(initialInvoice?.status || 'UNPAID');
  const [paidAmount, setPaidAmount] = useState<number>(initialInvoice ? initialInvoice.paidAmount : 0);
  const [paymentMethod, setPaymentMethod] = useState<Invoice['paymentMethod']>(
    initialInvoice?.paymentMethod || 'TRANSFER'
  );
  const [notes, setNotes] = useState(initialInvoice?.notes || '');

  // Calculate totals
  const electricKwh = Math.max(0, currElectric - prevElectric);
  const electricTotal = electricKwh * electricPrice;

  let calculatedWaterTotal = 0;
  if (waterType === 'METER') {
    const waterM3 = Math.max(0, currWater - prevWater);
    calculatedWaterTotal = waterM3 * waterPrice;
  } else if (waterType === 'PER_PERSON') {
    calculatedWaterTotal = waterCount * waterPrice;
  } else {
    calculatedWaterTotal = waterPrice;
  }

  const grandTotal = Math.max(
    0,
    roomFee + electricTotal + calculatedWaterTotal + internetFee + garbageFee + otherFee - discount
  );

  // When room changes, update defaults
  const handleRoomChange = (newRoomId: string) => {
    setRoomId(newRoomId);
    const r = rooms.find((rm) => rm.id === newRoomId);
    if (r) {
      setRoomFee(r.price);
      setPrevElectric(r.lastElectricNumber);
      setCurrElectric(r.lastElectricNumber + 50);
      setPrevWater(r.lastWaterNumber);
      setCurrWater(r.lastWaterNumber + 5);
      setWaterCount(r.currentRentersCount || 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) return;

    const tenant = activeTenant || tenants.find((t) => t.roomId === roomId);

    const invoiceData: Invoice = {
      id: initialInvoice?.id || `inv-${month}-${roomId}-${Date.now().toString().slice(-4)}`,
      roomId,
      tenantId: tenant ? tenant.id : '',
      month,
      issueDate,
      dueDate,
      roomFee,
      prevElectric,
      currElectric,
      electricPrice,
      electricTotal,
      waterType,
      prevWater,
      currWater,
      waterPrice,
      waterCount: waterType === 'METER' ? Math.max(0, currWater - prevWater) : waterCount,
      waterTotal: calculatedWaterTotal,
      internetFee,
      garbageFee,
      otherFee,
      otherFeeDescription: otherFeeDescription.trim(),
      discount,
      totalAmount: grandTotal,
      paidAmount: status === 'PAID' ? grandTotal : paidAmount,
      status:
        status === 'PAID'
          ? 'PAID'
          : paidAmount >= grandTotal && grandTotal > 0
          ? 'PAID'
          : paidAmount > 0
          ? 'PARTIAL'
          : status,
      paymentMethod: status !== 'UNPAID' ? paymentMethod : undefined,
      paidDate: status === 'PAID' || paidAmount > 0 ? new Date().toISOString().slice(0, 10) : undefined,
      notes: notes.trim(),
    };

    onSave(invoiceData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in duration-200">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              {initialInvoice ? 'Chỉnh sửa hóa đơn thu tiền' : 'Lập hóa đơn tiền phòng & dịch vụ'}
            </h2>
            <p className="text-xs text-slate-500">
              Tự động tính điện nước, tổng tiền và tạo mã QR chuyển khoản VietQR
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Room & Period */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chọn phòng <span className="text-rose-500">*</span>
              </label>
              <select
                value={roomId}
                onChange={(e) => handleRoomChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium focus:outline-emerald-600"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.group}) {r.status === 'VACANT' ? '[Phòng trống]' : ''}
                  </option>
                ))}
              </select>
              {activeTenant ? (
                <span className="text-[11px] text-emerald-600 block mt-1 truncate">
                  👤 {activeTenant.fullName} ({activeTenant.phone})
                </span>
              ) : (
                <span className="text-[11px] text-amber-600 block mt-1">
                  ⚠️ Phòng này chưa có khách thuê active
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kỳ thu (Tháng/Năm) <span className="text-rose-500">*</span>
              </label>
              <input
                type="month"
                required
                value={month}
                onChange={(e) => {
                  setMonth(e.target.value);
                  setDueDate(`${e.target.value}-${String(settings.dueDayOfMonth || 5).padStart(2, '0')}`);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-semibold text-slate-800 focus:outline-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hạn thanh toán
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-emerald-600"
              />
            </div>
          </div>

          {/* Room Fee */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                1. Tiền thuê phòng (VNĐ)
              </label>
              <span className="text-sm font-black text-emerald-700">{formatVND(roomFee)}</span>
            </div>
            <input
              type="number"
              min="0"
              step="50000"
              value={roomFee}
              onChange={(e) => setRoomFee(Number(e.target.value) || 0)}
              className="mt-2 w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white font-medium"
            />
          </div>

          {/* Electricity */}
          <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                2. Tiền điện ({electricKwh} kWh)
              </label>
              <span className="text-sm font-black text-amber-700">{formatVND(electricTotal)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[11px] text-slate-600 block mb-0.5">Số cũ (kWh)</span>
                <input
                  type="number"
                  min="0"
                  value={prevElectric}
                  onChange={(e) => setPrevElectric(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-600 block mb-0.5">Số mới (kWh)</span>
                <input
                  type="number"
                  min={prevElectric}
                  value={currElectric}
                  onChange={(e) => setCurrElectric(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm bg-white font-bold text-slate-800"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-600 block mb-0.5">Đơn giá (đ/kWh)</span>
                <input
                  type="number"
                  min="0"
                  value={electricPrice}
                  onChange={(e) => setElectricPrice(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>
            </div>
          </div>

          {/* Water */}
          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <label className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                  3. Tiền nước
                </label>
                <select
                  value={waterType}
                  onChange={(e) => setWaterType(e.target.value as WaterBillingType)}
                  className="text-xs px-2 py-0.5 border border-blue-300 rounded bg-white text-blue-900"
                >
                  <option value="METER">Theo đồng hồ (m³)</option>
                  <option value="PER_PERSON">Theo đầu người</option>
                  <option value="FIXED">Cố định phòng</option>
                </select>
              </div>
              <span className="text-sm font-black text-blue-700">{formatVND(calculatedWaterTotal)}</span>
            </div>

            {waterType === 'METER' ? (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[11px] text-slate-600 block mb-0.5">Số cũ (m³)</span>
                  <input
                    type="number"
                    min="0"
                    value={prevWater}
                    onChange={(e) => setPrevWater(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-600 block mb-0.5">Số mới (m³)</span>
                  <input
                    type="number"
                    min={prevWater}
                    value={currWater}
                    onChange={(e) => setCurrWater(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm bg-white font-bold text-slate-800"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-600 block mb-0.5">Đơn giá (đ/m³)</span>
                  <input
                    type="number"
                    min="0"
                    value={waterPrice}
                    onChange={(e) => setWaterPrice(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                  />
                </div>
              </div>
            ) : waterType === 'PER_PERSON' ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] text-slate-600 block mb-0.5">Số người</span>
                  <input
                    type="number"
                    min="1"
                    value={waterCount}
                    onChange={(e) => setWaterCount(Number(e.target.value) || 1)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-600 block mb-0.5">Đơn giá (đ/người)</span>
                  <input
                    type="number"
                    min="0"
                    value={waterPrice}
                    onChange={(e) => setWaterPrice(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                  />
                </div>
              </div>
            ) : (
              <div>
                <span className="text-[11px] text-slate-600 block mb-0.5">Phí nước cố định (VNĐ)</span>
                <input
                  type="number"
                  min="0"
                  value={waterPrice}
                  onChange={(e) => setWaterPrice(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm bg-white font-medium"
                />
              </div>
            )}
          </div>

          {/* Other utilities */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Wifi / Internet
              </label>
              <input
                type="number"
                min="0"
                step="10000"
                value={internetFee}
                onChange={(e) => setInternetFee(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rác / Vệ sinh
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                value={garbageFee}
                onChange={(e) => setGarbageFee(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phí khác (gửi xe...)
              </label>
              <input
                type="number"
                min="0"
                step="10000"
                value={otherFee}
                onChange={(e) => setOtherFee(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Giảm trừ (VNĐ)
              </label>
              <input
                type="number"
                min="0"
                step="10000"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm bg-white text-rose-600 font-medium"
              />
            </div>
          </div>

          {otherFee > 0 && (
            <div>
              <input
                type="text"
                placeholder="Diễn giải phí khác (ví dụ: Giữ xe máy tháng, giặt ủi...)"
                value={otherFeeDescription}
                onChange={(e) => setOtherFeeDescription(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          )}

          {/* Grand Total Summary Box */}
          <div className="p-4 bg-emerald-900 text-white rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-emerald-200 font-semibold block">
                  Tổng tiền phải thu
                </span>
                <span className="text-2xl font-black text-emerald-300">{formatVND(grandTotal)}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-emerald-300 italic block">
                  {numberToVietnameseWords(grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Status & Execution */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Trạng thái thu tiền
              </label>
              <select
                value={status}
                onChange={(e) => {
                  const newStat = e.target.value as Invoice['status'];
                  setStatus(newStat);
                  if (newStat === 'PAID') {
                    setPaidAmount(grandTotal);
                  } else if (newStat === 'UNPAID' || newStat === 'OVERDUE') {
                    setPaidAmount(0);
                  }
                }}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white font-medium"
              >
                <option value="UNPAID">Chưa thanh toán</option>
                <option value="PAID">Đã thanh toán đủ</option>
                <option value="PARTIAL">Thanh toán một phần</option>
                <option value="OVERDUE">Quá hạn</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số tiền đã nhận (VNĐ)
              </label>
              <input
                type="number"
                min="0"
                max={grandTotal}
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white font-bold text-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phương thức nhận
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as Invoice['paymentMethod'])}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="TRANSFER">Chuyển khoản (VietQR)</option>
                <option value="CASH">Tiền mặt</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ghi chú hóa đơn
            </label>
            <input
              type="text"
              placeholder="Ghi chú riêng cho hóa đơn này nếu có..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="inline-flex items-center space-x-1.5 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>{initialInvoice ? 'Cập nhật hóa đơn' : 'Lưu hóa đơn'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
