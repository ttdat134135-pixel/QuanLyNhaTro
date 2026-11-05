import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  UserPlus, 
  FileText, 
  Zap, 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Wrench,
  Phone,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Room, Tenant } from '../../types';
import { formatVND, formatNumber, formatDateVN } from '../../utils/formatters';

interface RoomListProps {
  rooms: Room[];
  tenants: Tenant[];
  onAddRoom: () => void;
  onEditRoom: (room: Room) => void;
  onDeleteRoom: (roomId: string) => void;
  onAssignTenant: (room: Room) => void;
  onCreateInvoiceForRoom: (room: Room) => void;
  onViewContractForRoom: (room: Room) => void;
}

export const RoomList: React.FC<RoomListProps> = ({
  rooms,
  tenants,
  onAddRoom,
  onEditRoom,
  onDeleteRoom,
  onAssignTenant,
  onCreateInvoiceForRoom,
  onViewContractForRoom,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Get unique groups
  const groups = Array.from(new Set(rooms.map((r) => r.group))).filter(Boolean);

  // Filtered rooms
  const filteredRooms = rooms.filter((room) => {
    // Tenant info
    const tenant = tenants.find((t) => t.id === room.currentTenantId && t.status === 'ACTIVE');
    const matchesSearch =
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.group.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tenant && tenant.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tenant && tenant.phone.includes(searchQuery));

    const matchesGroup = selectedGroup === 'ALL' || room.group === selectedGroup;
    const matchesStatus = selectedStatus === 'ALL' || room.status === selectedStatus;

    return matchesSearch && matchesGroup && matchesStatus;
  });

  const getStatusBadge = (status: Room['status']) => {
    switch (status) {
      case 'OCCUPIED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Đang thuê</span>
          </span>
        );
      case 'VACANT':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Còn trống</span>
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <Wrench className="w-3 h-3 text-slate-500" />
            <span>Đang sửa chữa</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên phòng, người thuê, SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-emerald-600 focus:border-emerald-600 bg-slate-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Group Filter */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-600">
            <Layers className="w-4 h-4 text-slate-400" />
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="py-2 px-3 border border-slate-200 rounded-xl bg-white text-sm focus:outline-emerald-600"
            >
              <option value="ALL">Tất cả tầng / dãy ({rooms.length})</option>
              {groups.map((g) => {
                const count = rooms.filter((r) => r.group === g).length;
                return (
                  <option key={g} value={g}>
                    {g} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-600">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="py-2 px-3 border border-slate-200 rounded-xl bg-white text-sm focus:outline-emerald-600"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="OCCUPIED">Đang thuê ({rooms.filter((r) => r.status === 'OCCUPIED').length})</option>
              <option value="VACANT">Còn trống ({rooms.filter((r) => r.status === 'VACANT').length})</option>
              <option value="MAINTENANCE">Đang sửa ({rooms.filter((r) => r.status === 'MAINTENANCE').length})</option>
            </select>
          </div>
        </div>

        {/* View Mode & Add Button */}
        <div className="flex items-center space-x-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-xs text-slate-800' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Lưới ô
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                viewMode === 'table' ? 'bg-white shadow-xs text-slate-800' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Danh sách
            </button>
          </div>

          <button
            onClick={onAddRoom}
            disabled={rooms.length >= 50}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm phòng</span>
          </button>
        </div>
      </div>

      {/* Room Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map((room) => {
            const tenant = tenants.find((t) => t.id === room.currentTenantId && t.status === 'ACTIVE');

            return (
              <div
                key={room.id}
                className={`bg-white rounded-2xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between overflow-hidden ${
                  room.status === 'OCCUPIED'
                    ? 'border-emerald-200/80 shadow-xs'
                    : room.status === 'VACANT'
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-slate-200 opacity-80'
                }`}
              >
                {/* Header */}
                <div className="p-4 pb-3 border-b border-slate-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        {room.group}
                      </span>
                      <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
                        {room.name}
                      </h3>
                    </div>
                    {getStatusBadge(room.status)}
                  </div>

                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-base font-black text-emerald-700">
                      {formatVND(room.price)}
                      <span className="text-xs font-normal text-slate-500">/tháng</span>
                    </span>
                    <span className="text-xs text-slate-500">
                      {room.area}m² • Tối đa {room.maxRenters} người
                    </span>
                  </div>
                </div>

                {/* Tenant & Status Section */}
                <div className="p-4 flex-1 flex flex-col justify-between text-xs space-y-3">
                  {tenant ? (
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                      <div className="flex items-center justify-between font-semibold text-slate-800 mb-1">
                        <span className="truncate max-w-[140px] text-sm">{tenant.fullName}</span>
                        <a
                          href={`tel:${tenant.phone}`}
                          className="inline-flex items-center space-x-1 text-emerald-600 hover:text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-slate-200"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{tenant.phone}</span>
                        </a>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                        <span>Vào ở: {formatDateVN(tenant.startDate)}</span>
                        <span>Cọc: {formatVND(tenant.deposit)}</span>
                      </div>
                    </div>
                  ) : room.status === 'VACANT' ? (
                    <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/60 text-center">
                      <p className="text-amber-800 font-semibold mb-1">Phòng đang trống</p>
                      <button
                        onClick={() => onAssignTenant(room)}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Thêm người thuê</span>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-slate-100 p-3 rounded-xl text-center text-slate-600 font-medium">
                      Phòng đang bảo trì / tạm dừng
                    </div>
                  )}

                  {/* Meter Reading Summary */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                    <div className="bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block">Số điện gần nhất</span>
                      <span className="font-bold text-slate-700">{formatNumber(room.lastElectricNumber)} kWh</span>
                    </div>
                    <div className="bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block">Số nước gần nhất</span>
                      <span className="font-bold text-slate-700">{formatNumber(room.lastWaterNumber)} m³</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1">
                    {room.status === 'OCCUPIED' && (
                      <>
                        <button
                          onClick={() => onCreateInvoiceForRoom(room)}
                          className="px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-semibold rounded-lg border border-emerald-200 transition-colors"
                          title="Lập hóa đơn thu tiền cho phòng này"
                        >
                          <Zap className="w-3.5 h-3.5 inline mr-1" />
                          Thu tiền
                        </button>
                        <button
                          onClick={() => onViewContractForRoom(room)}
                          className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-colors"
                          title="Xem / In hợp đồng thuê phòng"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {room.status === 'VACANT' && (
                      <button
                        onClick={() => onAssignTenant(room)}
                        className="px-2.5 py-1 text-amber-700 bg-amber-50 hover:bg-amber-100 font-semibold rounded-lg border border-amber-200 transition-colors"
                      >
                        + Khách mới
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEditRoom(room)}
                      className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-white rounded-md transition-colors"
                      title="Chỉnh sửa phòng"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Bạn có chắc chắn muốn xóa ${room.name}?`)) {
                          onDeleteRoom(room.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-md transition-colors"
                      title="Xóa phòng"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Phòng / Tầng</th>
                  <th className="px-4 py-3">Giá thuê</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Người đang thuê</th>
                  <th className="px-4 py-3">Số điện gần nhất</th>
                  <th className="px-4 py-3">Số nước gần nhất</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRooms.map((room) => {
                  const tenant = tenants.find((t) => t.id === room.currentTenantId && t.status === 'ACTIVE');
                  return (
                    <tr key={room.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <div>{room.name}</div>
                        <div className="text-xs text-slate-400 font-normal">{room.group}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-700">
                        {formatVND(room.price)}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(room.status)}</td>
                      <td className="px-4 py-3">
                        {tenant ? (
                          <div>
                            <div className="font-medium text-slate-800">{tenant.fullName}</div>
                            <div className="text-xs text-slate-500">{tenant.phone}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Chưa có khách</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {formatNumber(room.lastElectricNumber)} kWh
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {formatNumber(room.lastWaterNumber)} m³
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {room.status === 'OCCUPIED' && (
                          <button
                            onClick={() => onCreateInvoiceForRoom(room)}
                            className="px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 border border-emerald-200"
                          >
                            Lập HĐ
                          </button>
                        )}
                        <button
                          onClick={() => onEditRoom(room)}
                          className="p-1 text-slate-500 hover:text-emerald-700"
                        >
                          <Edit className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Bạn có chắc muốn xóa ${room.name}?`)) {
                              onDeleteRoom(room.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredRooms.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-700">Không tìm thấy phòng phù hợp</h4>
          <p className="text-sm text-slate-500 mt-1">
            Vui lòng thử tìm kiếm với từ khóa khác hoặc điều chỉnh lại bộ lọc.
          </p>
        </div>
      )}
    </div>
  );
};
