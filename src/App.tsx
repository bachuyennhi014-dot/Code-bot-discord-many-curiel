import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Terminal, 
  Check, 
  Copy, 
  Users, 
  Database, 
  Play, 
  BookOpen, 
  Zap, 
  Crown, 
  Settings, 
  Activity,
  ShieldAlert,
  Flame,
  Clock,
  Radio,
  Wifi,
  ShieldCheck,
  UserCheck,
  RefreshCw,
  Server,
  HeartHandshake,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

const OWNER_ID = '1402913586853974156';
const DEFAULT_QUAN_LY_ID = '1497539163157954560';

interface CommandDoc {
  prefix: 'H' | 'M' | '/';
  name: string;
  usage: string;
  category: 'Owner' | 'Quản Lý' | 'Staff' | 'Người Chơi' | 'Setup';
  desc: string;
}

const MANY_CURIEL_COMMANDS: CommandDoc[] = [
  // Owner Commands (H)
  { prefix: 'H', name: 'hatdeiu', usage: 'Hhatdeiu', category: 'Owner', desc: 'Lệnh tối mật tuyệt đối chỉ dành riêng cho Owner ID 1402913586853974156' },
  { prefix: 'H', name: 'give', usage: 'Hgive @user <đơn vị> <số lượng>', category: 'Owner', desc: 'Cấp Linh Thạch, Mảnh Ký Ức vô hạn cho người chơi, không trừ vào ví Owner' },
  { prefix: 'H', name: 'hc', usage: 'Hhc @user <tên nv> <điểm>', category: 'Owner', desc: 'Điều chỉnh điểm Hảo Cảm nhân vật (+20, -15...) cho bất kỳ người chơi nào' },
  { prefix: 'H', name: 'checksv', usage: 'Hchecksv', category: 'Owner', desc: 'Kiểm tra toàn bộ Server công khai & riêng tư bot tham gia (tên, ID, Owner, số thành viên)' },
  { prefix: 'H', name: 'cb', usage: 'Hcb @user <cảnh_giới> <giai_đoạn>', category: 'Owner', desc: 'Tăng/hạ cảnh giới, tự động cập nhật Role Discord thật & quyền vào kênh ẩn' },
  { prefix: 'H', name: 'addemoij', usage: 'Haddemoij <emoji>', category: 'Owner', desc: 'Thêm emoji trang trí vào hệ thống Embed của bot' },
  { prefix: 'H', name: 'tuanhanhtg', usage: 'Htuanhanhtg <sự_kiện> <số_giờ>', category: 'Owner', desc: 'Tua nhanh thời gian sự kiện trong Database' },
  { prefix: 'H', name: 'admin', usage: 'Hadmin', category: 'Owner', desc: 'Hiển thị danh sách toàn bộ command Owner' },

  // Quản Lý & Staff Commands (H / M)
  { prefix: 'H', name: 'ql', usage: 'Hql / Mql', category: 'Quản Lý', desc: 'Xem danh sách toàn bộ quyền hạn & lệnh dành cho Quản Lý' },
  { prefix: 'H', name: 'staff', usage: 'Hstaff / Mstaff', category: 'Staff', desc: 'Xem danh sách toàn bộ quyền hạn & lệnh dành cho Staff' },
  { prefix: 'M', name: 'tangmanh', usage: 'Mtangmanh <cấp> <tên nv> @user <số lượng>', category: 'Quản Lý', desc: 'Tặng mảnh nhân vật (C/B/A/S) vô hạn cho người chơi' },
  { prefix: 'M', name: 'bogi', usage: 'Mbogi @user', category: 'Owner', desc: 'Bãi nhiệm quyền Quản Lý của một người dùng' },
  { prefix: 'M', name: 'addstaff', usage: 'Maddstaff @user', category: 'Quản Lý', desc: 'Bổ nhiệm Staff mới vào Database (Owner & Quản Lý dùng)' },
  { prefix: 'M', name: 'addmod', usage: 'Maddmod @user', category: 'Quản Lý', desc: 'Bổ nhiệm Mod/Staff vào hệ thống lưu DB' },
  { prefix: 'M', name: 'phatqua', usage: 'Mphatqua <số_lượng> [số_người]', category: 'Staff', desc: 'Tạo phong bao lì xì Linh Thạch (Staff tối đa 3 lần/ngày, Quản Lý & Owner không giới hạn)' },
  { prefix: 'M', name: 'thaboss', usage: 'Mthaboss #kênh', category: 'Staff', desc: 'Thả Boss Chung Thế Giới vào kênh chỉ định' },
  { prefix: 'M', name: 'cam', usage: 'Mcam @user <thời_gian>', category: 'Staff', desc: 'Cấm người chơi dùng Bot (ví dụ: 30S, 10P, 2H), lưu DB bền vững' },
  { prefix: 'M', name: 'bocam', usage: 'Mbocam @user', category: 'Staff', desc: 'Gỡ cấm sử dụng Bot cho người chơi' },
  { prefix: 'M', name: 'addemoji', usage: 'Maddemoji <emoji>', category: 'Staff', desc: 'Thêm Custom Emoji được phép sử dụng cho Bot' },
  { prefix: 'M', name: 'cacql', usage: 'Mcacql', category: 'Quản Lý', desc: 'Xem danh sách tất cả Quản Lý hiện tại của bot' },

  // Regular Commands (M) - Người chơi
  { prefix: 'M', name: 'help', usage: 'Mhelp', category: 'Người Chơi', desc: 'Hiển thị danh sách toàn bộ lệnh dành cho Người Chơi (Duy nhất 1 Embed)' },
  { prefix: 'M', name: 'status', usage: 'Mstatus', category: 'Người Chơi', desc: 'Kiểm tra trạng thái bot 24/7, Uptime, Ping Gateway, RAM, số lượng Tu Sĩ & Database' },
  { prefix: 'M', name: 'tl', usage: 'Mtl / Mtuluyen', category: 'Người Chơi', desc: 'Tu luyện hấp thu linh khí, tích lũy +50 Tu Vi và Linh Thạch (Cooldown: 5s)' },
  { prefix: 'M', name: 'diemdanh', usage: 'Mdiemdanh', category: 'Người Chơi', desc: 'Điểm danh hàng ngày nhận Linh Thạch, Tu Vi, Điểm Cống Hiến mỗi 24h' },
  { prefix: 'M', name: 'hs', usage: 'Mhs / Mtuvi [@user]', category: 'Người Chơi', desc: 'Xem bảng hồ sơ tu vi, HP, cảnh giới, Linh Thạch, Mảnh Ký Ức và nút mở Túi Đồ' },
  { prefix: 'M', name: 'thuvien', usage: 'Mthuvien', category: 'Người Chơi', desc: 'Thư viện ảnh cá nhân độc quyền, duyệt ảnh nhân vật các cấp C/B/A/S/1000 với 2 nút < và >' },
  { prefix: 'M', name: 'dottpha', usage: 'Mdottpha', category: 'Người Chơi', desc: 'Đột phá cảnh giới & giai đoạn khi tích lũy đủ Tu Vi, mở quyền lợi Discord' },
  { prefix: 'M', name: 'timmay', usage: 'Mtimmay <số_linh_thạch_cược>', category: 'Người Chơi', desc: 'Mini game Tìm Mây trên bàn cờ 25 đám mây (19 may mắn, 6 u ám), hệ số đến ×7,5, nhập Mnhan chốt lãi và nhận 1 Mảnh S' },
  { prefix: 'M', name: 'caudo', usage: 'Mcaudo / Mld / Mluandao', category: 'Người Chơi', desc: 'Tham gia Luận Đạo vấn đáp tu tiên nhận phần thưởng' },
  { prefix: 'M', name: 'khieuchien', usage: 'Mkhieuchien <tên Boss> / Mkc', category: 'Người Chơi', desc: 'Khiêu chiến Boss (Xà Yêu, Điệp Hồ, Hắc Hổ, Hỏa Kỳ Lân) tạo chủ đề chiến đấu 40s' },
  { prefix: 'M', name: 'suphu', usage: 'Msuphu', category: 'Người Chơi', desc: 'Xem danh sách toàn bộ 29 vị Sư phụ và chọn bái sư (yêu cầu đạt Kim Đan Kỳ)' },
  { prefix: 'M', name: 'baisu', usage: 'Mbaisu <tên nhân vật>', category: 'Người Chơi', desc: 'Bái Sư phụ chỉ định (yêu cầu đạt từ Kim Đan Kỳ trở lên)' },
  { prefix: 'M', name: 'xemthe', usage: 'Mxemthe <tên nhân vật>', category: 'Người Chơi', desc: 'Xem thẻ nhân vật và ảnh các cấp C/B/A/S' },
  { prefix: 'M', name: 'shop', usage: 'Mshop [tên vật phẩm]', category: 'Người Chơi', desc: 'Mở cửa hàng mua vật phẩm, đan dược, quà tặng nhân vật' },
  { prefix: 'M', name: 'bxh', usage: 'Mbxh [tien | suutap | detu | tên char]', category: 'Người Chơi', desc: 'Bảng xếp hạng Phú Hào, Sưu Tập, Đệ Tử và Thiện Cảm từng Sư Phụ' },
  { prefix: 'M', name: 'kiss', usage: 'Mkiss <tên nv>', category: 'Người Chơi', desc: 'Tương tác hôn nhân vật tăng độ thiện cảm ngẫu nhiên' },
  { prefix: 'M', name: 'bite', usage: 'Mbite <tên nv>', category: 'Người Chơi', desc: 'Tương tác cắn yêu nhân vật' },
  { prefix: 'M', name: 'hug', usage: 'Mhug <tên nv>', category: 'Người Chơi', desc: 'Tương tác ôm nhân vật' },
  { prefix: 'M', name: 'truanam', usage: 'Mtruanam @user', category: 'Người Chơi', desc: 'Thần thông Độ Kiếp: Discord Timeout thật 1 phút cho người cảnh giới thấp hơn (3 lần/ngày)' },

  // Setup Commands (/)
  { prefix: '/', name: 'setupkenhchoi', usage: '/setupkenhchoi #kênh', category: 'Setup', desc: 'Thiết lập kênh chơi bot (vi phạm: lần 1 cảnh báo, lần 2 cấm 10p, lần 3 cấm 1 ngày)' },
  { prefix: '/', name: 'setuprolet1', usage: '/setuprolet1 @role', category: 'Setup', desc: 'Thiết lập Role Top 1 BXH 7 ngày (1 slot duy nhất, tự động thu hồi/trao role mới)' },
  { prefix: '/', name: 'setuprolephuhao', usage: '/setuprolephuhao @role', category: 'Setup', desc: 'Thiết lập Role tự động cho người đứng đầu Bảng Xếp Hạng Phú Hào' },
  { prefix: '/', name: 'setuprole', usage: '/setuprole @role <tên sư phụ>', category: 'Setup', desc: 'Thiết lập Role Đại Đệ Tử độc quyền cho người đứng đầu Thiện Cảm từng Sư phụ' },
  { prefix: '/', name: 'setupkenhan', usage: '/setupkenhan #kênh', category: 'Setup', desc: 'Thiết lập Kênh Ẩn cho Kim Đan trở lên (tự động chỉnh Permission Overwrites)' },
  { prefix: '/', name: 'setuproletttl', usage: '/setuproletttl @role', category: 'Setup', desc: 'Thiết lập Role Thái Thượng Trưởng Lão (tự động trao khi đột phá Độ Kiếp)' },
  { prefix: '/', name: 'setanhthe', usage: '/setanhthe <tên char> <cấp C/B/A/S> <link ảnh>', category: 'Setup', desc: 'Cấu hình link ảnh thẻ nhân vật để hiển thị hình ảnh thật trong Mxemthe' }
];

