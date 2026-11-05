import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Room, Tenant } from '../../types';

interface TenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tenant: Tenant, targetRoomId: string) => void;
  initialTenant?: Tenant | null;
  rooms: Room[];
  defaultRoomId?: string;
}

export const TenantModal: React.FC<TenantModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTenant,
  rooms,
  defaultRoomId,
}) => {
  if (!isOpen) return null;

  const [fullName, setFullName] = useState(initialTenant?.fullName || '');
  const [phone, setPhone] = useState(initialTenant?.phone || '');
  const [email, setEmail] = useState(initialTenant?.email || '');
  const [roomId, setRoomId] = useState(initialTenant?.roomId || defaultRoomId || rooms[0]?.id || '');
  const [idCard, setIdCard] = useState(initialTenant?.idCard || '');
  const [idCardDate, setIdCardDate] = useState(initialTenant?.idCardDate || '');
  const [idCardPlace, setIdCardPlace] = useState(initialTenant?.idCardPlace || 'Cục Cảnh sát QLHC về TTXH');
  const [birthDate, setBirthDate] = useState(initialTenant?.birthDate || '');
  const [hometown, setHometown] = useState(initialTenant?.hometown || '');
  const [vehiclePlate, setVehiclePlate] = useState(initialTenant?.vehiclePlate || '');
  
  // Find selected room's price for default deposit
  const selectedRoom = rooms.find((r) => r.id === roomId);
  const [deposit, setDeposit] = useState(
    initialTenant?.deposit !== undefined ? String(initialTenant.deposit) : selectedRoom ? String(selectedRoom.price) : '3000000'
  );
  
  const todayStr = new Date().toISOString().slice(0, 10);
  const oneYearLaterStr = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(initialTenant?.startDate || todayStr);
  const [endDate, setEndDate] = useState(initialTenant?.endDate || oneYearLaterStr);
  const [status, setStatus] = useState<Tenant['status']>(initialTenant?.status || 'ACTIVE');
  const [emergencyContact, setEmergencyContact] = useState(initialTenant?.emergencyContact || '');
  const [notes, setNotes] = useState(initialTenant?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !roomId) return;

    const updatedTenant: Tenant = {
      id: initialTenant?.id || `tenant-${Date.now()}`,
      roomId,
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      idCard: idCard.trim(),
      idCardDate,
      idCardPlace: idCardPlace.trim(),
      birthDate,
      hometown: hometown.trim(),
      vehiclePlate: vehiclePlate.trim(),
      deposit: Number(deposit) || 0,
      startDate,
      endDate,
      status,
      emergencyContact: emergencyContact.trim(),
      notes: notes.trim(),
    };

    onSave(updatedTenant, roomId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in duration-200">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">
            {initialTenant ? `Chỉnh sửa khách thuê: ${initialTenant.fullName}` : 'Thêm khách thuê mới'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Room selection */}
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
            <label className="block text-xs font-bold text-emerald-900 mb-1">
              Phòng thuê <span className="text-rose-500">*</span>
            </label>
            <select
              value={roomId}
              onChange={(e) => {
                setRoomId(e.target.value);
                const r = rooms.find((rm) => rm.id === e.target.value);
                if (r && !initialTenant) {
                  setDeposit(String(r.price));
                }
              }}
              className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-sm bg-white font-semibold text-slate-800 focus:outline-emerald-600"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.group}) - {new Intl.NumberFormat('vi-VN').format(r.price)} đ/tháng{' '}
                  {r.status === 'OCCUPIED' && r.id !== initialTenant?.roomId ? '[Đang có khách]' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Personal Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Họ và tên khách thuê <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số điện thoại (dùng Zalo & liên lạc) <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="Ví dụ: 0912345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email nhận hóa đơn (nếu có)
              </label>
              <input
                type="email"
                placeholder="khachthue@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số CCCD / CMND
              </label>
              <input
                type="text"
                placeholder="12 số CCCD"
                value={idCard}
                onChange={(e) => setIdCard(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ngày sinh
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ngày cấp CCCD
              </label>
              <input
                type="date"
                value={idCardDate}
                onChange={(e) => setIdCardDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nơi cấp
              </label>
              <input
                type="text"
                value={idCardPlace}
                onChange={(e) => setIdCardPlace(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quê quán / Thường trú
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Nghệ An, Nam Định..."
                value={hometown}
                onChange={(e) => setHometown(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Biển số xe (đăng ký nhà xe)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: 59P1-123.45"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-emerald-600"
              />
            </div>
          </div>

          {/* Lease & Financial Details */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Thông tin cọc & Hợp đồng
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Tiền cọc giữ phòng (VNĐ)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white font-semibold text-emerald-700"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Ngày bắt đầu thuê</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Ngày hết hạn hợp đồng</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Liên hệ khẩn cấp (Người thân)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bố: Nguyễn Văn B (0988...)"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Trạng thái hợp đồng</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Tenant['status'])}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="ACTIVE">Đang thuê (Còn hiệu lực)</option>
                  <option value="ENDED">Đã kết thúc / Trả phòng</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ghi chú thêm về khách thuê
            </label>
            <textarea
              rows={2}
              placeholder="Ghi chú nghề nghiệp, giờ giấc, yêu cầu riêng..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-emerald-600"
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
              <span>{initialTenant ? 'Cập nhật thông tin' : 'Lưu khách thuê'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
