import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Room } from '../../types';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (room: Room) => void;
  initialRoom?: Room | null;
  existingGroups: string[];
}

export const RoomModal: React.FC<RoomModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRoom,
  existingGroups,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(initialRoom?.name || '');
  const [group, setGroup] = useState(initialRoom?.group || existingGroups[0] || 'Tầng 1');
  const [customGroup, setCustomGroup] = useState('');
  const [isAddingNewGroup, setIsAddingNewGroup] = useState(false);
  const [price, setPrice] = useState(initialRoom?.price ? String(initialRoom.price) : '3000000');
  const [area, setArea] = useState(initialRoom?.area ? String(initialRoom.area) : '20');
  const [maxRenters, setMaxRenters] = useState(initialRoom?.maxRenters ? String(initialRoom.maxRenters) : '2');
  const [status, setStatus] = useState<Room['status']>(initialRoom?.status || 'VACANT');
  const [lastElectricNumber, setLastElectricNumber] = useState(
    initialRoom?.lastElectricNumber !== undefined ? String(initialRoom.lastElectricNumber) : '100'
  );
  const [lastWaterNumber, setLastWaterNumber] = useState(
    initialRoom?.lastWaterNumber !== undefined ? String(initialRoom.lastWaterNumber) : '10'
  );
  const [notes, setNotes] = useState(initialRoom?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalGroup = isAddingNewGroup && customGroup.trim() ? customGroup.trim() : group;

    const updatedRoom: Room = {
      id: initialRoom?.id || `room-${Date.now()}`,
      name: name.trim(),
      group: finalGroup,
      price: Number(price) || 0,
      area: Number(area) || 0,
      maxRenters: Number(maxRenters) || 2,
      currentRentersCount: initialRoom?.currentRentersCount || 0,
      status: status,
      lastElectricNumber: Number(lastElectricNumber) || 0,
      lastWaterNumber: Number(lastWaterNumber) || 0,
      notes: notes.trim(),
      currentTenantId: initialRoom?.currentTenantId,
    };

    onSave(updatedRoom);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in duration-200">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">
            {initialRoom ? `Chỉnh sửa: ${initialRoom.name}` : 'Thêm phòng mới'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên / Số phòng <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Phòng 101"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-emerald-600 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tầng / Dãy / Nhóm phòng
              </label>
              {!isAddingNewGroup ? (
                <div className="flex space-x-1">
                  <select
                    value={group}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setIsAddingNewGroup(true);
                      } else {
                        setGroup(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-emerald-600"
                  >
                    {existingGroups.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                    <option value="__NEW__">+ Tạo nhóm mới...</option>
                  </select>
                </div>
              ) : (
                <div className="flex space-x-1">
                  <input
                    type="text"
                    placeholder="Nhập tên nhóm mới"
                    value={customGroup}
                    onChange={(e) => setCustomGroup(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => setIsAddingNewGroup(false)}
                    className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 rounded-lg"
                  >
                    Hủy
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Giá thuê phòng (VNĐ/tháng) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                step="50000"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Trạng thái phòng
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Room['status'])}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-emerald-600"
              >
                <option value="VACANT">Còn trống</option>
                <option value="OCCUPIED">Đang thuê</option>
                <option value="MAINTENANCE">Đang sửa chữa / Bảo trì</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Diện tích (m²)
              </label>
              <input
                type="number"
                min="5"
                step="0.5"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sức chứa tối đa (người)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={maxRenters}
                onChange={(e) => setMaxRenters(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-emerald-600"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
              Chỉ số đồng hồ ban đầu
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Chỉ số điện (kWh)</label>
                <input
                  type="number"
                  min="0"
                  value={lastElectricNumber}
                  onChange={(e) => setLastElectricNumber(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Chỉ số nước (m³)</label>
                <input
                  type="number"
                  min="0"
                  value={lastWaterNumber}
                  onChange={(e) => setLastWaterNumber(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm bg-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ghi chú thêm (trang thiết bị, tiện ích...)
            </label>
            <textarea
              rows={2}
              placeholder="Ví dụ: Máy lạnh Inverter, gác lửng đúc, ban công thoáng..."
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
              <span>{initialRoom ? 'Cập nhật phòng' : 'Lưu phòng'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