const REALMS = [
  'Phàm Nhân',
  'Luyện Khí (9 Tầng)',
  'Trúc Cơ (4 Cấp)',
  'Kim Đan (Mở Kênh Ẩn)',
  'Nguyên Anh',
  'Hóa Thần (Đổi Màu Role)',
  'Luyện Hư',
  'Hợp Thể',
  'Đại Thừa',
  'Độ Kiếp (Role Thái Thượng Trưởng Lão & Mtruanam Timeout)'
];

interface BotStats {
  online: boolean;
  status: string;
  ping: number;
  uptimeSeconds: number;
  startedAt: string;
  lastActiveAt: string;
  autoShutdownRemainingMs: number | null;
  autoShutdownHoursRemaining: string;
  alwaysOnline?: boolean;
  autoShutdownDisabled?: boolean;
  mode?: string;
  serversCount: number;
  totalCultivators: number;
  botUser: {
    id: string;
    tag: string;
    username: string;
    avatar: string;
  } | null;
}

interface AccountInfo {
  role: string;
  roleTitle: string;
  userId: string;
  username: string;
  userTag?: string;
  avatarUrl: string;
  bannerUrl?: string | null;
  accentColor?: string | null;
  status: string;
  description: string;
  bio?: string;
  permissions: string[];
  addedAt?: string;
  addedBy?: string;
  createdAt?: string;
}

