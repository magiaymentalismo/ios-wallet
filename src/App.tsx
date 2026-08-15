import React, { useState, useEffect, useRef } from "react";
import {
  Plus, Search, MoreHorizontal, X, CreditCard, ChevronRight,
  Wifi, ShoppingBag, Building2, Coffee, UtensilsCrossed,
  RefreshCw, Trash2, ChevronLeft, Zap, Music, Car, Heart,
  Plane, Dumbbell, BookOpen, Gamepad2, Monitor, Utensils
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeCanvas } from "qrcode.react";
import {
  DEFAULT_MERCHANTS, getMockTxData, buildAcrosticData, formatDateTime, gradientClassToCss, computeGooPatch,
  type MerchantEntry,
} from "./lib/wallet-utils";

interface Transaction {
  id: string; merchant: string; location: string;
  date: string; amount: string; currency: string; icon: React.ReactNode; iconKey?: string;
}
interface Card {
  id: string; bank: string; type: "Debit" | "Credit";
  last4: string; gradient: string; logo: "visa" | "mastercard" | "amex"; transactions: Transaction[];
}
interface MagicCard {
  id: string; bank: string; last4: string; color: string;
  brand: "visa" | "mastercard" | "amex"; cardType: "Debit" | "Credit";
}
interface MagicState {
  cardholderName: string; apiResult: string; apiLastFetched: string; apiUserId: string;
  iberiaNumber: string; iberiaTier: string; iberiaMemberSince: string; iberiaValidThru: string;
  listening: boolean; currency: string; merchantMap: Record<string, MerchantEntry>; cards: MagicCard[];
  loyaltyName: string; loyaltySubtitle: string; loyaltyColor: string; loyaltyFieldLabel: string;
  secretQuery: string;
}

const GRADIENTS = [
  { name: "BBVA Teal",     value: "from-[#3AACC0] via-[#2E9DB0] to-[#1F7A8C]" },
  { name: "Revolut",       value: "from-[#6D3FC4] via-[#4B4CD1] to-[#2E5FE8]" },
  { name: "Midnight",      value: "from-gray-900 via-gray-800 to-black" },
  { name: "Gold",          value: "from-[#bf953f] via-[#fcf6ba] to-[#b38728]" },
  { name: "Silver",        value: "from-[#757F9A] via-[#D7DDE8] to-[#757F9A]" },
  { name: "Black Metal",   value: "from-[#000000] via-[#434343] to-[#000000]" },
  { name: "Emerald",       value: "from-emerald-500 via-teal-600 to-emerald-700" },
  { name: "Sunset",        value: "from-orange-500 via-red-500 to-purple-600" },
  { name: "Apple Card",    value: "from-white via-gray-100 to-gray-200" },
  { name: "Ocean",         value: "from-[#2980b9] via-[#6dd5fa] to-[#2980b9]" },
  { name: "Aurora",        value: "from-[#00b09b] via-[#96c93d] to-[#00b09b]" },
  { name: "Rose Gold",     value: "from-[#b76e79] via-[#f7cac9] to-[#b76e79]" },
  { name: "Sapphire",      value: "from-[#1a1a2e] via-[#16213e] to-[#0f3460]" },
  { name: "Cherry",        value: "from-[#eb3349] via-[#f45c43] to-[#eb3349]" },
  { name: "Mint",          value: "from-[#56ab2f] via-[#a8e063] to-[#56ab2f]" },
  { name: "Deep Purple",   value: "from-[#4a00e0] via-[#8e2de2] to-[#4a00e0]" },
  { name: "Tangerine",     value: "from-[#f7971e] via-[#ffd200] to-[#f7971e]" },
  { name: "Steel",         value: "from-[#485563] via-[#29323c] to-[#485563]" },
  { name: "Lavender",      value: "from-[#834d9b] via-[#d04ed6] to-[#834d9b]" },
  { name: "Crimson Night", value: "from-[#1a0000] via-[#6b0f1a] to-[#1a0000]" },
];
const CURRENCIES = ["£","$","€","¥","₹","₩","A$","C$","CHF","AED"];
const LOYALTY_PRESETS = [
  { name: "Iberia",          color: "#D7192D", brand: "IBERIA",          subtitle: "PLUS",          label: "IBERIA PLUS NUMBER" },
  { name: "British Airways", color: "#075AAA", brand: "BRITISH AIRWAYS", subtitle: "EXECUTIVE CLUB",label: "MEMBERSHIP NUMBER" },
  { name: "Marriott",        color: "#8B1A1A", brand: "MARRIOTT",        subtitle: "BONVOY",         label: "MEMBER NUMBER" },
  { name: "Emirates",        color: "#CC0000", brand: "EMIRATES",        subtitle: "SKYWARDS",       label: "SKYWARDS NUMBER" },
  { name: "Starbucks",       color: "#00704A", brand: "STARBUCKS",       subtitle: "REWARDS",        label: "REWARDS NUMBER" },
  { name: "Amazon",          color: "#232F3E", brand: "AMAZON",          subtitle: "PRIME",          label: "MEMBER ID" },
  { name: "Lufthansa",       color: "#05164D", brand: "LUFTHANSA",       subtitle: "MILES & MORE",   label: "CARD NUMBER" },
  { name: "Air France",      color: "#002157", brand: "AIR FRANCE",      subtitle: "FLYING BLUE",    label: "MEMBER NUMBER" },
  { name: "Custom",          color: "#1C1C1E", brand: "",               subtitle: "",               label: "MEMBER NUMBER" },
];
const LOYALTY_COLORS = [
  "#D7192D","#075AAA","#8B1A1A","#CC0000","#00704A","#232F3E",
  "#05164D","#002157","#1C1C1E","#2D5016","#7B2D8B","#B45309",
  "#0F766E","#1D4ED8","#9F1239","#374151",
];
const ICON_TYPES = [
  { key: "shopping",      label: "Shop",    render: (cls: string) => <ShoppingBag className={cls} /> },
  { key: "food",          label: "Food",    render: (cls: string) => <UtensilsCrossed className={cls} /> },
  { key: "coffee",        label: "Coffee",  render: (cls: string) => <Coffee className={cls} /> },
  { key: "building",      label: "Service", render: (cls: string) => <Building2 className={cls} /> },
  { key: "entertainment", label: "Screen",  render: (cls: string) => <Monitor className={cls} /> },
  { key: "travel",        label: "Travel",  render: (cls: string) => <Plane className={cls} /> },
  { key: "fitness",       label: "Sport",   render: (cls: string) => <Dumbbell className={cls} /> },
  { key: "music",         label: "Music",   render: (cls: string) => <Music className={cls} /> },
  { key: "car",           label: "Ride",    render: (cls: string) => <Car className={cls} /> },
  { key: "health",        label: "Health",  render: (cls: string) => <Heart className={cls} /> },
  { key: "book",          label: "Books",   render: (cls: string) => <BookOpen className={cls} /> },
  { key: "game",          label: "Game",    render: (cls: string) => <Gamepad2 className={cls} /> },
  { key: "tech",          label: "Tech",    render: (cls: string) => <Zap className={cls} /> },
  { key: "restaurant",    label: "Dine",    render: (cls: string) => <Utensils className={cls} /> },
];
const ICON_BG: Record<string,string> = {
  shopping:"rgba(249,115,22,0.12)",food:"rgba(239,68,68,0.12)",coffee:"rgba(180,83,9,0.12)",
  building:"rgba(59,130,246,0.12)",entertainment:"rgba(168,85,247,0.12)",travel:"rgba(14,165,233,0.12)",
  fitness:"rgba(34,197,94,0.12)",music:"rgba(236,72,153,0.12)",car:"rgba(107,114,128,0.12)",
  health:"rgba(251,113,133,0.12)",book:"rgba(99,102,241,0.12)",game:"rgba(139,92,246,0.12)",
  tech:"rgba(234,179,8,0.12)",restaurant:"rgba(234,88,12,0.12)",
};
const ICON_COLORS: Record<string,string> = {
  shopping:"text-orange-500",food:"text-red-500",coffee:"text-amber-700",
  building:"text-blue-500",entertainment:"text-purple-500",travel:"text-sky-500",
  fitness:"text-green-500",music:"text-pink-500",car:"text-gray-600",
  health:"text-red-400",book:"text-indigo-500",game:"text-violet-500",
  tech:"text-yellow-500",restaurant:"text-orange-600",
};
// Background transactions + acrostic spelling data live in lib/wallet-utils
// (pure, unit-tested); icons are attached here since they need JSX.
function getMockTxs(currency: string): Transaction[] {
  return getMockTxData(currency).map(t => ({
    id: t.id, merchant: t.merchant, location: t.location, date: t.date,
    amount: t.amount, currency: "", icon: renderIcon(t.icon), iconKey: t.icon,
  }));
}
function renderIcon(key: string, size = "w-5 h-5") {
  const t = ICON_TYPES.find(i => i.key === key);
  const col = ICON_COLORS[key] ?? "text-gray-400";
  return t ? t.render(`${size} ${col}`) : <ShoppingBag className={`${size} text-gray-400`}/>;
}

