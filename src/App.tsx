/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Home, 
  Users, 
  FileText, 
  BarChart3, 
  BellRing, 
  Plus, 
  Zap, 
  Settings as SettingsIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Invoice, LandlordSettings, Room, Tenant } from './types';
import { 
  loadRooms, 
  saveRooms, 
  loadTenants, 
  saveTenants, 
  loadInvoices, 
  saveInvoices, 
  loadSettings, 
  saveSettings 
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { RoomList } from './components/Rooms/RoomList';
import { RoomModal } from './components/Rooms/RoomModal';
import { TenantList } from './components/Tenants/TenantList';
import { TenantModal } from './components/Tenants/TenantModal';
import { InvoiceList } from './components/Invoices/InvoiceList';
import { InvoiceModal } from './components/Invoices/InvoiceModal';
import { QuickMeterModal } from './components/Invoices/QuickMeterModal';
import { InvoicePrintView } from './components/Invoices/InvoicePrintView';
import { ContractModal } from './components/Contracts/ContractModal';
import { ReportView } from './components/Reports/ReportView';
import { ReminderCenterModal } from './components/Reminders/ReminderCenterModal';
import { SettingsModal } from './components/Settings/SettingsModal';

export default function App() {
  // Primary States
  const [rooms, setRooms] = useState<Room[]>(loadRooms);
  const [tenants, setTenants] = useState<Tenant[]>(loadTenants);
  const [invoices, setInvoices] = useState<Invoice[]>(loadInvoices);
  const [settings, setSettings] = useState<LandlordSettings>(loadSettings);

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<'rooms' | 'tenants' | 'invoices' | 'reports' | 'reminders'>('rooms');

  // Modals state
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [tenantDefaultRoomId, setTenantDefaultRoomId] = useState<string | undefined>();

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [invoiceDefaultRoomId, setInvoiceDefaultRoomId] = useState<string | undefined>();

  const [isQuickMeterModalOpen, setIsQuickMeterModalOpen] = useState(false);

  const [isPrintInvoiceOpen, setIsPrintInvoiceOpen] = useState(false);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null);

  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [selectedContractData, setSelectedContractData] = useState<{ tenant: Tenant; room: Room } | null>(null);

  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Sync state changes with LocalStorage
  const updateRooms = (newRooms: Room[]) => {
    setRooms(newRooms);
    saveRooms(newRooms);
  };

  const updateTenants = (newTenants: Tenant[]) => {
    setTenants(newTenants);
    saveTenants(newTenants);
  };

  const updateInvoices = (newInvoices: Invoice[]) => {
    setInvoices(newInvoices);
    saveInvoices(newInvoices);
  };

  const updateSettings = (newSettings: LandlordSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    showToast('Đã lưu cấu hình nhà trọ thành công!');
  };

  const reloadAll = () => {
    setRooms(loadRooms());
    setTenants(loadTenants());
    setInvoices(loadInvoices());
    setSettings(loadSettings());
    showToast('Đã làm mới dữ liệu!');
  };

  // --- ROOM HANDLERS ---
  const handleSaveRoom = (savedRoom: Room) => {
    const exists = rooms.some((r) => r.id === savedRoom.id);
    let updated: Room[];
    if (exists) {
      updated = rooms.map((r) => (r.id === savedRoom.id ? savedRoom : r));
      showToast(`Đã cập nhật ${savedRoom.name}`);
    } else {
      if (rooms.length >= 50) {
        alert('Đã đạt giới hạn tối đa 50 phòng!');
        return;
      }
      updated = [...rooms, savedRoom];
      showToast(`Đã thêm mới ${savedRoom.name}`);
    }
    updateRooms(updated);
  };

  const handleDeleteRoom = (roomId: string) => {
    const updated = rooms.filter((r) => r.id !== roomId);
    updateRooms(updated);
    showToast('Đã xóa phòng.');
  };

  const handleAssignTenantToRoom = (room: Room) => {
    setEditingTenant(null);
    setTenantDefaultRoomId(room.id);
    setIsTenantModalOpen(true);
  };

  // --- TENANT HANDLERS ---
  const handleSaveTenant = (savedTenant: Tenant, targetRoomId: string) => {
    const exists = tenants.some((t) => t.id === savedTenant.id);
    let updatedTenants: Tenant[];

    if (exists) {
      updatedTenants = tenants.map((t) => (t.id === savedTenant.id ? savedTenant : t));
    } else {
      updatedTenants = [...tenants, savedTenant];
    }

    // Update room occupancy
    const updatedRooms = rooms.map((r) => {
      if (r.id === targetRoomId && savedTenant.status === 'ACTIVE') {
        return {
          ...r,
          status: 'OCCUPIED' as Room['status'],
          currentTenantId: savedTenant.id,
          currentRentersCount: Math.max(1, r.currentRentersCount || 1),
        };
      }
      // If tenant moved from another room
      if (r.currentTenantId === savedTenant.id && r.id !== targetRoomId) {
        return {
          ...r,
          status: 'VACANT' as Room['status'],
          currentTenantId: undefined,
          currentRentersCount: 0,
        };
      }
      return r;
    });

    updateTenants(updatedTenants);
    updateRooms(updatedRooms);
    showToast(`Đã lưu khách thuê: ${savedTenant.fullName}`);
  };

  const handleDeleteTenant = (tenantId: string) => {
    const tenantToDelete = tenants.find((t) => t.id === tenantId);
    const updatedTenants = tenants.filter((t) => t.id !== tenantId);

    // Free the room if active
    let updatedRooms = rooms;
    if (tenantToDelete && tenantToDelete.roomId) {
      updatedRooms = rooms.map((r) =>
        r.id === tenantToDelete.roomId && r.currentTenantId === tenantId
          ? { ...r, status: 'VACANT' as Room['status'], currentTenantId: undefined, currentRentersCount: 0 }
          : r
      );
      updateRooms(updatedRooms);
    }

    updateTenants(updatedTenants);
    showToast('Đã xóa hồ sơ khách thuê.');
  };

  const handleEndLease = (tenant: Tenant) => {
    if (confirm(`Xác nhận khách "${tenant.fullName}" trả phòng?`)) {
      const updatedTenants = tenants.map((t) =>
        t.id === tenant.id ? { ...t, status: 'ENDED' as Tenant['status'], endDate: new Date().toISOString().slice(0, 10) } : t
      );
      const updatedRooms = rooms.map((r) =>
        r.id === tenant.roomId ? { ...r, status: 'VACANT' as Room['status'], currentTenantId: undefined, currentRentersCount: 0 } : r
      );

      updateTenants(updatedTenants);
      updateRooms(updatedRooms);
      showToast(`Đã làm thủ tục trả phòng cho ${tenant.fullName}`);
    }
  };

  const handleViewContract = (tenant: Tenant, room: Room) => {
    setSelectedContractData({ tenant, room });
    setIsContractModalOpen(true);
  };

  // --- INVOICE HANDLERS ---
  const handleSaveInvoice = (savedInvoice: Invoice) => {
    const exists = invoices.some((i) => i.id === savedInvoice.id);
    let updatedInvoices: Invoice[];
    if (exists) {
      updatedInvoices = invoices.map((i) => (i.id === savedInvoice.id ? savedInvoice : i));
    } else {
      updatedInvoices = [savedInvoice, ...invoices];
    }

    // Update room's latest meter readings
    const updatedRooms = rooms.map((r) => {
      if (r.id === savedInvoice.roomId) {
        return {
          ...r,
          lastElectricNumber: Math.max(r.lastElectricNumber, savedInvoice.currElectric),
          lastWaterNumber: Math.max(r.lastWaterNumber, savedInvoice.currWater),
        };
      }
      return r;
    });

    updateInvoices(updatedInvoices);
    updateRooms(updatedRooms);
    showToast('Đã lưu hóa đơn thành công!');

    // Automatically prompt print / VietQR
    setSelectedInvoiceForPrint(savedInvoice);
    setIsPrintInvoiceOpen(true);
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    const updated = invoices.filter((i) => i.id !== invoiceId);
    updateInvoices(updated);
    showToast('Đã xóa hóa đơn.');
  };

  const handleUpdateInvoiceStatus = (invoiceId: string, status: Invoice['status'], paidAmount: number) => {
    const updated = invoices.map((inv) =>
      inv.id === invoiceId
        ? {
            ...inv,
            status,
            paidAmount,
            paidDate: status === 'PAID' ? new Date().toISOString().slice(0, 10) : inv.paidDate,
          }
        : inv
    );
    updateInvoices(updated);
    showToast(status === 'PAID' ? 'Đã xác nhận thanh toán đủ!' : 'Đã cập nhật trạng thái hóa đơn');
  };

  const handleBatchMetersSave = (updatedRooms: Room[], newInvoices: Invoice[]) => {
    updateRooms(updatedRooms);

    // Merge invoices
    const mergedInvoices = [...invoices];
    newInvoices.forEach((newInv) => {
      const idx = mergedInvoices.findIndex((inv) => inv.id === newInv.id);
      if (idx !== -1) {
        mergedInvoices[idx] = newInv;
      } else {
        mergedInvoices.unshift(newInv);
      }
    });

    updateInvoices(mergedInvoices);
    showToast(`Đã cập nhật chỉ số và sinh ${newInvoices.length} hóa đơn thành công!`);
    setCurrentTab('invoices');
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    setSelectedInvoiceForPrint(invoice);
    setIsPrintInvoiceOpen(true);
  };

  const handleMarkReminderSent = (invoiceId: string) => {
    const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
    const updated = invoices.map((inv) =>
      inv.id === invoiceId ? { ...inv, lastReminderSentAt: nowStr } : inv
    );
    updateInvoices(updated);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-emerald-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        settings={settings}
        rooms={rooms}
        invoices={invoices}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenQuickMeter={() => setIsQuickMeterModalOpen(true)}
        onOpenAddRoom={() => {
          setEditingRoom(null);
          setIsRoomModalOpen(true);
        }}
        onOpenReminderModal={() => setIsReminderModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'rooms' && (
          <RoomList
            rooms={rooms}
            tenants={tenants}
            onAddRoom={() => {
              setEditingRoom(null);
              setIsRoomModalOpen(true);
            }}
            onEditRoom={(room) => {
              setEditingRoom(room);
              setIsRoomModalOpen(true);
            }}
            onDeleteRoom={handleDeleteRoom}
            onAssignTenant={handleAssignTenantToRoom}
            onCreateInvoiceForRoom={(room) => {
              setEditingInvoice(null);
              setInvoiceDefaultRoomId(room.id);
              setIsInvoiceModalOpen(true);
            }}
            onViewContractForRoom={(room) => {
              const tenant = tenants.find((t) => t.id === room.currentTenantId && t.status === 'ACTIVE');
              if (tenant) {
                handleViewContract(tenant, room);
              } else {
                alert('Phòng này hiện chưa có khách thuê!');
              }
            }}
          />
        )}

        {currentTab === 'tenants' && (
          <TenantList
            tenants={tenants}
            rooms={rooms}
            onAddTenant={() => {
              setEditingTenant(null);
              setTenantDefaultRoomId(undefined);
              setIsTenantModalOpen(true);
            }}
            onEditTenant={(tenant) => {
              setEditingTenant(tenant);
              setIsTenantModalOpen(true);
            }}
            onDeleteTenant={handleDeleteTenant}
            onEndLease={handleEndLease}
            onViewContract={handleViewContract}
          />
        )}

        {currentTab === 'invoices' && (
          <InvoiceList
            invoices={invoices}
            rooms={rooms}
            tenants={tenants}
            settings={settings}
            onCreateInvoice={() => {
              setEditingInvoice(null);
              setInvoiceDefaultRoomId(undefined);
              setIsInvoiceModalOpen(true);
            }}
            onOpenQuickMeter={() => setIsQuickMeterModalOpen(true)}
            onEditInvoice={(invoice) => {
              setEditingInvoice(invoice);
              setIsInvoiceModalOpen(true);
            }}
            onDeleteInvoice={handleDeleteInvoice}
            onPrintInvoice={handlePrintInvoice}
            onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
          />
        )}

        {currentTab === 'reports' && (
          <ReportView
            invoices={invoices}
            rooms={rooms}
            tenants={tenants}
            settings={settings}
          />
        )}

        {currentTab === 'reminders' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <ReminderCenterModal
              isOpen={true}
              onClose={() => setCurrentTab('rooms')}
              invoices={invoices}
              rooms={rooms}
              tenants={tenants}
              settings={settings}
              onMarkReminderSent={handleMarkReminderSent}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 no-print">
        <p>
          <strong>{settings.houseName}</strong> • Quản lý tối đa 50 phòng • Hỗ trợ xuất Hợp đồng, Hóa đơn VietQR & Nhắc nợ Zalo/Email
        </p>
      </footer>

      {/* --- ALL POPUP MODALS --- */}

      {/* Room Modal */}
      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        onSave={handleSaveRoom}
        initialRoom={editingRoom}
        existingGroups={Array.from(new Set(rooms.map((r) => r.group))).filter(Boolean)}
      />

      {/* Tenant Modal */}
      <TenantModal
        isOpen={isTenantModalOpen}
        onClose={() => setIsTenantModalOpen(false)}
        onSave={handleSaveTenant}
        initialTenant={editingTenant}
        rooms={rooms}
        defaultRoomId={tenantDefaultRoomId}
      />

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onSave={handleSaveInvoice}
        initialInvoice={editingInvoice}
        rooms={rooms}
        tenants={tenants}
        settings={settings}
        defaultRoomId={invoiceDefaultRoomId}
      />

      {/* Quick Meter Batch Modal */}
      <QuickMeterModal
        isOpen={isQuickMeterModalOpen}
        onClose={() => setIsQuickMeterModalOpen(false)}
        rooms={rooms}
        tenants={tenants}
        invoices={invoices}
        settings={settings}
        onSaveBatch={handleBatchMetersSave}
      />

      {/* Invoice Print & VietQR Modal */}
      {selectedInvoiceForPrint && (
        <InvoicePrintView
          isOpen={isPrintInvoiceOpen}
          onClose={() => {
            setIsPrintInvoiceOpen(false);
            setSelectedInvoiceForPrint(null);
          }}
          invoice={selectedInvoiceForPrint}
          room={rooms.find((r) => r.id === selectedInvoiceForPrint.roomId) || rooms[0]}
          tenant={
            tenants.find((t) => t.id === selectedInvoiceForPrint.tenantId) ||
            tenants.find((t) => t.roomId === selectedInvoiceForPrint.roomId) ||
            tenants[0]
          }
          settings={settings}
        />
      )}

      {/* Tenancy Contract Modal */}
      {selectedContractData && (
        <ContractModal
          isOpen={isContractModalOpen}
          onClose={() => {
            setIsContractModalOpen(false);
            setSelectedContractData(null);
          }}
          tenant={selectedContractData.tenant}
          room={selectedContractData.room}
          settings={settings}
        />
      )}

      {/* Dedicated Reminder Modal */}
      <ReminderCenterModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        invoices={invoices}
        rooms={rooms}
        tenants={tenants}
        settings={settings}
        onMarkReminderSent={handleMarkReminderSent}
      />

      {/* Settings & VietQR Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={updateSettings}
        onReloadAllData={reloadAll}
      />
    </div>
  );
}