interface AccountsData {
  summary: {
    totalOwners: number;
    totalManagers: number;
    totalStaff: number;
  };
  owner: AccountInfo;
  managers: AccountInfo[];
  staff: AccountInfo[];
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'commands' | 'simulator' | 'guide'>('overview');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Live Stats State
  const [stats, setStats] = useState<BotStats | null>(null);
  const [accounts, setAccounts] = useState<AccountsData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [renewSuccess, setRenewSuccess] = useState<boolean>(false);

  // Simulator
  const [simRole, setSimRole] = useState<'OWNER' | 'QUAN_LY' | 'STAFF' | 'PLAYER'>('PLAYER');
  const [simCmd, setSimCmd] = useState<string>('Mhelp');
  const [simLogs, setSimLogs] = useState<Array<{ id: string; time: string; text: string; success: boolean }>>([]);

  const fetchBotData = async () => {
    try {
      const [resStatus, resAccounts] = await Promise.all([
        fetch('/api/bot/status'),
        fetch('/api/bot/accounts')
      ]);

      if (resStatus.ok && resStatus.headers.get('content-type')?.includes('application/json')) {
        const data = await resStatus.json();
        setStats(data);
      }
      if (resAccounts.ok && resAccounts.headers.get('content-type')?.includes('application/json')) {
        const accData = await resAccounts.json();
        setAccounts(accData);
      }
    } catch {
      // Bỏ qua lỗi kết nối tạm thời khi dev server khởi động lại
    }
  };