// ─── Reusable iOS 26 glass button ─────────────────────────────────────────────
const GlassBtn: React.FC<{
  children: React.ReactNode; onClick?: () => void;
  className?: string; style?: React.CSSProperties;
}> = ({ children, onClick, className = "", style }) => (
  <button onClick={onClick}
    className={`flex items-center justify-center rounded-full ${className}`}
    style={{
      background:"rgba(255,255,255,0.72)",
      backdropFilter:"blur(28px) saturate(180%)",
      WebkitBackdropFilter:"blur(28px) saturate(180%)",
      border:"1px solid rgba(255,255,255,0.35)",
      boxShadow:"0 1px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
      transition:"transform 0.12s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.12s",
      cursor:"pointer",
      WebkitTapHighlightColor:"transparent",
      ...style,
    }}
    onTouchStart={e=>{(e.currentTarget as HTMLElement).style.transform="scale(0.93)";(e.currentTarget as HTMLElement).style.opacity="0.85";}}
    onTouchEnd={e=>{(e.currentTarget as HTMLElement).style.transform="";(e.currentTarget as HTMLElement).style.opacity="";}}
    onMouseDown={e=>{(e.currentTarget as HTMLElement).style.transform="scale(0.93)";}}
    onMouseUp={e=>{(e.currentTarget as HTMLElement).style.transform="";}}
  >
    {children}
  </button>
);

// ─── Card logos ────────────────────────────────────────────────────────────────
// Plain wordmark, no colored accents — real embossed card logos are monochrome.
const VisaLogo = ({isWhite}:{isWhite?:boolean}) => (
  <span className={`text-[26px] font-black italic tracking-tight leading-none ${isWhite?"text-[#1A1F71]":"text-white"}`}>
    VISA
  </span>
);
const MastercardLogo = () => (
  <div className="flex -space-x-3">
    <div className="w-8 h-8 rounded-full bg-[#eb001b] opacity-90"/>
    <div className="w-8 h-8 rounded-full bg-[#f79e1b] opacity-90"/>
  </div>
);
const AmexLogo = () => (
  <div className="w-12 h-8 bg-[#016fd0] rounded flex items-center justify-center p-1">
    <span className="text-[8px] font-black text-white leading-none tracking-tighter text-center">AMERICAN<br/>EXPRESS</span>
  </div>
);

// BBVA's real wordmark ends in a crossbar-less "A" (like a caret); Λ (Greek
// capital lambda) approximates that shape closely enough without an SVG asset.
const BANK_NAME_OVERRIDES: Record<string,string> = { BBVA: "BBVΛ" };
function renderBankName(bank: string) {
  return BANK_NAME_OVERRIDES[bank.toUpperCase()] ?? bank;
}

