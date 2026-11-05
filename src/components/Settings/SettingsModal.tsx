import React, { useState } from 'react';
import { 
  X, 
  Save, 
  QrCode, 
  Building2, 
  CreditCard, 
  Zap, 
  RotateCcw, 
  Download, 
  Upload, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { LandlordSettings, WaterBillingType } from '../../types';
import { POPULAR_BANKS, getVietQRUrl } from '../../utils/formatters';
import { exportFullBackup, importFullBackup, resetAllDataToDefault } from '../../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: LandlordSettings;
  onSaveSettings: (settings: LandlordSettings) => void;
  onReloadAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onReloadAllData,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'general' | 'banking' | 'rates' | 'backup'>('general');

  // Form State
  const [houseName, setHouseName] = useState(settings.houseName);
  const [landlordName, setLandlordName] = useState(settings.landlordName);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [idCard, setIdCard] = useState(settings.idCard);
  const [address, setAddress] = useState(settings.address);

  // Bank & VietQR
  const [bankCode, setBankCode] = useState(settings.bankCode || 'MB');
  const [bankName, setBankName] = useState(settings.bankName || 'MBBank');
  const [accountNumber, setAccountNumber] = useState(settings.accountNumber || '');
  const [accountHolder, setAccountHolder] = useState(settings.accountHolder || '');

  // Rates
  const [defaultElectricRate, setDefaultElectricRate] = useState(String(settings.defaultElectricRate || 3500));
  const [defaultWaterRate, setDefaultWaterRate] = useState(String(settings.defaultWaterRate || 15000));
  const [waterBillingType, setWaterBillingType] = useState<WaterBillingType>(settings.waterBillingType || 'METER');
  const [defaultInternetFee, setDefaultInternetFee] = useState(String(settings.defaultInternetFee || 50000));
  const [defaultGarbageFee, setDefaultGarbageFee] = useState(String(settings.defaultGarbageFee || 30000));
  const [dueDayOfMonth, setDueDayOfMonth] = useState(String(settings.dueDayOfMonth || 5));
  const [termsAndRules, setTermsAndRules] = useState(settings.termsAndRules || '');

  // Preview QR
  const previewQrUrl = getVietQRUrl({
    bankCode,
    accountNumber,
    accountHolder,
    amount: 3500000,
    description: 'PHONG101 T052025',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedBank = POPULAR_BANKS.find((b) => b.code === bankCode);

    const updated: LandlordSettings = {
      houseName: houseName.trim(),
      landlordName: landlordName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      idCard: idCard.trim(),
      address: address.trim(),
      bankName: selectedBank ? selectedBank.shortName : bankName,
      bankCode: bankCode.trim(),
      accountNumber: accountNumber.trim(),
      accountHolder: accountHolder.trim().toUpperCase(),
      defaultElectricRate: Number(defaultElectricRate) || 3500,
      defaultWaterRate: Number(defaultWaterRate) || 15000,
      waterBillingType,
      defaultInternetFee: Number(defaultInternetFee) || 50000,
      defaultGarbageFee: Number(defaultGarbageFee) || 30000,
      dueDayOfMonth: Number(dueDayOfMonth) || 5,
      termsAndRules: termsAndRules.trim(),
    };

    onSaveSettings(updated);
    onClose();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importFullBackup(content);
      if (res.success) {
        alert('Khôi phục dữ liệu thành công!');
        onReloadAllData();
        onClose();
      } else {
        alert(res.message);
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefault = () => {
    if (confirm('Khôi phục toàn bộ dữ liệu về cấu hình và 13 phòng mẫu ban đầu?')) {
      resetAllDataToDefault();
      onReloadAllData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-800">
              Cài đặt Nhà Trọ & Tài Khoản VietQR
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 pt-2 space-x-2">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-2 px-3 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'general'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Thông tin khu trọ
          </button>
          <button
            onClick={() => setActiveTab('banking')}
            className={`py-2 px-3 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'banking'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Tài khoản VietQR
          </button>
          <button
            onClick={() => setActiveTab('rates')}
            className={`py-2 px-3 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'rates'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Đơn giá & Nội quy
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`py-2 px-3 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'backup'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sao lưu dữ liệu
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Tab 1: General Info */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên khu trọ / Tòa nhà <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={houseName}
                    onChange={(e) => setHouseName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Họ và tên chủ trọ / Người đại diện <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={landlordName}
                    onChange={(e) => setLandlordName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số điện thoại liên lạc <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email nhận thông báo
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số CCCD chủ trọ (ghi hợp đồng)
                  </label>
                  <input
                    type="text"
                    value={idCard}
                    onChange={(e) => setIdCard(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Địa chỉ khu trọ (ghi trên hóa đơn và hợp đồng) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-emerald-600"
                />
              </div>
            </div>
          )}

          {/* Tab 2: VietQR Banking */}
          {activeTab === 'banking' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                ✨ <strong>Tích hợp VietQR chuẩn Quốc gia:</strong> Khách thuê khi nhận hóa đơn chỉ cần mở ứng dụng bất kỳ ngân hàng nào (Vietcombank, MB, BIDV, VPBank, Techcombank, MoMo...) quét mã là thông tin tài khoản và số tiền sẽ được tự động điền chính xác 100%.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ngân hàng thụ hưởng <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={bankCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        setBankCode(code);
                        const b = POPULAR_BANKS.find((x) => x.code === code);
                        if (b) setBankName(b.shortName);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium focus:outline-emerald-600"
                    >
                      {POPULAR_BANKS.map((bank) => (
                        <option key={bank.code} value={bank.code}>
                          {bank.shortName} - {bank.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Số tài khoản ngân hàng <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: 090812345688"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold focus:outline-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tên chủ tài khoản (Không dấu) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: NGUYEN VAN MINH"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase font-bold focus:outline-emerald-600"
                    />
                  </div>
                </div>

                {/* Live Preview QR */}
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                  <span className="text-xs font-bold text-slate-700 uppercase mb-2">
                    Mã QR Demo trên hóa đơn
                  </span>
                  {previewQrUrl ? (
                    <img
                      src={previewQrUrl}
                      alt="VietQR Demo"
                      className="w-40 h-40 object-contain rounded-xl border border-slate-200 bg-white p-2 shadow-xs"
                    />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center bg-slate-100 rounded-xl text-xs text-slate-400">
                      Nhập STK để xem
                    </div>
                  )}
                  <span className="text-[11px] text-slate-500 mt-2">
                    {accountHolder || 'CHỦ TÀI KHOẢN'} • {accountNumber || 'Số TK'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Rates & Rules */}
          {activeTab === 'rates' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Đơn giá điện mặc định (VNĐ/kWh)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={defaultElectricRate}
                    onChange={(e) => setDefaultElectricRate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-amber-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hình thức tính tiền nước
                  </label>
                  <select
                    value={waterBillingType}
                    onChange={(e) => setWaterBillingType(e.target.value as WaterBillingType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="METER">Theo khối đồng hồ (m³)</option>
                    <option value="PER_PERSON">Theo số người (đ/người/tháng)</option>
                    <option value="FIXED">Khoán cố định theo phòng</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Đơn giá nước ({waterBillingType === 'METER' ? 'đ/m³' : 'đ/người'})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={defaultWaterRate}
                    onChange={(e) => setDefaultWaterRate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phí Internet/Wifi (đ/phòng)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={defaultInternetFee}
                    onChange={(e) => setDefaultInternetFee(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phí rác / vệ sinh (đ/phòng)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={defaultGarbageFee}
                    onChange={(e) => setDefaultGarbageFee(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ngày thanh toán định kỳ hằng tháng (Ngày mấy)
                </label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={dueDayOfMonth}
                  onChange={(e) => setDueDayOfMonth(e.target.value)}
                  className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold"
                />
                <span className="text-xs text-slate-500 ml-2">hàng tháng</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nội quy khu trọ (Tự động đưa vào Hợp đồng thuê)
                </label>
                <textarea
                  rows={4}
                  value={termsAndRules}
                  onChange={(e) => setTermsAndRules(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>
          )}

          {/* Tab 4: Backup & Reset */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Xuất bản sao lưu toàn bộ (JSON)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Tải về máy toàn bộ danh sách phòng, khách thuê, hóa đơn và cài đặt
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={exportFullBackup}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải file sao lưu</span>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Khôi phục dữ liệu từ file sao lưu
                    </h4>
                    <p className="text-xs text-slate-500">
                      Chọn file JSON sao lưu trước đó để khôi phục lại dữ liệu
                    </p>
                  </div>
                  <label className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>Chọn file JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-rose-800">
                      Khôi phục dữ liệu mẫu ban đầu
                    </h4>
                    <p className="text-xs text-rose-600">
                      Cài đặt lại 13 phòng mẫu với đầy đủ khách thuê và hóa đơn demo
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetDefault}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Khôi phục mẫu</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
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
              <Save className="w-4 h-4" />
              <span>Lưu cài đặt</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
