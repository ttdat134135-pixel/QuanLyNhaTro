import React from 'react';
import { 
  Building2, 
  Home, 
  Users, 
  FileText, 
  BarChart3, 
  BellRing, 
  Settings, 
  Plus, 
  Zap,
  ShieldCheck
} from 'lucide-react';
import { LandlordSettings, Room, Invoice } from '../types';

interface NavbarProps {
  currentTab: 'rooms' | 'tenants' | 'invoices' | 'reports' | 'reminders';
  setCurrentTab: (tab: 'rooms' | 'tenants' | 'invoices' | 'reports' | 'reminders') => void;
  settings: LandlordSettings;
  rooms: Room[];
  invoices: Invoice[];
  onOpenSettings: () => void;
  onOpenQuickMeter: () => void;
  onOpenAddRoom: () => void;
  onOpenReminderModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  settings,
  rooms,
  invoices,
  onOpenSettings,
  onOpenQuickMeter,
  onOpenAddRoom,
  onOpenReminderModal,
}) => {
  // Count rooms under 50
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.status === 'OCCUPIED').length;
  const vacantRooms = rooms.filter(r => r.status === 'VACANT').length;

  // Count pending/overdue invoices
  const pendingInvoicesCount = invoices.filter(i => i.status === 'UNPAID' || i.status === 'OVERDUE').length;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & House Info */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-200">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-800 leading-tight">
                  {settings.houseName || 'Quản Lý Nhà Trọ'}
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/60">
                  {totalRooms}/50 phòng
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-xs sm:max-w-md">
                Chủ trọ: {settings.landlordName} • {settings.phone}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={onOpenQuickMeter}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors border border-teal-200"
              title="Ghi chỉ số điện nước hàng loạt cuối tháng"
            >
              <Zap className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">Ghi điện nước nhanh</span>
              <span className="sm:hidden">Điện nước</span>
            </button>

            <button
              onClick={onOpenReminderModal}
              className="relative inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors border border-amber-200"
              title="Nhắc thu tiền tự động qua Zalo/Email"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Nhắc tiền</span>
              {pendingInvoicesCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {pendingInvoicesCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenAddRoom}
              disabled={totalRooms >= 50}
              className={`inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-all ${
                totalRooms >= 50
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
              title={totalRooms >= 50 ? 'Đã đạt giới hạn 50 phòng' : 'Thêm phòng mới'}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Thêm phòng</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Cài đặt khu trọ, tài khoản VietQR & đơn giá"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none pt-1">
          <button
            onClick={() => setCurrentTab('rooms')}
            className={`flex items-center space-x-2 py-2 px-3 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              currentTab === 'rooms'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Phòng trọ ({totalRooms})</span>
            <span className="text-xs px-1.5 py-0.2 rounded-md bg-white border border-slate-200 text-slate-500 font-normal">
              {occupiedRooms} thuê / {vacantRooms} trống
            </span>
          </button>

          <button
            onClick={() => setCurrentTab('tenants')}
            className={`flex items-center space-x-2 py-2 px-3 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              currentTab === 'tenants'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Khách thuê</span>
          </button>

          <button
            onClick={() => setCurrentTab('invoices')}
            className={`flex items-center space-x-2 py-2 px-3 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              currentTab === 'invoices'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Hóa đơn hàng tháng</span>
          </button>

          <button
            onClick={() => setCurrentTab('reports')}
            className={`flex items-center space-x-2 py-2 px-3 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              currentTab === 'reports'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Báo cáo doanh thu</span>
          </button>

          <button
            onClick={() => setCurrentTab('reminders')}
            className={`flex items-center space-x-2 py-2 px-3 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              currentTab === 'reminders'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BellRing className="w-4 h-4" />
            <span>Nhắc nợ Zalo & Email</span>
            {pendingInvoicesCount > 0 && (
              <span className="text-xs px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 font-semibold">
                {pendingInvoicesCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