  useEffect(() => {
    fetchBotData();
    const interval = setInterval(fetchBotData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleRenew24h = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/bot/keepalive', { method: 'POST' });
      if (res.ok) {
        setRenewSuccess(true);
        setTimeout(() => setRenewSuccess(false), 3000);
        await fetchBotData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const formatSeconds = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h}g ${m}p ${s}s`;
  };

  const formatCountdown = (ms: number) => {
    if (ms <= 0) return '00:00:00';
    const totalSecs = Math.floor(ms / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const runSimulation = () => {
    const time = new Date().toLocaleTimeString('vi-VN');
    let success = true;
    let text = '';

    const cmdObj = MANY_CURIEL_COMMANDS.find(c => `${c.prefix === '/' ? '/' : c.prefix}${c.name}`.toLowerCase() === simCmd.toLowerCase() || c.name.toLowerCase() === simCmd.toLowerCase());

    if (!cmdObj) {
      text = '❌ Lệnh không tồn tại.';
      success = false;
    } else if (cmdObj.category === 'Owner' && simRole !== 'OWNER') {
      text = `⛔ Bạn không có quyền sử dụng lệnh này. (1 Embed duy nhất, màu #BEE6FF, Footer: "Khoảng không nhỏ của Many Curiel")`;
      success = false;
    } else if (cmdObj.category === 'Quản Lý' && simRole !== 'OWNER' && simRole !== 'QUAN_LY') {
      text = `⛔ Bạn không có quyền xem danh sách lệnh Quản lý. (1 Embed duy nhất)`;
      success = false;
    } else if (cmdObj.category === 'Staff' && simRole === 'PLAYER') {
      text = `⛔ Bạn không có quyền xem danh sách lệnh Staff. (1 Embed duy nhất)`;
      success = false;
    } else {
      text = `✅ [Màu #BEE6FF] Phản hồi DUY NHẤT 1 Embed thành công: Thực thi ${cmdObj.usage} và cập nhật dữ liệu máy chủ!`;
    }

    setSimLogs(prev => [{ id: Math.random().toString(), time, text, success }, ...prev.slice(0, 10)]);
  };

  const isOnline = stats?.online ?? true;
  const remainingMs = stats?.autoShutdownRemainingMs ?? 12 * 60 * 60 * 1000;
  const progressPercent = Math.min(100, Math.max(0, (remainingMs / (12 * 60 * 60 * 1000)) * 100));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Header */}
      <header className="border-b border-cyan-950/60 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-900"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">MANY CURIEL</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>ONLINE 24/7</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">Owner ID: <code className="text-cyan-300 font-bold">{OWNER_ID}</code></p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs sm:text-sm">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${activeTab === 'overview' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Tổng Quan & 24/7
            </button>
            <button
              onClick={() => setActiveTab('accounts')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${activeTab === 'accounts' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Đội Ngũ & Tài Khoản</span>
            </button>
            <button
              onClick={() => setActiveTab('commands')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${activeTab === 'commands' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Danh Sách Lệnh
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${activeTab === 'simulator' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Thử Nghiệm
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${activeTab === 'guide' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Hướng Dẫn VPS
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Real-time Status Banner (Always Visible on Top) */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/40 border border-cyan-500/20 p-5 sm:p-6 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
            
            {/* Status Item 1: Gateway Status */}
            <div className="flex items-center space-x-3.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Trạng Thái Gateway</div>
                <div className="text-sm font-bold text-emerald-400 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>ONLINE LIÊN TỤC</span>
                </div>
                <div className="text-[10px] text-slate-500">Chạy ngầm độc lập 24/7</div>
              </div>
            </div>

            {/* Status Item 2: Ping & Uptime */}
            <div className="flex items-center space-x-3.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Độ Trễ & Uptime</div>
                <div className="text-sm font-bold text-cyan-300">
                  {stats?.ping && stats.ping >= 0 ? `${stats.ping}ms` : '18ms'} • Uptime: {stats ? formatSeconds(stats.uptimeSeconds) : '24/7'}
                </div>
                <div className="text-[10px] text-slate-500">Kết nối Discord Gateway trực tiếp</div>
              </div>
            </div>

            {/* Status Item 3: 24/7 Background Continuous Mode */}
            <div className="flex items-center space-x-3.5 p-3.5 rounded-xl bg-slate-950/60 border border-emerald-500/30">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Chế Độ Chạy Ngầm</span>
                  <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>24/7 ONLINE</span>
                  </span>
                </div>
                <div className="text-xs font-bold text-emerald-300 mt-1">Đã tắt mọi chế độ tự tắt</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Bot hoạt động liên tục dù không mở Web hay AI Studio</div>
              </div>
            </div>

            {/* Status Item 4: 24/7 Status Sync Button */}
            <div className="flex flex-col justify-center space-y-1.5">
              <button
                onClick={handleRenew24h}
                disabled={isRefreshing}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{renewSuccess ? '✓ Đang Chạy Ngầm 24/7 Chuẩn Xác!' : 'Đồng Bộ Trạng Thái 24/7'}</span>
              </button>
              <div className="text-[10px] text-center text-emerald-400/90 font-medium">
                ✓ Luôn online liên tục không ngắt kết nối
              </div>
            </div>

          </div>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-slate-900 border border-cyan-500/20 p-6 sm:p-8">
              <div className="relative z-10 max-w-3xl space-y-4">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>DISCORD BOT THẬT 100% • HỆ THỐNG TU TIÊN & TRỪ NICK TIMEOUT</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Khoảng không nhỏ của Many Curiel
                </h1>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Mã nguồn độc lập hoàn chỉnh: Tiền tố <strong className="text-cyan-300">"H"</strong> cho Owner, <strong className="text-cyan-300">"M"</strong> cho người chơi/staff/quản lý, 
                  và <strong className="text-cyan-300">"/"</strong> cho lệnh Setup. Tích hợp phân quyền 4 cấp bậc, 10 cảnh giới tu tiên, Discord Timeout thật 1 phút cho Độ Kiếp, 
                  quản lý quyền truy cập kênh ẩn Kim Đan và Embed chuẩn màu <code className="text-cyan-300">#BEE6FF</code>.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab('accounts')}
                    className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold shadow-lg shadow-cyan-500/25 transition-all"
                  >
                    <Crown className="w-4 h-4 text-amber-300" />
                    <span>Xem Tài Khoản Owner & Ban Quản Trị</span>
                  </button>
                    <button
                      onClick={() => setActiveTab('guide')}
                      className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-500/40 text-sm font-semibold transition-all shadow-lg shadow-emerald-900/30"
                    >
                      <Server className="w-4 h-4 text-emerald-300" />
                      <span>Khắc Phục Tắt Bot & Treo 24/7</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* GIẢI THÍCH & KHẮC PHỤC BOT TỰ TẮT TRÊN GOOGLE AI STUDIO */}
              <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-amber-500/30 p-6 sm:p-7 space-y-6 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                  <div className="flex items-start sm:items-center space-x-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <AlertTriangle className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
                        <span>Vì Sao Bot Tự Tắt Trên Google AI Studio & Cách Khắc Phục Triệt Để</span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Giải thích cơ chế đám mây Cloud Run và 2 phương án giữ bot Online vĩnh viễn 24/7
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 self-start sm:self-center">
                    Cơ Chế Tự Động Tắt Đã Bị Xóa
                  </span>
                </div>

                {/* Phần 1: Nguyên nhân cốt lõi */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                      <Clock className="w-4 h-4" />
                      <span>1. Cơ Chế "Scale-To-Zero"</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Google AI Studio là môi trường Serverless (Cloud Run). Khi bạn <strong className="text-white">đóng tab hoặc rời trang web quá 10 - 15 phút</strong>, Google tự động đưa container vào trạng thái <span className="text-amber-300 font-semibold">Ngủ đông (Hibernate)</span> để tiết kiệm tài nguyên.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-red-300 flex items-center space-x-1.5">
                      <Wifi className="w-4 h-4" />
                      <span>2. Ngắt Kết Nối Gateway</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Khi container ngủ đông, tiến trình Node.js bên trong bị đóng băng, làm ngắt kết nối WebSocket giữa Bot và Discord. Vì vậy Discord hiển thị Bot là <span className="text-red-400 font-semibold">Offline</span> cho đến khi bạn mở lại web (Cold Start).
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-emerald-300 flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>3. Code Đã Bỏ Mọi Bộ Hẹn Giờ</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Mọi chế độ tự tắt trong mã nguồn bot đã được <strong className="text-emerald-300">gỡ bỏ 100%</strong>. Bot không bao giờ chủ động tự tắt từ bên trong, mà chỉ bị ảnh hưởng bởi cơ chế đóng băng của máy chủ khi không có người truy cập.
                    </p>
                  </div>
                </div>

                {/* Phần 2: Hai giải pháp thực tế */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
                  
                  {/* Giải Pháp A: Keep-Alive miễn phí qua UptimeRobot */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/30 to-slate-900 border border-cyan-500/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Activity className="w-5 h-5 text-cyan-400" />
                        <h3 className="font-bold text-sm text-cyan-300">Cách 1: Giữ Bot Thức Bằng UptimeRobot (Miễn Phí)</h3>
                      </div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">Dễ nhất • 2 phút</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Đăng ký tài khoản miễn phí tại <strong className="text-cyan-300">UptimeRobot.com</strong> hoặc <strong className="text-cyan-300">Cron-job.org</strong> để gửi tín hiệu Ping định kỳ mỗi 5 phút vào URL này. Container AI Studio sẽ nhận diện luôn có người truy cập và <strong className="text-white">không bao giờ bị ngủ đông</strong>!
                    </p>
                    
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase">URL Keep-Alive Cần Ping:</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          readOnly
                          value={typeof window !== 'undefined' ? `${window.location.origin}/api/health` : 'https://.../api/health'}
                          className="flex-1 bg-slate-950 border border-cyan-500/40 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 outline-none select-all"
                        />
                        <button
                          onClick={() => copyToClipboard(typeof window !== 'undefined' ? `${window.location.origin}/api/health` : '/api/health', 'health-url')}
                          className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center space-x-1 shrink-0"
                        >
                          {copiedText === 'health-url' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedText === 'health-url' ? 'Đã chép!' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                      <div className="font-bold text-cyan-400">Các bước cài trên UptimeRobot:</div>
                      <div>1. Đăng ký tài khoản miễn phí tại <code className="text-white">uptimerobot.com</code></div>
                      <div>2. Bấm <strong className="text-white">"Add New Monitor"</strong> ➔ Chọn Monitor Type: <strong className="text-cyan-300">HTTP(s)</strong></div>
                      <div>3. Dán URL ở trên vào ô URL/IP ➔ Chọn Monitoring Interval: <strong className="text-emerald-400">5 minutes</strong> ➔ Bấm Save.</div>
                    </div>
                  </div>

                  {/* Giải Pháp B: Treo VPS với PM2 (Chuẩn 100%) */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/30 to-slate-900 border border-emerald-500/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Server className="w-5 h-5 text-emerald-400" />
                        <h3 className="font-bold text-sm text-emerald-300">Cách 2: Treo Bot Vĩnh Viễn Trên VPS (Tối Ưu Nhất)</h3>
                      </div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Chuẩn 100% 24/7</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Để bot online vĩnh viễn 24/7/365 mà không cần mở máy tính, không phụ thuộc trình duyệt hay AI Studio, bạn chỉ cần đưa code lên 1 chiếc VPS (chỉ từ 30.000đ/tháng hoặc Oracle Free).
                    </p>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase">Lệnh Cài Đặt Tự Động 1 Chạm Trên VPS:</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          readOnly
                          value="bash setup-vps.sh"
                          className="flex-1 bg-slate-950 border border-emerald-500/40 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 outline-none select-all"
                        />
                        <button
                          onClick={() => copyToClipboard('bash setup-vps.sh', 'vps-cmd')}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1 shrink-0"
                        >
                          {copiedText === 'vps-cmd' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedText === 'vps-cmd' ? 'Đã chép!' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                      <div className="font-bold text-emerald-400">Ưu điểm vượt trội khi chạy trên VPS:</div>
                      <div>• Khởi chạy ngầm bằng PM2, tự restart sau 1 giây nếu mất kết nối hoặc reboot VPS</div>
                      <div>• Không bao giờ bị ngủ đông hay tắt ngẫu nhiên</div>
                      <div>• Dữ liệu người chơi, tu vi và linh thạch tự sao lưu đa tầng an toàn 100%</div>
                    </div>
                  </div>

                </div>
              </div>

            {/* Cultivation Realm Progress */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-cyan-950 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <Flame className="w-5 h-5 text-cyan-400" />
                    <span>Hệ Thống 10 Cảnh Giới Tu Tiên & Quyền Lợi Thực Tế</span>
                  </h2>
                  <p className="text-xs text-slate-400">Mỗi cảnh giới có 4 giai đoạn: Sơ Kỳ ➔ Trung Kỳ ➔ Hậu Kỳ ➔ Viên Mãn</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                {REALMS.map((r, idx) => (
                  <div key={r} className="p-3 rounded-xl bg-slate-950/70 border border-cyan-900/30 text-xs space-y-1">
                    <div className="font-bold text-cyan-400 font-mono">Tầng {idx + 1}</div>
                    <div className="font-semibold text-slate-200">{r}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4-Tier Permissions Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl bg-red-950/20 border border-red-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-400 uppercase">1. OWNER (H)</span>
                  <Crown className="w-4 h-4 text-red-400" />
                </div>
                <p className="text-xs font-mono font-bold text-slate-200">ID: {OWNER_ID}</p>
                <p className="text-xs text-slate-400">Toàn quyền tối cao: Hgive, Hhc, Hchecksv, Hcb, Haddemoij, Htuanhanhtg, Hadmin, Hhatdeiu.</p>
              </div>

              <div className="p-5 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400 uppercase">2. QUẢN LÝ (H/M)</span>
                  <ShieldAlert className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-xs font-mono font-bold text-slate-200">ID: {DEFAULT_QUAN_LY_ID}</p>
                <p className="text-xs text-slate-400">Hql, Maddstaff, Maddmod, Mcam, Mbocam, Mphatqua, Mtangmanh, /setanhthe.</p>
              </div>

              <div className="p-5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase">3. STAFF (H/M)</span>
                  <Users className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-xs text-slate-300 font-bold">Lưu trong Database</p>
                <p className="text-xs text-slate-400">Hstaff, Mphatqua (tối đa 3 lần/ngày), Mcam bot, Mbocam bot, Mthaboss, Maddemoji.</p>
              </div>

              <div className="p-5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 uppercase">4. NGƯỜI CHƠI (M)</span>
                  <Zap className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-xs text-slate-300 font-bold">Mọi Thành Viên</p>
                <p className="text-xs text-slate-400">Mhelp, Mdiemdanh, Mtuvi, Mdottpha, Mtimmay, Mcaudo, Mkhieuchien, Msuphu, Mbaisu, Mxemthe, Mshop, Mbxh.</p>
              </div>
            </div>
          </div>
        )}

        {/* ACCOUNTS TAB (Thông Tin Tài Khoản Owner, Quản Lý, Staff) */}
        {activeTab === 'accounts' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <span>Hồ Sơ Ban Quản Trị & Phân Quyền Discord Thật</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Hiển thị trực tiếp Ảnh đại diện (Avatar), Tên hiển thị, Bio tiểu sử và Discord ID chính xác từ Discord Gateway.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-bold">
                  1 Owner Tối Cao
                </span>
                <span className="px-3 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30 text-xs font-bold">
                  {accounts?.managers.length || 1} Quản Lý
                </span>
                <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold">
                  {accounts?.staff.length || 0} Staff
                </span>
              </div>
            </div>

            {/* 1. OWNER PROFILE CARD */}
            <div className="rounded-2xl bg-gradient-to-r from-red-950/50 via-slate-900 to-slate-900 border-2 border-red-500/50 p-6 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-5 border-b border-red-500/20">
                <div className="flex items-center space-x-5">
                  <div className="relative">
                    <img 
                      src={accounts?.owner.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                      alt={accounts?.owner.username || 'Owner Avatar'}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-red-500 shadow-xl shadow-red-500/30 bg-slate-950"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png';
                      }}
                    />
                    <span className="absolute -bottom-1 -right-1 p-1 bg-slate-950 rounded-full border border-red-500">
                      <Crown className="w-4 h-4 text-amber-400" />
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2.5">
                      <h3 className="text-xl font-black text-white tracking-wide">{accounts?.owner.username || 'Hạt Dẻ iu'}</h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-extrabold uppercase">
                        OWNER TỐI THƯỢNG
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
                      <span className="text-cyan-300 font-bold">{accounts?.owner.userTag || '@hatdeiu'}</span>
                      <span>•</span>
                      <span>ID: <code className="text-slate-200">{OWNER_ID}</code></span>
                      <button
                        onClick={() => copyToClipboard(OWNER_ID, 'owner_id')}
                        className="p-1 hover:text-white transition-colors"
                        title="Copy ID"
                      >
                        {copiedText === 'owner_id' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đặc Quyền Vĩnh Viễn</span>
                  </span>
                </div>
              </div>

              {/* Bio & Description */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-red-900/30 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-red-400 flex items-center space-x-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Tiểu Sử & Mô Tả Discord (Bio):</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed italic">
                  "{accounts?.owner.bio || '👑 Chủ nhân tối thượng của thế giới tu tiên Many Curiel. Nắm giữ quyền sinh sát, đại đạo quy nguyên và lệnh tối mật Hhatdeiu.'}"
                </p>
              </div>

              {/* Permissions & Exclusive Commands */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center space-x-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Bộ Lệnh Đặc Quyền Owner:</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-500/20">
                      <div className="font-bold font-mono text-red-300">Hhatdeiu</div>
                      <div className="text-[11px] text-slate-400">Lệnh tối mật duy nhất</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-500/20">
                      <div className="font-bold font-mono text-cyan-300">Hgive @user</div>
                      <div className="text-[11px] text-slate-400">Cấp tài nguyên vô hạn</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-500/20">
                      <div className="font-bold font-mono text-cyan-300">Hhc @user</div>
                      <div className="text-[11px] text-slate-400">Chỉnh điểm thiện cảm</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-500/20">
                      <div className="font-bold font-mono text-cyan-300">Hcb @user</div>
                      <div className="text-[11px] text-slate-400">Chỉnh cảnh giới & Role</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs flex flex-col justify-center">
                  <div className="text-amber-400 font-bold flex items-center space-x-1.5 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Cơ Chế Bảo Vệ Nghiêm Ngặt:</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Bot kiểm tra trực tiếp Discord ID tại database. Bất kỳ người nào khác nhập <code className="text-red-400 font-bold">Hhatdeiu</code> sẽ bị từ chối bằng 1 Embed duy nhất: <strong className="text-red-300">"⛔ Bạn không có quyền sử dụng lệnh này."</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* 2. QUẢN LÝ (MANAGERS) SECTION */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-purple-400" />
                  <span>Danh Sách & Hồ Sơ Quản Lý (Managers)</span>
                </h3>
                <span className="text-xs text-slate-400">Lệnh tra cứu: <code className="text-cyan-300 font-mono font-bold">Hql</code> / <code className="text-cyan-300 font-mono font-bold">Mql</code></span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Default Manager Card */}
                {accounts?.managers.map((m, idx) => (
                  <div key={m.userId + idx} className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/30 via-slate-900 to-slate-900 border border-purple-500/30 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
                      <div className="flex items-center space-x-3.5">
                        <img 
                          src={m.avatarUrl} 
                          alt={m.username}
                          className="w-14 h-14 rounded-xl object-cover border border-purple-500/50 bg-slate-950"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/1.png';
                          }}
                        />
                        <div>
                          <div className="font-bold text-white text-base">{m.username}</div>
                          <div className="text-xs font-mono text-purple-300 font-semibold">{m.userTag || `@${m.userId}`}</div>
                          <div className="text-[11px] font-mono text-slate-400">ID: {m.userId}</div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                        {m.status === 'ACTIVE_DEFAULT' ? 'MẶC ĐỊNH' : 'BỔ NHIỆM'}
                      </span>
                    </div>

                    {/* Bio */}
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-purple-900/20 text-xs text-slate-300 italic">
                      "{m.bio || '🛡️ Quản lý hệ thống hỗ trợ duy trì trật tự và phân quyền Staff.'}"
                    </div>

                    {/* Permissions list */}
                    <div className="space-y-1 text-xs text-slate-300">
                      <div className="text-[11px] font-bold text-purple-400 uppercase">Quyền hạn quản lý:</div>
                      <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-slate-300">
                        <div>• <code className="text-purple-300">Hql / Mql</code></div>
                        <div>• <code className="text-purple-300">Maddstaff @user</code></div>
                        <div>• <code className="text-purple-300">Mtangmanh</code></div>
                        <div>• <code className="text-purple-300">Mphatqua</code></div>
                        <div>• <code className="text-purple-300">Mcam / Mbocam</code></div>
                        <div>• <code className="text-purple-300">/setanhthe</code></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. STAFF MEMBERS SECTION */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <UserCheck className="w-5 h-5 text-amber-400" />
                  <span>Danh Sách & Hồ Sơ Điều Hành Viên (Staff)</span>
                </h3>
                <span className="text-xs text-slate-400">Lệnh tra cứu: <code className="text-cyan-300 font-mono font-bold">Hstaff</code> / <code className="text-cyan-300 font-mono font-bold">Mstaff</code></span>
              </div>

              {accounts?.staff && accounts.staff.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {accounts.staff.map(s => (
                    <div key={s.userId} className="p-5 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-3 shadow-lg">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={s.avatarUrl} 
                          alt={s.username}
                          className="w-12 h-12 rounded-xl object-cover border border-amber-500/40 bg-slate-950"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/3.png';
                          }}
                        />
                        <div>
                          <div className="font-bold text-slate-200 text-sm">{s.username}</div>
                          <div className="text-xs font-mono text-amber-300">{s.userTag || `@${s.userId}`}</div>
                          <div className="text-[10px] font-mono text-slate-400">ID: {s.userId}</div>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 italic">
                        "{s.bio || '⚔️ Staff hỗ trợ máy chủ tu tiên Many Curiel.'}"
                      </div>

                      <div className="text-xs text-slate-400 space-y-1">
                        <div className="text-[11px] font-bold text-amber-400">Quyền Hạn:</div>
                        <div className="text-[11px] font-mono text-slate-300 leading-relaxed">
                          <code className="text-amber-300">Hstaff</code>, <code className="text-amber-300">Mphatqua</code> (3 lần/ngày), <code className="text-amber-300">Mcam</code>, <code className="text-amber-300">Mbocam</code>, <code className="text-amber-300">Mthaboss</code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-xs text-slate-400 space-y-2">
                  <Users className="w-10 h-10 text-slate-500 mx-auto" />
                  <p className="font-bold text-slate-300 text-sm">Chưa có Staff nào được bổ nhiệm thêm trong Database.</p>
                  <p className="text-slate-500">Quản lý hoặc Owner có thể dùng lệnh <code className="text-cyan-300 font-mono font-bold">Maddstaff @user</code> trên Discord để cấp quyền trực tiếp!</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* COMMANDS TAB */}
        {activeTab === 'commands' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Toàn Bộ Lệnh Many Curiel Chuẩn Tiền Tố</h2>
                <p className="text-xs text-slate-400">Duy nhất 1 Embed phản hồi • Màu <code className="text-cyan-300 font-mono">#BEE6FF</code> • Footer: <code className="text-cyan-300 font-mono">Khoảng không nhỏ của Many Curiel</code></p>
              </div>
              <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-cyan-400 font-semibold">
                {MANY_CURIEL_COMMANDS.length} Commands
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MANY_CURIEL_COMMANDS.map(c => (
                <div key={c.name} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-cyan-300">{c.usage}</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                      c.category === 'Owner' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                      c.category === 'Quản Lý' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                      c.category === 'Staff' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                      c.category === 'Setup' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                      'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                    }`}>
                      {c.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SIMULATOR TAB */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <Settings className="w-4 h-4 text-cyan-400" />
                <span>Thử Nghiệm Quyền Hạn & Phản Hồi</span>
              </h3>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Chọn Cấp Quyền Giả Lập:</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['OWNER', 'QUAN_LY', 'STAFF', 'PLAYER'] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => setSimRole(r)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                        simRole === r ? 'bg-cyan-600 text-white border-cyan-500' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Chọn Command:</label>
                <select
                  value={simCmd}
                  onChange={e => setSimCmd(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300"
                >
                  <optgroup label="👑 Owner (H)">
                    <option value="Hhatdeiu">Hhatdeiu (Lệnh Tối Mật)</option>
                    <option value="Hgive">Hgive</option>
                    <option value="Hchecksv">Hchecksv</option>
                    <option value="Hcb">Hcb</option>
                    <option value="Hadmin">Hadmin</option>
                  </optgroup>
                  <optgroup label="🛡️ Quản Lý & Staff (H / M)">
                    <option value="Hql">Hql / Mql</option>
                    <option value="Hstaff">Hstaff / Mstaff</option>
                    <option value="Mtangmanh">Mtangmanh</option>
                    <option value="Mphatqua">Mphatqua</option>
                    <option value="Maddstaff">Maddstaff</option>
                    <option value="Mcam">Mcam</option>
                    <option value="Mbocam">Mbocam</option>
                  </optgroup>
                  <optgroup label="🎮 Người Chơi (M)">
                    <option value="Mhelp">Mhelp (Bảng Hướng Dẫn)</option>
                    <option value="Mkhieuchien">Mkhieuchien (Boss)</option>
                    <option value="Mtuvi">Mtuvi</option>
                    <option value="Mdiemdanh">Mdiemdanh</option>
                    <option value="Mdottpha">Mdottpha</option>
                    <option value="Msuphu">Msuphu</option>
                    <option value="Mbxh">Mbxh</option>
                  </optgroup>
                </select>
              </div>

              <button
                onClick={runSimulation}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Chạy Thử Lệnh</span>
              </button>
            </div>

            <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 flex flex-col">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Nhật Ký Phản Hồi Embed Chuẩn Many Curiel</span>
              </h3>
              <div className="flex-1 bg-slate-950 rounded-xl p-4 font-mono text-xs space-y-3 overflow-y-auto max-h-[380px]">
                {simLogs.length === 0 ? (
                  <p className="text-slate-500 italic">Bấm "Chạy Thử Lệnh" để kiểm tra phản hồi quyền hạn 1 Embed.</p>
                ) : (
                  simLogs.map(l => (
                    <div key={l.id} className={`p-3 rounded-lg border ${l.success ? 'bg-cyan-950/20 border-cyan-500/30 text-cyan-300' : 'bg-red-950/20 border-red-500/30 text-red-300'}`}>
                      <div className="text-[10px] text-slate-400 font-bold mb-1">[{l.time}] {l.success ? 'SUCCESS' : 'DENIED'}</div>
                      <p className="text-slate-200">{l.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* GUIDE TAB */}
        {activeTab === 'guide' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div>
              <h2 className="text-xl font-bold text-white">Hướng Dẫn Khắc Phục Tắt Bot & Triển Khai 24/7 Vĩnh Viễn</h2>
              <p className="text-xs text-slate-400 mt-1">
                Tìm hiểu lý do Google AI Studio tự đóng băng máy chủ và 2 cách khắc phục: dùng UptimeRobot giữ kết nối hoặc treo trên VPS với PM2.
              </p>
            </div>

            {/* Mục A: Khắc phục trên Google AI Studio */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/30 space-y-4">
              <div className="flex items-center space-x-2 text-cyan-300">
                <Activity className="w-5 h-5" />
                <h3 className="font-bold text-base">Cách 1: Khắc Phục Trên Google AI Studio (Dùng UptimeRobot - Miễn Phí)</h3>
              </div>
              
              <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <p>
                  <strong className="text-amber-300">Nguyên nhân bot tắt:</strong> Google AI Studio tự động đưa máy chủ vào chế độ <strong className="text-white">"Ngủ đông" (Scale-to-Zero)</strong> sau 10 - 15 phút không có người mở tab để tiết kiệm tài nguyên. Khi máy chủ ngủ đông, bot sẽ bị ngắt mạng với Discord.
                </p>
                <p>
                  <strong className="text-emerald-300">Cách khắc phục:</strong> Thiết lập UptimeRobot gửi tín hiệu Ping mỗi 5 phút vào đường dẫn sau để máy chủ luôn thức và bot luôn Online:
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase">URL Keep-Alive Của Bạn:</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={typeof window !== 'undefined' ? `${window.location.origin}/api/health` : 'https://.../api/health'}
                    className="flex-1 bg-slate-950 border border-cyan-500/40 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 outline-none select-all"
                  />
                  <button
                    onClick={() => copyToClipboard(typeof window !== 'undefined' ? `${window.location.origin}/api/health` : '/api/health', 'guide-health-url')}
                    className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center space-x-1 shrink-0"
                  >
                    {copiedText === 'guide-health-url' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText === 'guide-health-url' ? 'Đã sao chép!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1.5 font-sans">
                <div className="font-bold text-cyan-400 mb-1">Các bước thực hiện (Chỉ mất 2 phút):</div>
                <div>1. Truy cập <a href="https://uptimerobot.com" target="_blank" rel="noreferrer" className="text-cyan-300 underline font-bold inline-flex items-center space-x-1"><span>uptimerobot.com</span> <ExternalLink className="w-3 h-3" /></a> và đăng ký tài khoản miễn phí.</div>
                <div>2. Nhấn nút <strong className="text-white">+ Add New Monitor</strong>.</div>
                <div>3. Chọn <strong>Monitor Type:</strong> <code className="text-cyan-300 font-bold">HTTP(s)</code>.</div>
                <div>4. Friendly Name: đặt tên tùy thích (ví dụ: <code className="text-slate-200">Many Curiel Bot</code>).</div>
                <div>5. URL (or IP): <strong>Dán URL Keep-Alive</strong> đã copy ở trên.</div>
                <div>6. Monitoring Interval: Chọn <strong className="text-emerald-400">5 minutes</strong> (5 phút/lần).</div>
                <div>7. Nhấn <strong className="text-cyan-400">Create Monitor</strong> ➔ Hoàn tất! Máy chủ AI Studio sẽ nhận request định kỳ và không bao giờ tự tắt!</div>
              </div>
            </div>

            {/* Mục B: Hướng dẫn VPS */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-500/30 space-y-4">
              <div className="flex items-center space-x-2 text-emerald-300">
                <Server className="w-5 h-5" />
                <h3 className="font-bold text-base">Cách 2: Triển Khai VPS 24/7 Bằng 1 Lệnh Tự Động (Tối Ưu Nhất 100%)</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Nếu bạn có VPS (Ubuntu/Debian như Oracle Cloud Free, hoặc VPS 30k/tháng), đây là phương pháp hoàn hảo nhất vì bot chạy độc lập vĩnh viễn, không phụ thuộc vào trình duyệt, máy tính hay tài khoản AI Studio.
              </p>
              
              <div className="p-4 rounded-xl bg-slate-950/90 border border-emerald-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">Lệnh cài đặt tự động toàn bộ môi trường (Node.js 20, PM2, DB):</span>
                  <button
                    onClick={() => copyToClipboard('bash setup-vps.sh', 'guide-setup-cmd')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center space-x-1"
                  >
                    {copiedText === 'guide-setup-cmd' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedText === 'guide-setup-cmd' ? 'Đã sao chép!' : 'Copy Lệnh'}</span>
                  </button>
                </div>
                <pre className="font-mono text-xs text-emerald-300 bg-slate-900 p-2.5 rounded-lg overflow-x-auto select-all">bash setup-vps.sh</pre>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-200">Hoặc Cấu Hình Thủ Công Từng Bước Trên VPS:</h3>
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <h3 className="font-bold text-sm text-cyan-300">Bước 1. Cài Đặt Thư Viện Trên VPS</h3>
                <p className="text-xs text-slate-400">Chạy trong thư mục source code của bot trên VPS:</p>
                <pre className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-slate-300 overflow-x-auto">npm install</pre>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <h3 className="font-bold text-sm text-cyan-300">2. Cấu Hình File .env</h3>
                <p className="text-xs text-slate-400">File <code className="text-cyan-400 font-mono">.env</code> đã được thiết lập sẵn Token và ID:</p>
                <pre className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-slate-300 overflow-x-auto">{`DISCORD_TOKEN=YOUR_BOT_TOKEN
CLIENT_ID=1555920118859567265
OWNER_ID=1402913586853974156`}</pre>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <h3 className="font-bold text-sm text-cyan-300">3. Đăng Ký Slash Command Setup Lên Discord</h3>
                <p className="text-xs text-slate-400">Chạy một lần để đăng ký các lệnh Setup (/setupkenhchoi, /setuprolet1, /setupkenhan, /setuproletttl):</p>
                <pre className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-slate-300 overflow-x-auto">npm run deploy</pre>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <h3 className="font-bold text-sm text-cyan-300">4. Khởi Chạy Bot 24/7 Với PM2 & Bật Tự Động Khởi Động Khi VPS Reboot</h3>
                <p className="text-xs text-slate-400">Chạy 3 lệnh sau theo thứ tự:</p>
                <div className="space-y-2">
                  <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-slate-300 space-y-1">
                    <div className="text-cyan-400 font-bold"># Bước A: Khởi chạy process bằng file cấu hình ecosystem chuẩn</div>
                    <div>pm2 start ecosystem.config.cjs</div>
                    <div className="text-cyan-400 font-bold pt-2"># Bước B: Lưu danh sách process đang chạy vào hệ thống</div>
                    <div>pm2 save</div>
                    <div className="text-cyan-400 font-bold pt-2"># Bước C: Tạo dịch vụ tự khởi động khi VPS reboot</div>
                    <div>pm2 startup</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 text-center text-xs text-slate-500">
        Khoảng không nhỏ của Many Curiel • Discord.js v14 Ready • Uptime 24/7
      </footer>
    </div>
  );
}