// ─── Card ─────────────────────────────────────────────────────────────────────
const CardView: React.FC<{card:Card;isStacked?:boolean;onClick?:()=>void;index?:number;holderName?:string}> = ({card,isStacked,onClick,index,holderName="ARIEL HAMUI"}) => {
  const isWhite = card.gradient.includes("from-white")||card.gradient.includes("from-gray-100");
  return (
    <motion.div layoutId={`card-${card.id}`} onClick={onClick}
      className={`relative w-full rounded-[18px] p-5 overflow-hidden ${isWhite?"text-gray-900 border border-gray-200":"text-white"}`}
      style={{
        aspectRatio:"1.58/1", zIndex:index,
        // Rendered as an inline gradient, not a Tailwind class, because
        // card.gradient is arbitrary persisted data — see gradientClassToCss.
        backgroundImage: gradientClassToCss(card.gradient),
        // Real Wallet shows ~26% of each stacked card peeking out above the
        // next one; percentage margin-top is relative to width in CSS, which
        // conveniently is also what the card's own height is derived from.
        marginTop: isStacked && index !== 0 ? "-47%" : "0",
        boxShadow: isWhite
          ? "0 12px 40px rgba(0,0,0,0.10), 0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)"
          : "0 12px 40px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.15)",
        cursor: onClick ? "pointer" : "default",
      }}
      whileTap={onClick ? { scale: 0.975 } : undefined}
      transition={{ type:"spring", stiffness:400, damping:30 }}
    >
      {/* Glass sheen: a distinct diagonal light band, like a reflection */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background:"linear-gradient(115deg, transparent 28%, rgba(255,255,255,0.32) 42%, rgba(255,255,255,0.32) 56%, transparent 70%)",
        borderRadius:"inherit",
      }}/>
      {/* TOP ROW: bank name + card type */}
      <div className="relative z-10 flex justify-between items-start">
        <span className="text-[24px] font-bold tracking-tight leading-none">{renderBankName(card.bank)}</span>
        <span className="text-[13px] font-semibold mt-1">{card.type==="Credit"?"Crédito":"Débito"}</span>
      </div>

      {/* BOTTOM ROW: NFC + number/label left, logo right */}
      <div className="absolute bottom-5 left-6 right-6 z-10 flex justify-between items-end">
        <div className="flex flex-col gap-2">
          <Wifi className={`w-6 h-6 rotate-90 opacity-70 ${isWhite?"text-gray-500":"text-white"}`}/>
          <div className="flex flex-col gap-[2px]">
            <span className={`text-[9px] font-semibold uppercase tracking-wider ${isWhite?"text-gray-400":"text-white/50"}`}>
              VÁLIDA HASTA
            </span>
            <span className={`flex items-baseline gap-1.5 tracking-[0.15em] ${isWhite?"text-gray-700":"text-white"}`}>
              <span className="text-[13px] font-medium opacity-80">••••</span>
              <span className="text-[19px] font-bold">{card.last4}</span>
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 self-end">
          {card.logo==="visa"&&<VisaLogo isWhite={isWhite}/>}
          {card.logo==="mastercard"&&<MastercardLogo/>}
          {card.logo==="amex"&&<AmexLogo/>}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Loyalty Pass ─────────────────────────────────────────────────────────────
const IberiaPass = ({magicState,onGridTap}:{magicState:MagicState;onGridTap:(n:string)=>void}) => {
  const loyaltyColor = magicState.loyaltyColor || "#D7192D";
  const loyaltyName = magicState.loyaltyName || "IBERIA";
  const loyaltySubtitle = magicState.loyaltySubtitle || "PLUS";
  const loyaltyFieldLabel = magicState.loyaltyFieldLabel || "IBERIA PLUS NUMBER";
  return (
    <div className="rounded-[18px] p-6 text-white relative overflow-hidden"
      style={{backgroundColor:loyaltyColor, boxShadow:`0 12px 40px ${loyaltyColor}55, 0 4px 16px rgba(0,0,0,0.15)`}}>
      <div className="absolute inset-0 z-50 grid grid-cols-3 grid-rows-4">
        {[1,2,3,4,5,6,7,8,9,null,0,null].map((n,i) => (
          <button key={i} onClick={e=>{e.stopPropagation();if(n!==null)onGridTap(n.toString());}}
            className="w-full h-full active:bg-white/10">
            {n!==null&&<div className="w-1 h-1 bg-white/5 rounded-full mx-auto"/>}
          </button>
        ))}
      </div>
      <div className="absolute inset-0 pointer-events-none rounded-[28px]"
        style={{background:"linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 55%)", borderRadius:"18px"}}/>      <div className="relative z-10">
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-xl italic tracking-tighter">{loyaltyName}</span>
            {loyaltySubtitle&&(
              <>
                <div className="w-6 h-3 bg-white/20 skew-x-[-20deg]"><div className="w-full h-[2px] bg-yellow-400"/></div>
                <span className="font-medium text-white/90 ml-1">{loyaltySubtitle}</span>
              </>
            )}
          </div>
          <div className="text-right">
            <span className="text-[8px] font-bold opacity-60 block">LEVEL</span>
            <span className="text-xl font-bold tracking-tight">{magicState.iberiaTier}</span>
          </div>
        </div>
        <div className="mb-8">
          <span className="text-[8px] font-bold opacity-60 block uppercase tracking-wider mb-1">{loyaltyFieldLabel}</span>
          <span className="text-3xl font-medium tracking-tight text-gray-100">{magicState.iberiaNumber}</span>
        </div>
        <div className="flex justify-between items-end">
          <div className="space-y-4">
            <span className="text-lg font-bold uppercase tracking-wide block text-white">{magicState.cardholderName.toUpperCase()}</span>
            <div className="flex gap-8">
              <div><span className="text-[8px] font-bold opacity-60 block uppercase tracking-wider">MEMBER SINCE</span><span className="text-lg font-medium text-gray-200">{magicState.iberiaMemberSince}</span></div>
              <div><span className="text-[8px] font-bold opacity-60 block uppercase tracking-wider">VALID THRU</span><span className="text-lg font-medium text-gray-200">{magicState.iberiaValidThru}</span></div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
              <span className="text-[7px] font-bold text-center leading-tight px-1">{loyaltyName.split(" ")[0]}</span>
            </div>
            <div className="w-10 h-2 rounded-full bg-white/30"/>
          </div>
        </div>
        <div className="mt-10 flex justify-center">
          <div className="bg-white p-4 rounded-2xl shadow-inner">
            <QRCodeCanvas value={`${loyaltyName}:${magicState.iberiaNumber}:${magicState.cardholderName}`} size={160} level="H" includeMargin={false}/>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Transaction row ──────────────────────────────────────────────────────────
const TxItem: React.FC<{tx:Transaction}> = ({tx}) => (
  <div className="flex items-center px-4 py-3 gap-3"
    style={{borderBottom:"1px solid rgba(0,0,0,0.06)"}}
    onTouchStart={e=>{(e.currentTarget as HTMLElement).style.background="rgba(0,0,0,0.03)";}}
    onTouchEnd={e=>{(e.currentTarget as HTMLElement).style.background="";}}
  >
    <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
      style={{background: ICON_BG[tx.iconKey ?? "shopping"] ?? "rgba(0,0,0,0.05)"}}>
      {tx.icon}
    </div>
    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
      <span className="text-[15px] font-[500] leading-tight truncate" style={{color:"rgba(0,0,0,0.85)"}}>{tx.merchant}</span>
      <span className="text-[13px] leading-tight" style={{color:"rgba(0,0,0,0.4)"}}>{tx.location}</span>
      <span className="text-[12px] leading-tight" style={{color:"rgba(0,0,0,0.35)"}}>{tx.date}</span>
    </div>
    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
      <span className="text-[15px] font-[500]" style={{color:"rgba(0,0,0,0.85)"}}>{tx.amount} {tx.currency}</span>
      <ChevronRight className="w-3.5 h-3.5" style={{color:"rgba(0,0,0,0.22)"}}/>
    </div>
  </div>
);

// ─── Settings ─────────────────────────────────────────────────────────────────
type Tab = "account"|"cards"|"loyalty"|"merchants";

function SettingsPage({magicState,onClose,onUpdate,onReset,isSaving}:{
  magicState:MagicState;onClose:()=>void;onUpdate:(p:any)=>void;onReset:()=>void;isSaving:boolean;
}) {
  const [tab,setTab] = useState<Tab>("account");
  const [local,setLocal] = useState({...magicState});
  const [merchants,setMerchants] = useState<Record<string,MerchantEntry>>({...DEFAULT_MERCHANTS,...magicState.merchantMap});
  const [pending,setPending] = useState(false);
  const letterRefs = useRef<Record<string,HTMLDivElement|null>>({});

  useEffect(()=>{setLocal(p=>({...p,...magicState}));},[magicState]);

  const saveAll = () => {
    onUpdate({apiUserId:local.apiUserId,currency:local.currency,cardholderName:local.cardholderName,
      ibNum:local.iberiaNumber,ibTier:local.iberiaTier,ibSince:local.iberiaMemberSince,ibThru:local.iberiaValidThru,
      loyaltyName:local.loyaltyName,loyaltySubtitle:local.loyaltySubtitle,loyaltyColor:local.loyaltyColor,
      loyaltyFieldLabel:local.loyaltyFieldLabel,merchantMap:merchants});
    setPending(false);
  };
  const setField = (patch: Partial<typeof local>) => { setLocal(p=>({...p,...patch})); setPending(true); };
  const scrollToLetter = (letter: string) => { letterRefs.current[letter]?.scrollIntoView({behavior:"smooth",block:"start"}); };

  const cardStyle = {
    background:"rgba(255,255,255,0.82)",
    backdropFilter:"blur(32px) saturate(200%)",
    WebkitBackdropFilter:"blur(32px) saturate(200%)",
    border:"1px solid rgba(255,255,255,0.5)",
    boxShadow:"0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
    borderRadius:"20px",
  };

  const TABS:{key:Tab;label:string}[] = [
    {key:"account",label:"Account"},{key:"cards",label:"Cards"},
    {key:"loyalty",label:"Loyalty"},{key:"merchants",label:"Merchants"},
  ];

  return (
    <motion.div initial={{x:"100%"}} animate={{x:0}} exit={{x:"100%"}}
      transition={{type:"spring",damping:28,stiffness:280}}
      className="absolute inset-0 z-[200] flex flex-col"
      style={{backgroundColor:"#f2f2f7"}}>
      {/* Glass header */}
      <div style={{
        background:"rgba(255,255,255,0.82)",
        backdropFilter:"blur(32px) saturate(200%)",
        WebkitBackdropFilter:"blur(32px) saturate(200%)",
        borderBottom:"1px solid rgba(0,0,0,0.08)",
        paddingTop:"calc(env(safe-area-inset-top, 44px) + 8px)",
        paddingLeft:16, paddingRight:16, paddingBottom:0,
      }}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose}
            className="flex items-center gap-0.5 font-semibold text-sm"
            style={{color:"#007AFF",
              transition:"transform 0.12s cubic-bezier(0.25,0.46,0.45,0.94)",
              WebkitTapHighlightColor:"transparent",
            }}
            onTouchStart={e=>{(e.currentTarget as HTMLElement).style.opacity="0.7";}}
            onTouchEnd={e=>{(e.currentTarget as HTMLElement).style.opacity="";}}
          >
            <ChevronLeft className="w-5 h-5"/> Wallet
          </button>
          <h1 className="text-base font-semibold text-gray-900">Settings</h1>
          <button onClick={saveAll}
            className="text-sm font-bold px-3 py-1.5 rounded-xl transition-all"
            style={{
              background: pending ? "#007AFF" : "transparent",
              color: pending ? "white" : "#007AFF",
              boxShadow: pending ? "0 2px 8px rgba(0,122,255,0.3)" : "none",
              WebkitTapHighlightColor:"transparent",
            }}>
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin"/> : "Save"}
          </button>
        </div>
        <div className="flex">
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)}
              className="flex-1 py-2.5 text-xs font-bold border-b-2 -mb-px transition-colors"
              style={{borderColor:tab===t.key?"#007AFF":"transparent",color:tab===t.key?"#007AFF":"#9ca3af",WebkitTapHighlightColor:"transparent"}}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-12" style={{WebkitOverflowScrolling:"touch" as any}}>

        {tab==="account"&&(
          <div className="px-4 pt-5 space-y-5">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">GOO! Account</p>
              <div style={cardStyle} className="px-4 divide-y divide-gray-100/80">
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-500">User ID</span>
                  <input type="text" inputMode="numeric" value={local.apiUserId}
                    onChange={e=>setField({apiUserId:e.target.value})}
                    onBlur={e=>onUpdate({apiUserId:e.target.value})}
                    className="text-sm font-bold text-right bg-transparent outline-none w-28 focus:bg-gray-100 rounded-lg px-2 py-1"/>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-500">Escuchar API</span>
                  <input type="checkbox" className="ios-toggle"
                    checked={magicState.listening}
                    onChange={()=>onUpdate({listening:!magicState.listening})}/>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-500">Último ingreso API</span>
                  <span className="text-sm font-bold font-mono" style={{color:"#007AFF"}}>{magicState.apiLastFetched ? formatDateTime(magicState.apiLastFetched) : magicState.listening ? "Nunca" : "Desactivado"}</span>
                </div>
                {magicState.apiResult&&(
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-gray-500">Última consulta</span>
                    <span className="text-sm font-bold font-mono" style={{color:"#007AFF"}}>"{magicState.apiResult}"</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Default Currency</p>
              <div style={cardStyle} className="p-4">
                <div className="flex flex-wrap gap-2">
                  {CURRENCIES.map(c=>(
                    <button key={c} onClick={()=>setField({currency:c})}
                      className="px-3 py-1.5 rounded-xl text-sm font-bold transition-all"
                      style={{
                        background:local.currency===c?"#007AFF":"rgba(0,0,0,0.05)",
                        color:local.currency===c?"white":"#4b5563",
                        WebkitTapHighlightColor:"transparent",
                      }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={onReset}
              className="w-full py-3.5 rounded-2xl font-semibold text-red-500 text-sm"
              style={{background:"rgba(255,255,255,0.82)",border:"1px solid rgba(239,68,68,0.15)",boxShadow:"0 2px 8px rgba(0,0,0,0.04)",WebkitTapHighlightColor:"transparent"}}>
              Reset for New Spectator
            </button>
          </div>
        )}

        {tab==="cards"&&(
          <div className="px-4 pt-5 space-y-4">
            {magicState.cards.map((card,idx)=>(
              <div key={card.id} style={cardStyle} className="overflow-hidden">
                <div className="h-14 flex items-center px-4 justify-between" style={{backgroundImage: gradientClassToCss(card.color)}}>
                  <span className={`font-bold text-lg ${card.color.includes("from-white")?"text-gray-900":"text-white"}`}>{card.bank}</span>
                  <span className={`text-xs font-bold opacity-70 ${card.color.includes("from-white")?"text-gray-700":"text-white"}`}>···· {card.last4}</span>
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Card {idx+1}{idx===0?" · Acrostic":" · Birthday"}</span>
                    {magicState.cards.length>1&&(
                      <button onClick={()=>onUpdate({action:"remove",cardId:card.id})} style={{WebkitTapHighlightColor:"transparent"}}><Trash2 className="w-3.5 h-3.5 text-red-400"/></button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Bank</p>
                      <input type="text" defaultValue={card.bank}
                        onBlur={e=>onUpdate({action:"update",cardId:card.id,bank:e.target.value})}
                        className="text-sm font-bold text-gray-900 bg-transparent outline-none w-full"/>
                    </div>
                    <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Last 4</p>
                      <input type="text" maxLength={4} defaultValue={card.last4}
                        onBlur={e=>onUpdate({action:"update",cardId:card.id,last4:e.target.value})}
                        className="text-sm font-bold text-gray-900 bg-transparent outline-none w-full font-mono"/>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1.5">Card Type</p>
                    <div className="flex gap-2">
                      {(["Debit","Credit"] as const).map(t=>(
                        <button key={t} onClick={()=>onUpdate({action:"update",cardId:card.id,cardType:t})}
                          className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                          style={{background:card.cardType===t?"#111827":"#f3f4f6",color:card.cardType===t?"white":"#6b7280",WebkitTapHighlightColor:"transparent"}}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1.5">Network</p>
                    <div className="flex gap-2">
                      {["visa","mastercard","amex"].map(b=>(
                        <button key={b} onClick={()=>onUpdate({action:"update",cardId:card.id,brand:b})}
                          className="flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all"
                          style={{background:card.brand===b?"#111827":"#f3f4f6",color:card.brand===b?"white":"#6b7280",WebkitTapHighlightColor:"transparent"}}>{b}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1.5">Color</p>
                    <div className="flex flex-wrap gap-2">
                      {GRADIENTS.map(g=>(
                        <button key={g.value} title={g.name} onClick={()=>onUpdate({action:"update",cardId:card.id,color:g.value})}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${card.color===g.value?"border-[#007AFF] scale-110 shadow-md":"border-white shadow-sm"}`}
                          style={{backgroundImage: gradientClassToCss(g.value), WebkitTapHighlightColor:"transparent"}}/>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={()=>onUpdate({action:"add"})}
              className="w-full py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2"
              style={{color:"#007AFF",background:"rgba(255,255,255,0.82)",border:"1px solid rgba(0,122,255,0.15)",boxShadow:"0 2px 8px rgba(0,0,0,0.04)",WebkitTapHighlightColor:"transparent"}}>
              <Plus className="w-4 h-4"/> Add Card
            </button>
          </div>
        )}

        {tab==="loyalty"&&(
          <div className="px-4 pt-5 space-y-4">
            <div className="rounded-2xl overflow-hidden shadow-md">
              <div className="p-5 text-white" style={{backgroundColor:local.loyaltyColor||"#D7192D"}}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-black text-lg italic tracking-tighter">{local.loyaltyName||"BRAND"}</span>
                  {local.loyaltySubtitle&&<span className="text-sm text-white/80">{local.loyaltySubtitle}</span>}
                </div>
                <div className="text-[10px] opacity-60 uppercase font-bold tracking-wider">{local.loyaltyFieldLabel||"MEMBER NUMBER"}</div>
                <div className="text-2xl font-medium tracking-tight mt-0.5">{local.iberiaNumber}</div>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Quick Presets</p>
              <div className="flex gap-2 overflow-x-auto pb-1" style={{scrollbarWidth:"none",WebkitOverflowScrolling:"touch" as any}}>
                {LOYALTY_PRESETS.map(p=>(
                  <button key={p.name}
                    onClick={()=>{if(p.brand){setField({loyaltyName:p.brand,loyaltySubtitle:p.subtitle,loyaltyColor:p.color,loyaltyFieldLabel:p.label});}}}
                    className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all"
                    style={{
                      background:local.loyaltyColor===p.color&&local.loyaltyName===p.brand?p.color:"white",
                      color:local.loyaltyColor===p.color&&local.loyaltyName===p.brand?"white":"#374151",
                      borderColor:p.color,WebkitTapHighlightColor:"transparent",
                    }}>{p.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Card Brand</p>
              <div style={cardStyle} className="px-4 divide-y divide-gray-100/80">
                {[
                  {label:"Brand Name",key:"loyaltyName" as const,ph:"e.g. IBERIA"},
                  {label:"Subtitle",key:"loyaltySubtitle" as const,ph:"e.g. PLUS"},
                  {label:"Field Label",key:"loyaltyFieldLabel" as const,ph:"e.g. MEMBER NUMBER"},
                ].map(({label,key,ph})=>(
                  <div key={key} className="flex items-center justify-between py-3">
                    <span className="text-sm text-gray-500">{label}</span>
                    <input type="text" value={(local[key]||"")} onChange={e=>setField({[key]:e.target.value})}
                      placeholder={ph}
                      className="text-sm font-bold text-right bg-transparent outline-none w-40 focus:bg-gray-100 rounded-lg px-2 py-1"/>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Card Color</p>
              <div style={cardStyle} className="p-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  {LOYALTY_COLORS.map(c=>(
                    <button key={c} onClick={()=>setField({loyaltyColor:c})}
                      className={`w-9 h-9 rounded-full border-2 transition-all ${local.loyaltyColor===c?"border-[#007AFF] scale-110 shadow-md":"border-white shadow-sm"}`}
                      style={{backgroundColor:c,WebkitTapHighlightColor:"transparent"}}/>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-400 font-bold">Custom</span>
                  <input type="color" value={local.loyaltyColor||"#D7192D"}
                    onChange={e=>setField({loyaltyColor:e.target.value})}
                    className="w-10 h-8 rounded-lg border border-gray-200 cursor-pointer"/>
                  <span className="text-xs font-mono text-gray-500">{local.loyaltyColor}</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Member Data</p>
              <div style={cardStyle} className="px-4 divide-y divide-gray-100/80">
                {([
                  {label:"Cardholder Name",key:"cardholderName"},
                  {label:"Member Number",key:"iberiaNumber"},
                  {label:"Tier",key:"iberiaTier"},
                  {label:"Member Since",key:"iberiaMemberSince"},
                  {label:"Valid Thru",key:"iberiaValidThru"},
                ] as const).map(({label,key})=>(
                  <div key={key} className="flex items-center justify-between py-3">
                    <span className="text-sm text-gray-500">{label}</span>
                    <input type="text" value={local[key]}
                      onChange={e=>setField({[key]:e.target.value} as any)}
                      className="text-sm font-bold text-right bg-transparent outline-none w-40 focus:bg-gray-100 rounded-lg px-2 py-1"/>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab==="merchants"&&(
          <div className="relative flex">
            <div className="flex-1 px-4 pt-5 space-y-2 pr-10">
              <p className="text-xs text-gray-400 px-1 mb-3">Each letter maps to a merchant in the acrostic.</p>
              {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(letter=>{
                const entry = merchants[letter]??DEFAULT_MERCHANTS[letter];
                return (
                  <div key={letter} ref={el=>{letterRefs.current[letter]=el;}}
                    style={cardStyle} className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-black text-gray-600">{letter}</span>
                      </div>
                      <input type="text" value={entry.name}
                        onChange={e=>{setMerchants(p=>({...p,[letter]:{...entry,name:e.target.value}}));setPending(true);}}
                        onBlur={e=>{const u={...merchants,[letter]:{...entry,name:e.target.value}};setMerchants(u);onUpdate({merchantMap:u});}}
                        className="flex-1 text-sm font-semibold text-gray-900 bg-transparent outline-none focus:bg-gray-50 rounded-lg px-2 py-1"/>
                      <div className="flex-shrink-0">{renderIcon(entry.icon,"w-5 h-5")}</div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2 ml-11">
                      {ICON_TYPES.map(it=>(
                        <button key={it.key}
                          onClick={()=>{const u={...merchants,[letter]:{...entry,icon:it.key}};setMerchants(u);onUpdate({merchantMap:u});}}
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold transition-all"
                          style={{background:entry.icon===it.key?"#111827":"#f3f4f6",color:entry.icon===it.key?"white":"#6b7280",WebkitTapHighlightColor:"transparent"}}>
                          {it.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="fixed right-0 top-1/2 -translate-y-1/2 flex flex-col items-center py-2 z-50">
              {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(l=>(
                <button key={l} onClick={()=>scrollToLetter(l)}
                  className="w-6 text-center text-[10px] font-bold leading-5"
                  style={{color:"#007AFF",WebkitTapHighlightColor:"transparent"}}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const sessionId = (()=>{
    const u = new URLSearchParams(window.location.search).get("s");
    if(u){localStorage.setItem("goo_session_id",u);return u;}
    return localStorage.getItem("goo_session_id")||"default";
  })();

  const defaults: MagicState = {
    cardholderName:"ARIEL hamui",apiResult:"",apiUserId:"131",
    iberiaNumber:"IB 125900928",iberiaTier:"PLATA",iberiaMemberSince:"04/24",iberiaValidThru:"04/26",
    listening:false,currency:"£",merchantMap:{},apiLastFetched:"",secretQuery:"",
    loyaltyName:"IBERIA",loyaltySubtitle:"PLUS",loyaltyColor:"#D7192D",loyaltyFieldLabel:"IBERIA PLUS NUMBER",
    cards:[
      {id:"bbva-1",bank:"BBVA",last4:"1239",color:"from-[#3AACC0] via-[#2E9DB0] to-[#1F7A8C]",brand:"visa",cardType:"Debit"},
      {id:"revolut-1",bank:"Revolut",last4:"0000",color:"from-[#6D3FC4] via-[#4B4CD1] to-[#2E5FE8]",brand:"mastercard",cardType:"Debit"},
    ],
  };

  const [state,setState] = useState<MagicState>(defaults);
  const [saving,setSaving] = useState(false);
  const [ready,setReady] = useState(false);
  const [showSettings,setShowSettings] = useState(false);
  const [selectedCard,setSelectedCard] = useState<string|null>(null);
  const [digits,setDigits] = useState("");
  const digitTimer = useRef<NodeJS.Timeout|null>(null);
  const walletTaps = useRef(0);
  const walletTimer = useRef<NodeJS.Timeout|null>(null);
  const dotsTaps = useRef(0);
  const dotsTimer = useRef<NodeJS.Timeout|null>(null);
  const wakeLock = useRef<any>(null);
  const haptic = (ms=10)=>{try{navigator.vibrate?.(ms);}catch{}};

  const setupKey = `goo_setup_${sessionId}`;
  const [showOnboard,setShowOnboard] = useState(()=>!localStorage.getItem(setupKey));
  const [obId,setObId] = useState(""); const [obName,setObName] = useState("");

  useEffect(()=>{
    fetch(`/api/magic${sessionId?`?s=${sessionId}`:""}`)
      .then(r=>{ if(!r.ok) throw new Error("load failed"); return r.json(); })
      .then(d=>{ if(d) setState(p=>({...defaults,...d,merchantMap:{...p.merchantMap,...d.merchantMap}})); setReady(true); })
      .catch(()=>setReady(true));
  },[]);

  useEffect(()=>{
    const fn = async()=>{
      if(document.visibilityState==="hidden"){navigator.sendBeacon(`/api/magic/reset${sessionId?`?s=${sessionId}`:""}`);}
      else{try{if("wakeLock"in navigator)wakeLock.current=await(navigator as any).wakeLock.request("screen");}catch{}}
    };
    document.addEventListener("visibilitychange",fn);
    return()=>document.removeEventListener("visibilitychange",fn);
  },[sessionId]);

  useEffect(()=>{
    (async()=>{try{if("wakeLock"in navigator)wakeLock.current=await(navigator as any).wakeLock.request("screen");}catch{}})();
    return()=>{wakeLock.current?.release().catch(()=>{});};
  },[]);

  useEffect(()=>{
    const poll=async()=>{
      if(showSettings)return;
      try{
        // First get current state from backend
        const r=await fetch(`/api/magic${sessionId?`?s=${sessionId}`:""}`);
        if(!r.ok)return;const ct=r.headers.get("content-type");
        if(!ct?.includes("application/json"))return;
        const d=await r.json();
        setState(p=>({...defaults,...d,merchantMap:{...p.merchantMap,...d.merchantMap}}));

        // If listening, call GOO API via proxy (avoids CORS)
        if(d.listening && d.apiUserId){
          try{
            const goo=await fetch(`/api/proxy?userId=${d.apiUserId}`);
            if(goo.ok){
              const gooData=await goo.json();
              // Query and birthday are checked independently — GOO!'s
              // birthday lookup can arrive a poll cycle later than the
              // query itself, and gating both on "did the query just
              // change" meant a late birthday never got applied once the
              // query stopped looking new.
              const patch=computeGooPatch({apiResult:d.apiResult,secondCardLast4:d.cards[1]?.last4??""},gooData);
              if(patch){
                const body:Record<string,unknown>={...patch};
                if(patch.last4!==undefined){body.action="update";body.cardId=d.cards[1]?.id;}
                await fetch(`/api/magic${sessionId?`?s=${sessionId}`:""}`,{
                  method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),
                });
                if(patch.apiResult!==undefined){
                  setState(p=>({...p,apiResult:patch.apiResult!,apiLastFetched:patch.apiLastFetched!}));
                }
              }
            }
          }catch{}
        }
      }catch{}
    };
    const iv=setInterval(poll,2000);return()=>clearInterval(iv);
  },[showSettings]);

  const onGrid=(n:string)=>{
    setDigits(p=>p+n);
    if(digitTimer.current)clearTimeout(digitTimer.current);
    digitTimer.current=setTimeout(()=>setDigits(""),3000);
  };
  useEffect(()=>{
    if(digits.length===4){
      const f=state.cards[0];
      // secretQuery: exposed read-only via GET /api/query as {"query":...}
      // for a third-party app's own web-polling feature (e.g. PeekSmith)
      // to pull from directly — no API key needed on their side.
      if(f)update({action:"update",cardId:f.id,last4:digits,secretQuery:digits});
      // Relay the tapped digits out to GOO (thump), so they come back later
      // through /pro-api/{userId}/last-bd like a normal search would have.
      if(state.apiUserId){
        fetch(`/api/thump?userId=${state.apiUserId}`,{
          method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:digits}),
        }).catch(()=>{});
      }
      setDigits("");
    }
  },[digits]);

  const onWalletTap=()=>{
    walletTaps.current+=1;
    if(walletTimer.current)clearTimeout(walletTimer.current);
    walletTimer.current=setTimeout(()=>{walletTaps.current=0;},800);
    if(walletTaps.current===3){haptic(15);setShowSettings(true);walletTaps.current=0;}
  };

  const onDots=()=>{
    dotsTaps.current+=1;
    if(dotsTimer.current)clearTimeout(dotsTimer.current);
    dotsTimer.current=setTimeout(()=>{dotsTaps.current=0;},600);
    if(dotsTaps.current===2){
      dotsTaps.current=0;const nl=!state.listening;haptic(nl?15:8);
      setState(p=>({...p,listening:nl}));update({listening:nl});
    }
  };

  const onObComplete=async()=>{
    if(!obId.trim())return;haptic(20);const n=obName.trim()||"ARIEL hamui";
    await fetch(`/api/magic${sessionId?`?s=${sessionId}`:""}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({apiUserId:obId.trim(),cardholderName:n})}).catch(()=>{});
    localStorage.setItem(setupKey,"1");setState(p=>({...p,apiUserId:obId.trim(),cardholderName:n}));setShowOnboard(false);
  };

  const update=async(patch:any)=>{
    setSaving(true);
    setState(prev=>{
      const n={...prev};
      if(patch.name!==undefined)n.cardholderName=patch.name;
      if(patch.apiUserId!==undefined)n.apiUserId=patch.apiUserId;
      if(patch.ibNum!==undefined)n.iberiaNumber=patch.ibNum;
      if(patch.ibTier!==undefined)n.iberiaTier=patch.ibTier;
      if(patch.ibSince!==undefined)n.iberiaMemberSince=patch.ibSince;
      if(patch.ibThru!==undefined)n.iberiaValidThru=patch.ibThru;
      if(patch.listening!==undefined)n.listening=patch.listening;
      if(patch.currency!==undefined)n.currency=patch.currency;
      if(patch.merchantMap!==undefined)n.merchantMap=patch.merchantMap;
      if(patch.action==="add")n.cards=[...n.cards,{id:`card-${Date.now()}`,bank:"New Bank",last4:"0000",color:"from-gray-700 to-gray-900",brand:"visa",cardType:"Debit"}];
      else if(patch.action==="remove"&&patch.cardId)n.cards=n.cards.filter(c=>c.id!==patch.cardId);
      else if(patch.action==="update"&&patch.cardId)n.cards=n.cards.map(c=>c.id!==patch.cardId?c:{...c,...(patch.bank!==undefined&&{bank:patch.bank}),...(patch.last4!==undefined&&{last4:patch.last4}),...(patch.color!==undefined&&{color:patch.color}),...(patch.brand!==undefined&&{brand:patch.brand}),...(patch.cardType!==undefined&&{cardType:patch.cardType})});
      return n;
    });
    try{
      const r=await fetch(`/api/magic${sessionId?`?s=${sessionId}`:""}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(patch)});
      if(r.ok){const d=await r.json();if(d.magicState)setState(p=>({...defaults,...d.magicState,merchantMap:{...p.merchantMap,...d.magicState.merchantMap}}));}
    }catch{}finally{setSaving(false);}
  };

  const reset=async()=>{
    haptic(20);
    try{const r=await fetch(`/api/magic/reset${sessionId?`?s=${sessionId}`:""}`);const d=await r.json();if(d.freshState)setState(p=>({...defaults,...d.freshState,merchantMap:p.merchantMap}));}catch{}
  };

  const merchantMap={...DEFAULT_MERCHANTS,...state.merchantMap};
  const currency=state.currency||"£";
  const mockTxs = getMockTxs(currency);
  const cardObjs:Card[]=state.cards.map(c=>({id:c.id,bank:c.bank,type:c.cardType??"Debit",last4:c.last4,gradient:c.color,logo:c.brand,transactions:mockTxs}));
  const selected=cardObjs.find(c=>c.id===selectedCard)||null;

  // Atmospheric bg tint from top card
  const topCardColor = state.cards[0]?.color ?? "";
  const bgTint = topCardColor.includes("004481")||topCardColor.includes("2980b9") ? "rgba(0,68,129,0.06)"
    : topCardColor.includes("7b4397")||topCardColor.includes("dc2430") ? "rgba(220,36,48,0.05)"
    : topCardColor.includes("bf953f")||topCardColor.includes("fcf6ba") ? "rgba(191,149,63,0.06)"
    : topCardColor.includes("00b09b")||topCardColor.includes("96c93d") ? "rgba(0,176,155,0.06)"
    : topCardColor.includes("eb3349")||topCardColor.includes("f45c43") ? "rgba(235,51,73,0.06)"
    : topCardColor.includes("4a00e0")||topCardColor.includes("8e2de2") ? "rgba(74,0,224,0.06)"
    : topCardColor.includes("56ab2f")||topCardColor.includes("a8e063") ? "rgba(86,171,47,0.06)"
    : "transparent";

  const getTxs=(card:Card):Transaction[]=>{
    const fid=state.cards[0]?.id;
    if(card.id===fid&&state.apiResult){
      const acro:Transaction[]=buildAcrosticData(state.apiResult, merchantMap, currency).map(t=>({
        id:t.id, merchant:t.merchant, location:t.location, date:t.date,
        amount:t.amount, currency:"", icon:renderIcon(t.icon), iconKey:t.icon,
      }));
      return [...acro,...card.transactions];
    }
    return card.transactions;
  };

  if(!ready)return <div className="min-h-screen" style={{backgroundColor:"#f2f2f7"}}/>;

  return (
    <div className="min-h-screen" style={{backgroundColor:"#f2f2f7"}}>
      <div className="max-w-md mx-auto min-h-screen relative overflow-hidden flex flex-col"
        style={{
          backgroundColor:"#f2f2f7",
          backgroundImage:`radial-gradient(ellipse at 50% 20%, ${bgTint} 0%, transparent 70%)`,
          transition:"background-image 1.2s ease",
        }}>

        {/* ── Onboarding ── */}
        <AnimatePresence>
          {showOnboard&&(
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="absolute inset-0 bg-white z-[300] flex flex-col items-center justify-center p-8">
              <motion.div initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}}
                transition={{delay:0.1,type:"spring",stiffness:300,damping:25}}
                className="w-20 h-20 rounded-[22px] bg-black flex items-center justify-center mb-6 shadow-xl overflow-hidden">
                <img src="/apple-touch-icon.png" alt="Wallet" className="w-full h-full object-cover"/>
              </motion.div>
              <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.2}}>
                <h1 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight text-center">GOO! Wallet</h1>
                <p className="text-gray-400 text-sm text-center mb-10">Connect your GOO! account to get started</p>
              </motion.div>
              <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.3}} className="w-full space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your GOO! User ID</label>
                  <input type="text" inputMode="numeric" placeholder="e.g. 131" value={obId}
                    onChange={e=>setObId(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onObComplete()} autoFocus
                    className="w-full bg-gray-100 rounded-xl px-4 py-3 text-gray-900 text-lg font-medium focus:ring-2 focus:ring-[#007AFF] outline-none border-none"/>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Name</label>
                  <input type="text" placeholder="e.g. ARIEL hamui" value={obName}
                    onChange={e=>setObName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onObComplete()}
                    className="w-full bg-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-[#007AFF] outline-none border-none"/>
                </div>
                <button onClick={onObComplete} disabled={!obId.trim()}
                  className="w-full py-4 rounded-2xl font-bold text-white transition-all mt-2"
                  style={{background:obId.trim()?"#007AFF":"#e5e7eb",color:obId.trim()?"white":"#9ca3af",
                    boxShadow:obId.trim()?"0 4px 20px rgba(0,122,255,0.35)":"none",WebkitTapHighlightColor:"transparent"}}>
                  Connect Wallet
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main wallet ── */}
        <motion.div
          className="flex-1 overflow-y-auto"
          style={{
            WebkitOverflowScrolling:"touch" as any,
            scrollbarWidth:"none",
            paddingTop:"calc(env(safe-area-inset-top, 44px) + 12px)",
            paddingLeft:16, paddingRight:16, paddingBottom:32,
          }}
          animate={{opacity:selectedCard?0:1, scale:selectedCard?0.96:1, pointerEvents:selectedCard?"none":"auto"}}
          transition={{duration:0.28, ease:[0.32,0.72,0,1]}}
        >
          {/* Header */}
          <header className="flex justify-between items-center mb-6">
            <h1 onClick={onWalletTap}
              className="text-[34px] font-[700] tracking-tight select-none"
              style={{color:"rgba(0,0,0,0.87)",letterSpacing:"-0.5px"}}>
              Wallet
            </h1>
            <div className="flex items-center gap-2">
              <GlassBtn className="w-10 h-10">
                <Plus className="w-4 h-4" strokeWidth={2} style={{color:"rgba(0,0,0,0.7)"}}/>
              </GlassBtn>
              <GlassBtn className="w-10 h-10">
                <Search className="w-4 h-4" strokeWidth={2} style={{color:"rgba(0,0,0,0.65)"}}/>
              </GlassBtn>
              <GlassBtn onClick={onDots} className="w-10 h-10 relative">
                <MoreHorizontal className="w-4 h-4" strokeWidth={2} style={{color:"rgba(0,0,0,0.65)"}}/>
                {state.listening&&<div className="absolute top-[7px] right-[7px] w-[6px] h-[6px] rounded-full" style={{backgroundColor:"#007AFF"}}/>}
              </GlassBtn>
            </div>
          </header>

          {/* Cards */}
          <div className="flex flex-col mb-7">
            {cardObjs.map((c,i)=>(
              <CardView key={c.id} card={c} index={i} isStacked holderName={state.cardholderName} onClick={()=>{haptic(10);setSelectedCard(c.id);}}/>
            ))}
          </div>

          {/* Loyalty pass */}
          <IberiaPass magicState={state} onGridTap={onGrid}/>
        </motion.div>

        {/* ── Card detail ── */}
        <AnimatePresence>
          {selectedCard&&selected&&(
            <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}}
              transition={{type:"spring",damping:28,stiffness:260}}
              className="absolute inset-0 z-50 flex flex-col"
              style={{backgroundColor:"#f2f2f7"}}>
              <div style={{height:"env(safe-area-inset-top, 44px)"}}/>
              <header className="px-4 py-2 flex justify-between items-center flex-shrink-0">
                <GlassBtn className="w-10 h-10" onClick={()=>{haptic(8);setSelectedCard(null);}}>
                  <X className="w-4 h-4" strokeWidth={2.2} style={{color:"rgba(0,0,0,0.65)"}}/>
                </GlassBtn>
                <div className="flex items-center gap-2">
                  <GlassBtn className="h-10 px-4 gap-1.5 rounded-full">
                    <CreditCard className="w-[15px] h-[15px]" strokeWidth={2} style={{color:"rgba(0,0,0,0.55)"}}/>
                    <span className="text-[11px] font-[500]" style={{color:"rgba(0,0,0,0.55)"}}>123</span>
                  </GlassBtn>
                  <GlassBtn className="h-10 px-4 gap-2 rounded-full">
                    <Search className="w-[15px] h-[15px]" strokeWidth={2} style={{color:"rgba(0,0,0,0.55)"}}/>
                    <MoreHorizontal className="w-[15px] h-[15px]" strokeWidth={2} style={{color:"rgba(0,0,0,0.55)"}}/>
                  </GlassBtn>
                </div>
              </header>
              <div className="flex-1 overflow-y-auto px-4 pb-12" style={{WebkitOverflowScrolling:"touch" as any,scrollbarWidth:"none"}}>
                <div className="mt-3 mb-6"><CardView card={selected} holderName={state.cardholderName}/></div>
                <h2 className="text-[22px] font-[700] mb-3 px-1" style={{color:"rgba(0,0,0,0.85)",letterSpacing:"-0.3px"}}>
                  Latest Transactions
                </h2>
                <div className="overflow-hidden" style={{
                  background:"rgba(255,255,255,0.82)",
                  backdropFilter:"blur(32px) saturate(200%)",
                  WebkitBackdropFilter:"blur(32px) saturate(200%)",
                  border:"1px solid rgba(255,255,255,0.5)",
                  boxShadow:"0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
                  borderRadius:"20px",
                }}>
                  {getTxs(selected).length>0
                    ? getTxs(selected).map(tx=><TxItem key={tx.id} tx={tx}/>)
                    : <div className="py-12 text-center text-gray-400 text-sm italic">No recent transactions</div>}
                </div>
              </div>
              <div className="flex justify-center py-3 flex-shrink-0" style={{backgroundColor:"#f2f2f7"}}>
                <div style={{width:134,height:5,borderRadius:3,background:"rgba(0,0,0,0.18)"}}/>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Settings ── */}
        <AnimatePresence>
          {showSettings&&(
            <SettingsPage magicState={state} onClose={()=>setShowSettings(false)} onUpdate={update} onReset={reset} isSaving={saving}/>
          )}
        </AnimatePresence>

        {/* Home indicator */}
        {!selectedCard&&!showSettings&&(
          <div className="flex justify-center py-3 flex-shrink-0" style={{backgroundColor:"#f2f2f7"}}>
            <div style={{width:134,height:5,borderRadius:3,background:"rgba(0,0,0,0.18)"}}/>
          </div>
        )}

      </div>
    </div>
  );
}
