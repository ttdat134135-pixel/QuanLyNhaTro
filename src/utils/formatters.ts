import { Invoice, LandlordSettings, Room, Tenant, BankOption } from '../types';

export const POPULAR_BANKS: BankOption[] = [
  { code: 'MB', shortName: 'MBBank', name: 'Ngân hàng Quân Đội' },
  { code: 'VCB', shortName: 'Vietcombank', name: 'Ngân hàng Ngoại Thương Việt Nam' },
  { code: 'TCB', shortName: 'Techcombank', name: 'Ngân hàng Kỹ Thương Việt Nam' },
  { code: 'ACB', shortName: 'ACB', name: 'Ngân hàng Á Châu' },
  { code: 'BIDV', shortName: 'BIDV', name: 'Ngân hàng Đầu tư và Phát triển Việt Nam' },
  { code: 'ICB', shortName: 'VietinBank', name: 'Ngân hàng Công Thương Việt Nam' },
  { code: 'VPB', shortName: 'VPBank', name: 'Ngân hàng Việt Nam Thịnh Vượng' },
  { code: 'TPB', shortName: 'TPBank', name: 'Ngân hàng Tiên Phong' },
  { code: 'STB', shortName: 'Sacombank', name: 'Ngân hàng Sài Gòn Thương Tín' },
  { code: 'HDB', shortName: 'HDBank', name: 'Ngân hàng Phát triển TP.HCM' },
  { code: 'VIB', shortName: 'VIB', name: 'Ngân hàng Quốc tế' },
  { code: 'OCB', shortName: 'OCB', name: 'Ngân hàng Phương Đông' },
  { code: 'MSB', shortName: 'MSB', name: 'Ngân hàng Hàng Hải Việt Nam' },
  { code: 'SHB', shortName: 'SHB', name: 'Ngân hàng Sài Gòn - Hà Nội' },
  { code: 'LPB', shortName: 'LPBank', name: 'Ngân hàng Lộc Phát Việt Nam' },
];

