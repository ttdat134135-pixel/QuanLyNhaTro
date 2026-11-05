import React, { useState } from 'react';
import { 
  UserPlus, 
  Search, 
  Phone, 
  Mail, 
  FileText, 
  Edit, 
  Trash2, 
  LogOut, 
  ShieldCheck, 
  Calendar,
  Download,
  Car
} from 'lucide-react';
import { Room, Tenant } from '../../types';
import { formatVND, formatDateVN, getCleanPhoneForZalo } from '../../utils/formatters';
import { exportToCSV } from '../../utils/storage';

interface TenantListProps {
  tenants: Tenant[];
  rooms: Room[];
  onAddTenant: () => void;
  onEditTenant: (tenant: Tenant) => void;
  onDeleteTenant: (tenantId: string) => void;
  onEndLease: (tenant: Tenant) => void;
  onViewContract: (tenant: Tenant, room: Room) => void;
}

export const TenantList: React.FC<TenantListProps> = ({
  tenants,
  rooms,
  onAddTenant,
  onEditTenant,
  onDeleteTenant,
  onEndLease,
  onViewContract,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ENDED'>('ACTIVE');

  // Filter tenants
  const filteredTenants = tenants.filter((tenant) => {
    const room = rooms.find((r) => r.id === tenant.roomId);
    const matchesSearch =
      tenant.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.phone.includes(searchQuery) ||
      (tenant.idCard && tenant.idCard.includes(searchQuery)) ||
      (room && room.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || tenant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeTenantsCount = tenants.filter((t) => t.status === 'ACTIVE').length;
  const totalDeposit = tenants
    .filter((t) => t.status === 'ACTIVE')
    .reduce((sum, t) => sum + (t.deposit || 0), 0);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Họ và tên',
      'Phòng',
      'Số điện thoại',
      'Email',
      'Số CCCD',
      'Quê quán',
      'Biển số xe',
      'Tiền cọc (VNĐ)',
      'Ngày bắt đầu',
      'Ngày kết thúc',
      'Trạng thái',
    ];

    const rows = tenants.map((t) => {
      const room = rooms.find((r) => r.id === t.roomId);
      return [
        t.fullName,
        room ? room.name : '',
        t.phone,
        t.email || '',
        t.idCard || '',
        t.hometown || '',
        t.vehiclePlate || '',
        String(t.deposit || 0),
        t.startDate,
        t.endDate,
        t.status === 'ACTIVE' ? 'Đang thuê' : 'Đã kết thúc',
      ];
    });

    exportToCSV(`danh-sach-khach-thue-${new Date().toISOString().slice(0, 10)}.csv`, [
      headers,
      ...rows,
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Top Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Khách đang thuê
            </span>
            <span className="text-2xl font-black text-slate-800">{activeTenantsCount}</span>
            <span className="text-xs text-slate-400 ml-1">người</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            👥
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Tổng tiền cọc đang giữ
            </span>
            <span className="text-2xl font-black text-emerald-600">{formatVND(totalDeposit)}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            💰
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Hợp đồng lưu trữ
            </span>
            <span className="text-2xl font-black text-slate-800">{tenants.length}</span>
            <span className="text-xs text-slate-400 ml-1">hồ sơ</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            📑
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm khách theo tên, phòng, SĐT, CCCD..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-emerald-600 focus:border-emerald-600 bg-slate-50/50"
            />
          </div>

          {/* Status Tabs */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs">
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                statusFilter === 'ACTIVE'
                  ? 'bg-white shadow-xs text-emerald-700'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Đang thuê ({activeTenantsCount})
            </button>
            <button
              onClick={() => setStatusFilter('ENDED')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                statusFilter === 'ENDED'
                  ? 'bg-white shadow-xs text-slate-800'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Đã trả phòng ({tenants.filter((t) => t.status === 'ENDED').length})
            </button>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-white shadow-xs text-slate-800'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tất cả ({tenants.length})
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-xs"
            title="Xuất danh sách khách thuê ra Excel/CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV</span>
          </button>

          <button
            onClick={onAddTenant}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm khách mới</span>
          </button>
        </div>
      </div>

      {/* Tenant Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Khách thuê</th>
                <th className="px-4 py-3">Phòng</th>
                <th className="px-4 py-3">Liên lạc & Zalo</th>
                <th className="px-4 py-3">CCCD / Xe máy</th>
                <th className="px-4 py-3">Tiền cọc</th>
                <th className="px-4 py-3">Thời hạn thuê</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTenants.map((tenant) => {
                const room = rooms.find((r) => r.id === tenant.roomId);
                const cleanPhone = getCleanPhoneForZalo(tenant.phone);

                return (
                  <tr key={tenant.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Name & Hometown */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{tenant.fullName}</div>
                      {tenant.hometown && (
                        <div className="text-xs text-slate-500">Quê: {tenant.hometown}</div>
                      )}
                      {tenant.status === 'ENDED' && (
                        <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-500 rounded font-semibold">
                          Đã trả phòng
                        </span>
                      )}
                    </td>

                    {/* Room */}
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {room ? (
                        <div>
                          <span className="text-emerald-700 font-bold">{room.name}</span>
                          <span className="text-xs text-slate-400 block font-normal">{room.group}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Chưa xếp phòng</span>
                      )}
                    </td>

                    {/* Phone & Zalo */}
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <a
                          href={`tel:${tenant.phone}`}
                          className="font-medium text-slate-800 hover:text-emerald-600 transition-colors"
                        >
                          {tenant.phone}
                        </a>
                        <a
                          href={`https://zalo.me/${cleanPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-1.5 py-0.5 text-[11px] font-bold rounded bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
                          title="Nhắn tin qua Zalo"
                        >
                          Zalo
                        </a>
                      </div>
                      {tenant.email && (
                        <div className="text-xs text-slate-400 truncate max-w-[150px]">
                          {tenant.email}
                        </div>
                      )}
                    </td>

                    {/* ID Card & Plate */}
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div>CCCD: <span className="font-mono font-medium">{tenant.idCard || 'Chưa có'}</span></div>
                      {tenant.vehiclePlate && (
                        <div className="text-slate-500 flex items-center space-x-1 mt-0.5">
                          <Car className="w-3 h-3 text-slate-400" />
                          <span>{tenant.vehiclePlate}</span>
                        </div>
                      )}
                    </td>

                    {/* Deposit */}
                    <td className="px-4 py-3 font-bold text-emerald-700">
                      {formatVND(tenant.deposit)}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div>Từ: {formatDateVN(tenant.startDate)}</div>
                      <div className="text-slate-500">Đến: {formatDateVN(tenant.endDate)}</div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center space-x-1">
                        {room && (
                          <button
                            onClick={() => onViewContract(tenant, room)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Xem / In Hợp đồng thuê phòng"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => onEditTenant(tenant)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Chỉnh sửa thông tin khách"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {tenant.status === 'ACTIVE' && (
                          <button
                            onClick={() => onEndLease(tenant)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Làm thủ tục trả phòng (kết thúc thuê)"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (confirm(`Xóa thông tin khách thuê "${tenant.fullName}"?`)) {
                              onDeleteTenant(tenant.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa hồ sơ"
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

        {filteredTenants.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            Không tìm thấy khách thuê phù hợp với tìm kiếm.
          </div>
        )}
      </div>
    </div>
  );
};