export function formatVND(amount: number): string {
  if (isNaN(amount) || amount === undefined || amount === null) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

export function formatNumber(val: number): string {
  if (isNaN(val) || val === undefined || val === null) return '0';
  return new Intl.NumberFormat('vi-VN').format(val);
}

export function formatDateVN(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

export function formatMonthVN(monthStr?: string): string {
  if (!monthStr) return '';
  const parts = monthStr.split('-');
  if (parts.length >= 2) {
    return `Tháng ${parts[1]}/${parts[0]}`;
  }
  return monthStr;
}

// Convert number to Vietnamese text (e.g. 3500000 -> "Ba triệu năm trăm nghìn đồng chẵn")
export function numberToVietnameseWords(num: number): string {
  if (num === 0) return 'Không đồng';
  if (!num || isNaN(num)) return '';

  const defaultNumbers = [' không ', ' một ', ' hai ', ' ba ', ' bốn ', ' năm ', ' sáu ', ' bảy ', ' tám ', ' chín '];

  function readThreeDigits(triplet: number, showZero: boolean): string {
    const hundred = Math.floor(triplet / 100);
    const ten = Math.floor((triplet % 100) / 10);
    const one = triplet % 10;
    let res = '';

    if (hundred > 0 || showZero) {
      res += defaultNumbers[hundred] + 'trăm';
      if (ten === 0 && one > 0) res += ' lẻ';
    }
    if (ten > 0 && ten !== 1) {
      res += defaultNumbers[ten] + 'mươi';
      if (ten === 0 && one > 0) res += ' linh';
    }
    if (ten === 1) res += ' mười';

    switch (one) {
      case 1:
        if (ten > 1) res += ' mốt';
        else res += defaultNumbers[one];
        break;
      case 5:
        if (ten > 0) res += ' lăm';
        else res += defaultNumbers[one];
        break;
      default:
        if (one > 0) res += defaultNumbers[one];
        break;
    }
    return res;
  }

  let str = Math.abs(Math.round(num)).toString();
  let groups = [];
  while (str.length > 0) {
    groups.unshift(parseInt(str.slice(-3), 10));
    str = str.slice(0, -3);
  }

  const units = ['', ' nghìn', ' triệu', ' tỷ', ' nghìn tỷ', ' triệu tỷ'];
  let result = '';
  for (let i = 0; i < groups.length; i++) {
    const triplet = groups[i];
    if (triplet > 0) {
      const showZero = i > 0;
      result += readThreeDigits(triplet, showZero) + units[groups.length - 1 - i];
    }
  }

  result = result.replace(/\s+/g, ' ').trim();
  if (!result) return 'Không đồng';
  const capitalized = result.charAt(0).toUpperCase() + result.slice(1) + ' đồng chẵn';
  return capitalized;
}

// Generate VietQR direct image URL
export function getVietQRUrl(params: {
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
  amount: number;
  description: string;
}): string {
  const { bankCode, accountNumber, accountHolder, amount, description } = params;
  if (!bankCode || !accountNumber) return '';
  const cleanBank = encodeURIComponent(bankCode.trim());
  const cleanAcc = encodeURIComponent(accountNumber.trim());
  const cleanDesc = encodeURIComponent(description.slice(0, 50).trim());
  const cleanName = encodeURIComponent(accountHolder.trim());
  const roundedAmount = Math.round(amount);

  return `https://img.vietqr.io/image/${cleanBank}-${cleanAcc}-compact2.png?amount=${roundedAmount}&addInfo=${cleanDesc}&accountName=${cleanName}`;
}

// Format message for Zalo or SMS
export function generateZaloBillMessage(params: {
  invoice: Invoice;
  room: Room;
  tenant: Tenant;
  settings: LandlordSettings;
}): string {
  const { invoice, room, tenant, settings } = params;
  const monthText = formatMonthVN(invoice.month);
  const electricKwh = Math.max(0, invoice.currElectric - invoice.prevElectric);
  const waterText =
    invoice.waterType === 'METER'
      ? `${formatNumber(invoice.currWater - invoice.prevWater)} m³ x ${formatVND(invoice.waterPrice)} = ${formatVND(invoice.waterTotal)}`
      : invoice.waterType === 'PER_PERSON'
      ? `${invoice.waterCount} người x ${formatVND(invoice.waterPrice)} = ${formatVND(invoice.waterTotal)}`
      : `${formatVND(invoice.waterTotal)} (Cố định)`;

  const remaining = Math.max(0, invoice.totalAmount - (invoice.paidAmount || 0));
  const transferContent = `${room.name.replace(/\s+/g, '')} ${invoice.month.replace('-', '')}`;

  return `🏠 [THÔNG BÁO TIỀN PHÒNG ${monthText.toUpperCase()}]
Kính gửi bạn: ${tenant.fullName} - ${room.name} (${settings.houseName})

Chi tiết các khoản phí:
1. Tiền phòng: ${formatVND(invoice.roomFee)}
2. Tiền điện: (${invoice.prevElectric} ➜ ${invoice.currElectric} = ${electricKwh} kWh x ${formatVND(invoice.electricPrice)}): ${formatVND(invoice.electricTotal)}
3. Tiền nước: ${waterText}
${invoice.internetFee > 0 ? `4. Internet / Wifi: ${formatVND(invoice.internetFee)}\n` : ''}${invoice.garbageFee > 0 ? `5. Phí vệ sinh / Rác: ${formatVND(invoice.garbageFee)}\n` : ''}${invoice.otherFee > 0 ? `6. Dịch vụ khác (${invoice.otherFeeDescription || 'Khác'}): ${formatVND(invoice.otherFee)}\n` : ''}${invoice.discount > 0 ? `Giảm trừ: -${formatVND(invoice.discount)}\n` : ''}-------------------------
👉 TỔNG CỘNG: ${formatVND(invoice.totalAmount)}
${invoice.paidAmount > 0 ? `(Đã trả: ${formatVND(invoice.paidAmount)} - CÒN LẠI: ${formatVND(remaining)})\n` : ''}
📅 Hạn thanh toán: Ngày ${formatDateVN(invoice.dueDate)}

💳 Thông tin chuyển khoản:
- Ngân hàng: ${settings.bankName} (${settings.bankCode})
- Số tài khoản: ${settings.accountNumber}
- Chủ tài khoản: ${settings.accountHolder.toUpperCase()}
- Nội dung CK: ${transferContent}

Nếu cần hỗ trợ, xin liên hệ quản lý: ${settings.phone} (${settings.landlordName}).
Trân trọng cảm ơn bạn!`;
}

// Generate Email mailto link
export function generateEmailUrl(params: {
  invoice: Invoice;
  room: Room;
  tenant: Tenant;
  settings: LandlordSettings;
}): string {
  const { invoice, room, tenant, settings } = params;
  if (!tenant.email) return '';

  const subject = `[${settings.houseName}] Thông báo tiền phòng ${formatMonthVN(invoice.month)} - ${room.name}`;
  const body = generateZaloBillMessage({ invoice, room, tenant, settings });

  return `mailto:${encodeURIComponent(tenant.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// Clean phone for Zalo link: 0912345678 -> 84912345678 or standard
export function getCleanPhoneForZalo(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '84' + cleaned.slice(1);
  }
  return cleaned;
}
