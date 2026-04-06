import React, { useState, useEffect, useRef } from "react";
import {
  Plus, Search, MoreHorizontal, X, CreditCard, ChevronRight,
  Wifi, ShoppingBag, Building2, Coffee, UtensilsCrossed,
  RefreshCw, Trash2, ChevronLeft, Zap, Music, Car, Heart,
  Plane, Dumbbell, BookOpen, Gamepad2, Monitor, Utensils
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeCanvas } from "qrcode.react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Transaction {
  id: string; merchant: string; location: string;
  date: string; amount: string; currency: string; icon: React.ReactNode;
}
interface Card {
  id: string; bank: string; type: "Debit" | "Credit";
  last4: string; gradient: string; logo: "visa" | "mastercard" | "amex"; transactions: Transaction[];
}
interface MagicCard {
  id: string; bank: string; last4: string; color: string;
  brand: "visa" | "mastercard" | "amex"; cardType: "Debit" | "Credit";
}
interface MerchantEntry { name: string; icon: string; }
interface MagicState {
  cardholderName: string; apiResult: string; apiLastFetched: string; apiUserId: string;
  iberiaNumber: string; iberiaTier: string; iberiaMemberSince: string; iberiaValidThru: string;
  listening: boolean; currency: string; merchantMap: Record<string, MerchantEntry>; cards: MagicCard[];
  loyaltyName: string; loyaltySubtitle: string; loyaltyColor: string; loyaltyFieldLabel: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GRADIENTS = [
  { name: "BBVA Blue",     value: "from-[#004481] via-[#00a9e0] to-[#004481]" },
  { name: "Revolut",       value: "from-[#7b4397] via-[#dc2430] to-[#7b4397]" },
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

const ICON_COLORS: Record<string,string> = {
  shopping:"text-orange-500",food:"text-red-500",coffee:"text-amber-700",
  building:"text-blue-500",entertainment:"text-purple-500",travel:"text-sky-500",
  fitness:"text-green-500",music:"text-pink-500",car:"text-gray-600",
  health:"text-red-400",book:"text-indigo-500",game:"text-violet-500",
  tech:"text-yellow-500",restaurant:"text-orange-600",
};

// 2-3 options per letter — system picks one based on day of month so it varies between shows
const MERCHANT_OPTIONS: Record<string, MerchantEntry[]> = {
  A:[{name:"Amazon",icon:"shopping"},{name:"Apple Store",icon:"tech"},{name:"Adidas",icon:"fitness"}],
  B:[{name:"Burger King",icon:"food"},{name:"Boots",icon:"health"},{name:"BBC iPlayer",icon:"entertainment"}],
  C:[{name:"Costa Coffee",icon:"coffee"},{name:"Currys",icon:"tech"},{name:"Caffe Nero",icon:"coffee"}],
  D:[{name:"Decathlon",icon:"fitness"},{name:"Deliveroo",icon:"food"},{name:"Disney+",icon:"entertainment"}],
  E:[{name:"EasyJet",icon:"travel"},{name:"Eat Out",icon:"restaurant"},{name:"Etsy",icon:"shopping"}],
  F:[{name:"Foot Locker",icon:"fitness"},{name:"Farfetch",icon:"shopping"},{name:"First Direct",icon:"building"}],
  G:[{name:"Google Play",icon:"tech"},{name:"Gymshark",icon:"fitness"},{name:"Greggs",icon:"food"}],
  H:[{name:"H&M",icon:"shopping"},{name:"Halfords",icon:"car"},{name:"Hotel Chocolat",icon:"food"}],
  I:[{name:"IKEA",icon:"building"},{name:"iTunes",icon:"music"},{name:"IHG Hotels",icon:"travel"}],
  J:[{name:"JD Sports",icon:"fitness"},{name:"John Lewis",icon:"shopping"},{name:"Just Eat",icon:"food"}],
  K:[{name:"KFC",icon:"food"},{name:"Kindle Store",icon:"book"},{name:"Krispy Kreme",icon:"food"}],
  L:[{name:"Lyft",icon:"car"},{name:"Lush",icon:"health"},{name:"LEGO Store",icon:"shopping"}],
  M:[{name:"McDonald's",icon:"food"},{name:"Marks & Spencer",icon:"shopping"},{name:"Moonpig",icon:"shopping"}],
  N:[{name:"Netflix",icon:"entertainment"},{name:"Nike",icon:"fitness"},{name:"Nero",icon:"coffee"}],
  O:[{name:"Odeon",icon:"entertainment"},{name:"OFFICE",icon:"shopping"},{name:"Ocado",icon:"food"}],
  P:[{name:"Pizza Express",icon:"food"},{name:"Pret A Manger",icon:"coffee"},{name:"Primark",icon:"shopping"}],
  Q:[{name:"Quay Coffee",icon:"coffee"},{name:"Quidco",icon:"building"},{name:"Quorn",icon:"food"}],
  R:[{name:"Ryanair",icon:"travel"},{name:"Revolut",icon:"building"},{name:"Rough Trade",icon:"music"}],
  S:[{name:"Starbucks",icon:"coffee"},{name:"Spotify",icon:"music"},{name:"SPAR",icon:"food"}],
  T:[{name:"Ticketmaster",icon:"entertainment"},{name:"Tesco",icon:"food"},{name:"TfL",icon:"car"}],
  U:[{name:"Uber",icon:"car"},{name:"Uber Eats",icon:"food"},{name:"UNIQLO",icon:"shopping"}],
  V:[{name:"Vue Cinema",icon:"entertainment"},{name:"Vinted",icon:"shopping"},{name:"Virgin Active",icon:"fitness"}],
  W:[{name:"Waterstones",icon:"book"},{name:"Wetherspoons",icon:"food"},{name:"WHSmith",icon:"book"}],
  X:[{name:"Xbox Store",icon:"game"},{name:"XOXO Bakery",icon:"food"},{name:"Xcel Fitness",icon:"fitness"}],
  Y:[{name:"Yoga Studio",icon:"fitness"},{name:"YO! Sushi",icon:"food"},{name:"YouTube Premium",icon:"entertainment"}],
  Z:[{name:"Zara",icon:"shopping"},{name:"Zizzi",icon:"restaurant"},{name:"Zipcar",icon:"car"}],
};

// Pick option for a letter — rotates daily so it varies between shows
function pickMerchant(letter: string, customMap: Record<string, MerchantEntry>, idx: number): MerchantEntry {
  if (customMap[letter]) return customMap[letter];
  const options = MERCHANT_OPTIONS[letter] ?? [{name:`${letter} Store`,icon:"shopping"}];
  // Use day-of-year + letter index for daily variety
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(),0,0).getTime()) / 86400000);
  return options[(dayOfYear + idx) % options.length];
}

// For Settings — show the first option as default
const DEFAULT_MERCHANTS: Record<string, MerchantEntry> = Object.fromEntries(
  Object.entries(MERCHANT_OPTIONS).map(([k,v]) => [k, v[0]])
);

// Generate real relative date/time string — matches Apple Wallet format
function relativeDate(hoursAgo: number): string {
  const d = new Date(Date.now() - hoursAgo * 3600000);
  const now = new Date();
  const diffH = hoursAgo;
  const isToday = d.toDateString() === now.toDateString();
  const diffDays = Math.floor(diffH / 24);

  // Very recent: "X hours ago" 
  if (isToday && diffH < 1) return `${Math.round(diffH * 60)} minutes ago`;
  if (isToday && diffH < 24) return `${Math.round(diffH)} ${Math.round(diffH) === 1 ? "hour" : "hours"} ago`;
  // Within last 4 days: day name "Thursday"
  if (diffDays <= 4) return d.toLocaleDateString("en-GB", { weekday: "long" });
  // Older: "30/3/26" format (day/month/year short)
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

// Format amount like real Apple Wallet: "10,94 €"
function fmtAmount(intPart: number, decPart: number, curr: string): string {
  return `${intPart},${decPart < 10 ? "0" + decPart : decPart} ${curr}`;
}

function formatDateTime(timestamp: string) {
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return "Nunca";
  return d.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Generate mock background transactions
function getMockTxs(currency: string): Transaction[] {
  const seed = new Date().getDate();
  return [
    {id:"bg1",merchant:"Starbucks",location:"Apple Pay",date:relativeDate(18),amount:fmtAmount(11+(seed%8),((seed*7)%90)+5,currency),currency:"",icon:<Coffee className="w-5 h-5 text-amber-700"/>},
    {id:"bg2",merchant:"Tesco",location:"Contactless",date:relativeDate(27),amount:fmtAmount(43+(seed%20),((seed*13)%90)+5,currency),currency:"",icon:<ShoppingBag className="w-5 h-5 text-blue-600"/>},
    {id:"bg3",merchant:"Uber",location:"Apple Pay",date:relativeDate(51),amount:fmtAmount(8+(seed%5),((seed*3)%90)+10,currency),currency:"",icon:<Car className="w-5 h-5 text-gray-600"/>},
    {id:"bg4",merchant:"Deliveroo",location:"deliveroo.co.uk",date:relativeDate(74),amount:fmtAmount(22+(seed%15),((seed*11)%90)+5,currency),currency:"",icon:<UtensilsCrossed className="w-5 h-5 text-teal-500"/>},
    {id:"bg5",merchant:"Spotify",location:"spotify.com",date:relativeDate(120),amount:fmtAmount(9+(seed%4),((seed*17)%90)+5,currency),currency:"",icon:<Music className="w-5 h-5 text-green-500"/>},
  ];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderIcon(key: string, size = "w-5 h-5") {
  const t = ICON_TYPES.find(i => i.key === key);
  const col = ICON_COLORS[key] ?? "text-gray-400";
  return t ? t.render(`${size} ${col}`) : <ShoppingBag className={`${size} text-gray-400`}/>;
}

// ─── UI Primitives ────────────────────────────────────────────────────────────

const VisaLogo = ({isWhite}:{isWhite?:boolean}) => (
  <svg viewBox="0 15 48 18" className={`w-14 h-auto ${isWhite?"text-[#1A1F71]":"text-white"}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.83 31.565h3.048l1.905-11.728h-3.047l-1.906 11.728zM36.14 19.986c-.686-.264-1.752-.55-3.048-.55-3.352 0-5.714 1.782-5.733 4.343-.019 1.887 1.695 2.934 2.98 3.563 1.324.64 1.772 1.054 1.762 1.63-.019.886-1.057 1.287-2.038 1.287-1.362 0-2.095-.207-3.2-.716l-.448-.217-.476 2.963c.8.367 2.276.688 3.81.706 3.561 0 5.875-1.763 5.904-4.494.029-1.498-.895-2.638-2.857-3.572-1.19-.594-1.924-.99-1.924-1.593.01-.546.61-.13 1.124-.13 1.514 0 2.228.273 2.228.273l.267.123.476-2.963-.448-.17zm8.447 0h-2.362c-.733 0-1.286.217-1.6.97l-4.543 10.609h3.2l.638-1.763h3.914l.371 1.763h2.82l-2.438-11.579zm-3.695 6.407l1.667-4.59.952 4.59h-2.619zM12.63 19.837l-2.99 8.01-.362-1.838c-.62-2.11-2.553-4.39-4.714-5.52l3.057 11.076h3.21l4.78-11.728h-2.981z" fill="currentColor"/>
    <path d="M7.41 19.837H.133l-.038.188c5.657 1.442 9.4 4.937 10.943 9.102l-1.581-7.973c-.267-1.017-1.01-1.281-2.047-1.317z" fill="#F79E1B"/>
  </svg>
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

const CardView = ({card,isStacked,onClick,index}:{card:Card;isStacked?:boolean;onClick?:()=>void;index?:number}) => {
  const isWhite = card.gradient.includes("from-white")||card.gradient.includes("from-gray-100");
  return (
    <motion.div layoutId={`card-${card.id}`} onClick={onClick}
      className={`relative w-full aspect-[1.58/1] rounded-2xl p-6 shadow-xl cursor-pointer overflow-hidden bg-gradient-to-br ${card.gradient} ${isWhite?"text-gray-900 border border-gray-200":"text-white"}`}
      style={{zIndex:index,marginTop:isStacked&&index!==0?"-140px":"0"}} whileTap={{scale:0.98}}>
      <div className="flex justify-between items-start">
        <span className="text-2xl font-bold tracking-tighter">{card.bank}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{card.type}</span>
      </div>
      <div className="mt-8"><Wifi className={`w-8 h-8 rotate-90 opacity-80 ${isWhite?"text-gray-400":"text-white"}`}/></div>
      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
        <div className="flex flex-col">
          <span className="text-[8px] font-bold uppercase opacity-60">VALID THRU</span>
          <span className="text-lg font-medium tracking-widest">•••• {card.last4}</span>
        </div>
        <div>
          {card.logo==="visa"&&<VisaLogo isWhite={isWhite}/>}
          {card.logo==="mastercard"&&<MastercardLogo/>}
          {card.logo==="amex"&&<AmexLogo/>}
        </div>
      </div>
    </motion.div>
  );
};

const IberiaPass = ({magicState,onGridTap}:{magicState:MagicState;onGridTap:(n:string)=>void}) => {
  const loyaltyColor = magicState.loyaltyColor || "#D7192D";
  const loyaltyName = magicState.loyaltyName || "IBERIA";
  const loyaltySubtitle = magicState.loyaltySubtitle || "PLUS";
  const loyaltyFieldLabel = magicState.loyaltyFieldLabel || "IBERIA PLUS NUMBER";
  return (
  <div className="rounded-2xl p-6 text-white shadow-xl relative overflow-hidden" style={{backgroundColor: loyaltyColor}}>
    <div className="absolute inset-0 z-50 grid grid-cols-3 grid-rows-4">
      {[1,2,3,4,5,6,7,8,9,null,0,null].map((n,i) => (
        <button key={i} onClick={e=>{e.stopPropagation();if(n!==null)onGridTap(n.toString());}}
          className="w-full h-full active:bg-white/10">
          {n!==null&&<div className="w-1 h-1 bg-white/5 rounded-full mx-auto"/>}
        </button>
      ))}
    </div>
    <div className="flex justify-between items-start mb-8">
      <div className="flex items-center gap-1">
        <span className="font-black text-xl italic tracking-tighter">{loyaltyName}</span>
        {loyaltySubtitle && (
          <>
            <div className="w-6 h-3 bg-white/20 skew-x-[-20deg]"><div className="w-full h-[2px] bg-yellow-400"/></div>
            <span className="font-medium text-white/90 ml-1">{loyaltySubtitle}</span>
          </>
        )}
      </div>
      <div className="text-right">
        <span className="text-[8px] font-bold opacity-60 block">LEVEL</span>
        <span className="text-xl font-bold tracking-tighter">{magicState.iberiaTier}</span>
      </div>
    </div>
    <div className="mb-8">
      <span className="text-[8px] font-bold opacity-60 block uppercase">{loyaltyFieldLabel}</span>
      <span className="text-3xl font-medium tracking-tight text-gray-100">{magicState.iberiaNumber}</span>
    </div>
    <div className="flex justify-between items-end">
      <div className="space-y-4">
        <span className="text-xl font-medium block text-gray-300">{magicState.cardholderName}</span>
        <div className="flex gap-8">
          <div><span className="text-[8px] font-bold opacity-60 block uppercase">MEMBER SINCE</span><span className="text-lg font-medium text-gray-200">{magicState.iberiaMemberSince}</span></div>
          <div><span className="text-[8px] font-bold opacity-60 block uppercase">VALID THRU</span><span className="text-lg font-medium text-gray-200">{magicState.iberiaValidThru}</span></div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
          <span className="text-[7px] font-bold text-center leading-tight px-1">{loyaltyName.split(" ")[0]}</span>
        </div>
        <div className="w-10 h-2 rounded-full bg-white/30"/>
      </div>
    </div>
    <div className="mt-12 flex justify-center">
      <div className="bg-white p-4 rounded-2xl shadow-inner">
        <QRCodeCanvas value={`${loyaltyName}:${magicState.iberiaNumber}:${magicState.cardholderName}`} size={160} level="H" includeMargin={false}/>
      </div>
    </div>
  </div>
  );
};

const TxItem = ({tx}:{tx:Transaction}) => (
  <div className="flex items-center justify-between px-4 py-3 border-b last:border-0" style={{borderColor:"rgba(0,0,0,0.06)"}}>
    <div className="flex flex-col gap-0.5">
      <span className="text-[15px] font-[500] leading-tight" style={{color:"rgba(0,0,0,0.85)"}}>{tx.merchant}</span>
      <span className="text-[13px] leading-tight" style={{color:"rgba(0,0,0,0.45)"}}>{tx.location}</span>
      <span className="text-[13px] leading-tight" style={{color:"rgba(0,0,0,0.45)"}}>{tx.date}</span>
    </div>
    <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
      <span className="text-[15px] font-[500]" style={{color:"rgba(0,0,0,0.85)"}}>{tx.amount} {tx.currency}</span>
      <ChevronRight className="w-3.5 h-3.5" style={{color:"rgba(0,0,0,0.25)"}}/>
    </div>
  </div>
);

// ─── Settings Page ─────────────────────────────────────────────────────────────

type Tab = "account"|"cards"|"loyalty"|"merchants";

function SettingsPage({magicState,onClose,onUpdate,onReset,isSaving}:{
  magicState:MagicState;onClose:()=>void;onUpdate:(p:any)=>void;onReset:()=>void;isSaving:boolean;
}) {
  const [tab,setTab] = useState<Tab>("account");
  const [local,setLocal] = useState({...magicState});
  const [merchants,setMerchants] = useState<Record<string,MerchantEntry>>({...DEFAULT_MERCHANTS,...magicState.merchantMap});
  const [pending,setPending] = useState(false);
  const merchantsRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<Record<string,HTMLDivElement|null>>({});

  useEffect(()=>{setLocal(p=>({...p,...magicState}));},[magicState]);

  // Save all pending local changes to server
  const saveAll = () => {
    onUpdate({
      apiUserId: local.apiUserId,
      currency: local.currency,
      cardholderName: local.cardholderName,
      ibNum: local.iberiaNumber,
      ibTier: local.iberiaTier,
      ibSince: local.iberiaMemberSince,
      ibThru: local.iberiaValidThru,
      loyaltyName: local.loyaltyName,
      loyaltySubtitle: local.loyaltySubtitle,
      loyaltyColor: local.loyaltyColor,
      loyaltyFieldLabel: local.loyaltyFieldLabel,
      merchantMap: merchants,
    });
    setPending(false);
  };

  const setField = (patch: Partial<typeof local>) => { setLocal(p=>({...p,...patch})); setPending(true); };

  const scrollToLetter = (letter: string) => {
    letterRefs.current[letter]?.scrollIntoView({behavior:"smooth",block:"start"});
  };

  const TABS:{key:Tab;label:string}[] = [
    {key:"account",label:"Account"},{key:"cards",label:"Cards"},
    {key:"loyalty",label:"Loyalty"},{key:"merchants",label:"Merchants"},
  ];

  return (
    <motion.div initial={{x:"100%"}} animate={{x:0}} exit={{x:"100%"}}
      transition={{type:"spring",damping:28,stiffness:280}}
      className="absolute inset-0 bg-gray-50 z-[200] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 pb-0 px-4" style={{paddingTop:"calc(env(safe-area-inset-top) + 8px)"}}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="flex items-center gap-0.5 text-blue-500 font-semibold text-sm">
            <ChevronLeft className="w-5 h-5"/> Wallet
          </button>
          <h1 className="text-base font-semibold text-gray-900">Settings</h1>
          <button
            onClick={saveAll}
            className={`text-sm font-bold px-3 py-1.5 rounded-xl transition-all ${pending ? "bg-blue-500 text-white shadow-sm active:scale-95" : "text-blue-400 bg-transparent"}`}>
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin"/> : "Save"}
          </button>
        </div>
        <div className="flex">
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)}
              className={`flex-1 py-2.5 text-xs font-bold border-b-2 -mb-px transition-colors ${tab===t.key?"border-blue-500 text-blue-500":"border-transparent text-gray-400"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-12">

        {/* ACCOUNT */}
        {tab==="account"&&(
          <div className="px-4 pt-5 space-y-4">
            {/* GOO! */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">GOO! Account</p>
              <div className="bg-white rounded-2xl shadow-sm px-4 divide-y divide-gray-100">
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-500">User ID</span>
                  <input type="text" inputMode="numeric" value={local.apiUserId}
                    onChange={e=>setField({apiUserId:e.target.value})}
                    onBlur={e=>onUpdate({apiUserId:e.target.value})}
                    className="text-sm font-bold text-right bg-transparent outline-none w-28 focus:bg-gray-100 rounded-lg px-2 py-1"/>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-500">Último ingreso API</span>
                  <span className="text-sm font-bold text-blue-500 font-mono">{magicState.apiLastFetched ? formatDateTime(magicState.apiLastFetched) : "Nunca"}</span>
                </div>
                {magicState.apiResult && (
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-gray-500">Última consulta</span>
                    <span className="text-sm font-bold text-blue-500 font-mono">"{magicState.apiResult}"</span>
                  </div>
                )}
              </div>
            </div>
            {/* Currency */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Default Currency</p>
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex flex-wrap gap-2">
                  {CURRENCIES.map(c=>(
                    <button key={c} onClick={()=>setField({currency:c})}
                      className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${local.currency===c?"bg-blue-500 text-white shadow-sm":"bg-gray-100 text-gray-600"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Reset */}
            <button onClick={onReset}
              className="w-full py-3.5 rounded-2xl font-semibold text-red-500 bg-white border border-red-100 active:scale-95 transition-all text-sm shadow-sm">
              Reset for New Spectator
            </button>
          </div>
        )}

        {/* CARDS */}
        {tab==="cards"&&(
          <div className="px-4 pt-5 space-y-4">
            {magicState.cards.map((card,idx)=>(
              <div key={card.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className={`h-14 bg-gradient-to-br ${card.color} flex items-center px-4 justify-between`}>
                  <span className={`font-bold text-lg ${card.color.includes("from-white")?"text-gray-900":"text-white"}`}>{card.bank}</span>
                  <span className={`text-xs font-bold opacity-70 ${card.color.includes("from-white")?"text-gray-700":"text-white"}`}>···· {card.last4}</span>
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Card {idx+1}{idx===0?" · Acrostic":" · Birthday"}</span>
                    {magicState.cards.length>1&&(
                      <button onClick={()=>onUpdate({action:"remove",cardId:card.id})}><Trash2 className="w-3.5 h-3.5 text-red-400"/></button>
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
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${card.cardType===t?"bg-gray-900 text-white":"bg-gray-100 text-gray-500"}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1.5">Network</p>
                    <div className="flex gap-2">
                      {["visa","mastercard","amex"].map(b=>(
                        <button key={b} onClick={()=>onUpdate({action:"update",cardId:card.id,brand:b})}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${card.brand===b?"bg-gray-900 text-white":"bg-gray-100 text-gray-500"}`}>{b}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1.5">Color</p>
                    <div className="flex flex-wrap gap-2">
                      {GRADIENTS.map(g=>(
                        <button key={g.value} title={g.name}
                          onClick={()=>onUpdate({action:"update",cardId:card.id,color:g.value})}
                          className={`w-8 h-8 rounded-full bg-gradient-to-br ${g.value} border-2 transition-all ${card.color===g.value?"border-blue-500 scale-110 shadow-md":"border-white shadow-sm"}`}/>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={()=>onUpdate({action:"add"})}
              className="w-full py-3.5 rounded-2xl font-semibold text-blue-500 bg-white border border-blue-100 shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all">
              <Plus className="w-4 h-4"/> Add Card
            </button>
          </div>
        )}

        {/* LOYALTY */}
        {tab==="loyalty"&&(
          <div className="px-4 pt-5 space-y-4">

            {/* Live preview */}
            <div className="rounded-2xl overflow-hidden shadow-md">
              <div className="p-5 text-white" style={{backgroundColor: local.loyaltyColor||"#D7192D"}}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-black text-lg italic tracking-tighter">{local.loyaltyName||"BRAND"}</span>
                  {local.loyaltySubtitle&&<span className="text-sm text-white/80">{local.loyaltySubtitle}</span>}
                </div>
                <div className="text-[10px] opacity-60 uppercase font-bold">{local.loyaltyFieldLabel||"MEMBER NUMBER"}</div>
                <div className="text-2xl font-medium tracking-tight mt-0.5">{local.iberiaNumber}</div>
              </div>
            </div>

            {/* Presets */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Quick Presets</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {LOYALTY_PRESETS.map(p=>(
                  <button key={p.name}
                    onClick={()=>{
                      if(p.brand){
                        setField({loyaltyName:p.brand,loyaltySubtitle:p.subtitle,loyaltyColor:p.color,loyaltyFieldLabel:p.label});
                      }
                    }}
                    className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all"
                    style={{
                      backgroundColor: local.loyaltyColor===p.color&&local.loyaltyName===p.brand ? p.color : "white",
                      color: local.loyaltyColor===p.color&&local.loyaltyName===p.brand ? "white" : "#374151",
                      borderColor: p.color,
                    }}>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand fields */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Card Brand</p>
              <div className="bg-white rounded-2xl shadow-sm px-4 divide-y divide-gray-100">
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-500">Brand Name</span>
                  <input type="text" value={local.loyaltyName||""}
                    onChange={e=>setField({loyaltyName:e.target.value})}
                    placeholder="e.g. IBERIA"
                    className="text-sm font-bold text-right bg-transparent outline-none w-40 focus:bg-gray-100 rounded-lg px-2 py-1"/>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-500">Subtitle</span>
                  <input type="text" value={local.loyaltySubtitle||""}
                    onChange={e=>setField({loyaltySubtitle:e.target.value})}
                    placeholder="e.g. PLUS"
                    className="text-sm font-bold text-right bg-transparent outline-none w-40 focus:bg-gray-100 rounded-lg px-2 py-1"/>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-500">Field Label</span>
                  <input type="text" value={local.loyaltyFieldLabel||""}
                    onChange={e=>setField({loyaltyFieldLabel:e.target.value})}
                    placeholder="e.g. MEMBER NUMBER"
                    className="text-sm font-bold text-right bg-transparent outline-none w-40 focus:bg-gray-100 rounded-lg px-2 py-1"/>
                </div>
              </div>
            </div>

            {/* Color */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Card Color</p>
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  {LOYALTY_COLORS.map(c=>(
                    <button key={c} onClick={()=>setField({loyaltyColor:c})}
                      className={`w-9 h-9 rounded-full border-2 transition-all ${local.loyaltyColor===c?"border-blue-500 scale-110 shadow-md":"border-white shadow-sm"}`}
                      style={{backgroundColor:c}}/>
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

            {/* Member data */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Member Data</p>
              <div className="bg-white rounded-2xl shadow-sm px-4 divide-y divide-gray-100">
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

        {/* MERCHANTS */}
        {tab==="merchants"&&(
          <div className="relative flex">
            {/* Main list */}
            <div ref={merchantsRef} className="flex-1 px-4 pt-5 space-y-2 pr-10">
              <p className="text-xs text-gray-400 px-1 mb-3">Each letter maps to a merchant in the acrostic.</p>
              {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(letter=>{
                const entry = merchants[letter]??DEFAULT_MERCHANTS[letter];
                return (
                  <div key={letter} ref={el=>{letterRefs.current[letter]=el;}} className="bg-white rounded-2xl px-4 py-3 shadow-sm">
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
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${entry.icon===it.key?"bg-gray-900 text-white":"bg-gray-100 text-gray-500"}`}>
                          {it.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Alphabet quick-jump sidebar */}
            <div className="fixed right-0 top-1/2 -translate-y-1/2 flex flex-col items-center py-2 z-50">
              {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(l=>(
                <button key={l} onClick={()=>scrollToLetter(l)}
                  className="w-6 text-center text-[10px] font-bold text-blue-500 leading-5 active:text-blue-700">
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

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const sessionId = (()=>{
    const u = new URLSearchParams(window.location.search).get("s");
    if(u){localStorage.setItem("goo_session_id",u);return u;}
    return localStorage.getItem("goo_session_id")||"default";
  })();

  const defaults: MagicState = {
    cardholderName:"ARIEL hamui",apiResult:"",apiUserId:"131",
    iberiaNumber:"IB 125900928",iberiaTier:"PLATA",iberiaMemberSince:"04/24",iberiaValidThru:"04/26",
    listening:false,currency:"£",merchantMap:{},
    apiLastFetched:"",
    loyaltyName:"IBERIA",loyaltySubtitle:"PLUS",loyaltyColor:"#D7192D",loyaltyFieldLabel:"IBERIA PLUS NUMBER",
    cards:[
      {id:"bbva-1",bank:"BBVA",last4:"1239",color:"from-[#004481] via-[#00a9e0] to-[#004481]",brand:"visa",cardType:"Debit"},
      {id:"revolut-1",bank:"Revolut",last4:"0000",color:"from-[#7b4397] via-[#dc2430] to-[#7b4397]",brand:"mastercard",cardType:"Debit"},
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

  // Load on open
  useEffect(()=>{
    fetch(`/api/magic/reset${sessionId?`?s=${sessionId}`:""}`)
      .then(r=>r.json()).then(d=>{if(d.freshState)setState(p=>({...defaults,...d.freshState,merchantMap:{...p.merchantMap,...d.freshState.merchantMap}}));setReady(true);})
      .catch(()=>setReady(true));
  },[]);

  // Visibility
  useEffect(()=>{
    const fn = async()=>{
      if(document.visibilityState==="hidden"){navigator.sendBeacon(`/api/magic/reset${sessionId?`?s=${sessionId}`:""}`);}
      else{try{if("wakeLock"in navigator)wakeLock.current=await(navigator as any).wakeLock.request("screen");}catch{}}
    };
    document.addEventListener("visibilitychange",fn);
    return()=>document.removeEventListener("visibilitychange",fn);
  },[sessionId]);

  // Wake lock
  useEffect(()=>{
    (async()=>{try{if("wakeLock"in navigator)wakeLock.current=await(navigator as any).wakeLock.request("screen");}catch{}})();
    return()=>{wakeLock.current?.release().catch(()=>{});};
  },[]);

  // Poll
  useEffect(()=>{
    const poll=async()=>{
      if(showSettings)return;
      try{
        const r=await fetch(`/api/magic${sessionId?`?s=${sessionId}`:""}`);
        if(!r.ok)return;const ct=r.headers.get("content-type");
        if(!ct?.includes("application/json"))return;
        const d=await r.json();setState(p=>({...defaults,...d,merchantMap:{...p.merchantMap,...d.merchantMap}}));
      }catch{}
    };
    const iv=setInterval(poll,2000);return()=>clearInterval(iv);
  },[showSettings]);

  // Grid
  const onGrid=(n:string)=>{
    setDigits(p=>p+n);
    if(digitTimer.current)clearTimeout(digitTimer.current);
    digitTimer.current=setTimeout(()=>setDigits(""),3000);
  };
  useEffect(()=>{
    if(digits.length===4){const f=state.cards[0];if(f)update({action:"update",cardId:f.id,last4:digits});setDigits("");}
  },[digits]);

  // Wallet triple tap
  const onWalletTap=()=>{
    walletTaps.current+=1;
    if(walletTimer.current)clearTimeout(walletTimer.current);
    walletTimer.current=setTimeout(()=>{walletTaps.current=0;},800);
    if(walletTaps.current===3){haptic(15);setShowSettings(true);walletTaps.current=0;}
  };

  // Dots double tap
  const onDots=()=>{
    dotsTaps.current+=1;
    if(dotsTimer.current)clearTimeout(dotsTimer.current);
    dotsTimer.current=setTimeout(()=>{dotsTaps.current=0;},600);
    if(dotsTaps.current===2){
      dotsTaps.current=0;const nl=!state.listening;haptic(nl?15:8);
      setState(p=>({...p,listening:nl}));update({listening:nl});
    }
  };

  // Onboarding
  const onObComplete=async()=>{
    if(!obId.trim())return;haptic(20);const n=obName.trim()||"ARIEL hamui";
    await fetch(`/api/magic${sessionId?`?s=${sessionId}`:""}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({apiUserId:obId.trim(),cardholderName:n})}).catch(()=>{});
    localStorage.setItem(setupKey,"1");setState(p=>({...p,apiUserId:obId.trim(),cardholderName:n}));setShowOnboard(false);
  };

  // Update
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

  const getTxs=(card:Card):Transaction[]=>{
    const fid=state.cards[0]?.id;
    if(card.id===fid&&state.apiResult){
      const parts=state.apiResult.trim().replace(/\s+/g,"").split("");
      const now = Date.now();
      const acro:Transaction[]=parts.map((ch,i)=>{
        const L=ch.toUpperCase();
        const e = pickMerchant(L, merchantMap, i);
        // Realistic amounts: base on letter charcode, varied by index
        const base=(L.charCodeAt(0)%40)+8;
        const dec=((i*23)+7)%99;
        // Realistic times: most recent first, spaced minutes apart
        const minsAgo = i * 3 + Math.floor((L.charCodeAt(0) % 5));
        const date = relativeDate(minsAgo / 60);
        return {
          id:`tx-${i}-${L}`,
          merchant:e.name,
          location:"Apple Pay",
          date,
          amount:fmtAmount(base, dec, currency),
          currency:"",
          icon:renderIcon(e.icon)
        };
      });
      return [...acro,...card.transactions];
    }
    return card.transactions;
  };

  if(!ready)return <div className="min-h-screen bg-white"/>;

  return (
    <div className="min-h-screen font-sans" style={{backgroundColor:"#f2f2f7"}}>
      <div className="max-w-md mx-auto min-h-screen relative overflow-hidden flex flex-col" style={{backgroundColor:"#f2f2f7"}}>

        {/* Onboarding */}
        {showOnboard&&(
          <div className="absolute inset-0 bg-white z-[300] flex flex-col items-center justify-center p-8">
            <div className="w-20 h-20 rounded-[22px] bg-black flex items-center justify-center mb-6 shadow-xl overflow-hidden">
              <img src="/apple-touch-icon.png" alt="Wallet" className="w-full h-full object-cover"/>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">GOO! Wallet</h1>
            <p className="text-gray-400 text-sm text-center mb-10">Connect your GOO! account to get started</p>
            <div className="w-full space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your GOO! User ID</label>
                <input type="text" inputMode="numeric" placeholder="e.g. 131" value={obId}
                  onChange={e=>setObId(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onObComplete()} autoFocus
                  className="w-full bg-gray-100 rounded-xl px-4 py-3 text-gray-900 text-lg font-medium focus:ring-2 focus:ring-blue-500 outline-none border-none"/>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Name</label>
                <input type="text" placeholder="e.g. ARIEL hamui" value={obName}
                  onChange={e=>setObName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onObComplete()}
                  className="w-full bg-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none border-none"/>
              </div>
              <button onClick={onObComplete} disabled={!obId.trim()}
                className={`w-full py-4 rounded-2xl font-bold text-white transition-all mt-2 ${obId.trim()?"bg-blue-600 active:scale-95 shadow-lg":"bg-gray-200 text-gray-400"}`}>
                Connect Wallet
              </button>
            </div>
          </div>
        )}

        {/* Main */}
        <div className={`flex-1 overflow-y-auto transition-all duration-300 ${selectedCard?"opacity-0 scale-95 pointer-events-none":"opacity-100 scale-100"}`}
          style={{paddingTop:"calc(env(safe-area-inset-top) + 12px)", paddingLeft:"16px", paddingRight:"16px", paddingBottom:"24px"}}>
          <header className="flex justify-between items-center mb-5">
            <h1 onClick={onWalletTap} className="text-[34px] font-[700] tracking-tight select-none" style={{color:"rgba(0,0,0,0.85)", letterSpacing:"-0.5px"}}>Wallet</h1>
            <div className="flex items-center gap-2">
              {/* + circle — slightly smaller, thinner icon */}
              <button className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{background:"rgba(255,255,255,0.85)", boxShadow:"0 1px 6px rgba(0,0,0,0.07)"}}>
                <Plus className="w-4 h-4" strokeWidth={1.8} style={{color:"rgba(0,0,0,0.75)"}}/>
              </button>
              {/* Search + dots pill */}
              <button onClick={onDots} className="h-10 px-4 rounded-full flex items-center gap-2.5"
                style={{background:"rgba(255,255,255,0.85)", boxShadow:"0 1px 6px rgba(0,0,0,0.07)"}}>
                <Search className="w-[16px] h-[16px]" strokeWidth={1.8} style={{color:"rgba(0,0,0,0.7)"}}/>
                <div className="flex items-center gap-[3.5px]">
                  <div className="w-[4px] h-[4px] rounded-full" style={{backgroundColor:"rgba(0,0,0,0.65)"}}/>
                  <div className="w-[4px] h-[4px] rounded-full" style={{backgroundColor:"rgba(0,0,0,0.65)"}}/>
                  {state.listening&&<div className="w-[4px] h-[4px] rounded-full" style={{backgroundColor:"rgba(0,0,0,0.65)"}}/>}
                </div>
              </button>
            </div>
          </header>
          <div className="flex flex-col mb-6">
            {cardObjs.map((c,i)=><CardView key={c.id} card={c} index={i} isStacked onClick={()=>setSelectedCard(c.id)}/>)}
          </div>
          <div className="mt-4">
            <div className="rounded-2xl shadow-lg overflow-hidden">
              <IberiaPass magicState={state} onGridTap={onGrid}/>
            </div>
          </div>
        </div>

        {/* Card detail */}
        <AnimatePresence>
          {selectedCard&&selected&&(
            <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring",damping:25,stiffness:200}}
              className="absolute inset-0 z-50 flex flex-col" style={{backgroundColor:"#f2f2f7"}}>
              <div style={{height:"env(safe-area-inset-top)"}}/>
              <header className="px-4 py-2 flex justify-between items-center">
                <button onClick={()=>setSelectedCard(null)}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{background:"rgba(255,255,255,0.7)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", boxShadow:"0 1px 6px rgba(0,0,0,0.07)"}}>
                  <X className="w-4 h-4" strokeWidth={2} style={{color:"rgba(0,0,0,0.65)"}}/>
                </button>
                <div className="flex items-center gap-2">
                  <div className="h-10 px-4 rounded-full flex items-center gap-1.5"
                    style={{background:"rgba(255,255,255,0.7)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", boxShadow:"0 1px 6px rgba(0,0,0,0.07)"}}>
                    <CreditCard className="w-[15px] h-[15px]" strokeWidth={1.8} style={{color:"rgba(0,0,0,0.55)"}}/>
                    <span className="text-[11px] font-[500]" style={{color:"rgba(0,0,0,0.55)"}}>123</span>
                  </div>
                  <div className="h-10 px-4 rounded-full flex items-center gap-2.5"
                    style={{background:"rgba(255,255,255,0.7)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", boxShadow:"0 1px 6px rgba(0,0,0,0.07)"}}>
                    <Search className="w-[15px] h-[15px]" strokeWidth={1.8} style={{color:"rgba(0,0,0,0.55)"}}/>
                    <MoreHorizontal className="w-[15px] h-[15px]" strokeWidth={1.8} style={{color:"rgba(0,0,0,0.55)"}}/>
                  </div>
                </div>
              </header>
              <div className="flex-1 overflow-y-auto px-4 pb-12">
                <div className="mt-3 mb-5"><CardView card={selected}/></div>
                <h2 className="text-[22px] font-[700] mb-2 px-1" style={{color:"rgba(0,0,0,0.85)", letterSpacing:"-0.3px"}}>Latest Transactions</h2>
                <div className="overflow-hidden" style={{backgroundColor:"rgba(255,255,255,0.85)", borderRadius:"18px", boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
                  {getTxs(selected).length>0
                    ? getTxs(selected).map(tx=><TxItem key={tx.id} tx={tx}/>)
                    : <div className="py-12 text-center text-gray-400 italic">No recent transactions</div>}
                </div>
              </div>
              <div className="flex justify-center pb-2 pt-3" style={{backgroundColor:"#f2f2f7"}}>
                <div className="w-32 h-1.5 bg-gray-300 rounded-full opacity-60"/>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings */}
        <AnimatePresence>
          {showSettings&&(
            <SettingsPage magicState={state} onClose={()=>setShowSettings(false)} onUpdate={update} onReset={reset} isSaving={saving}/>
          )}
        </AnimatePresence>

        {!selectedCard&&!showSettings&&(
          <div className="flex justify-center pb-2 pt-3" style={{backgroundColor:"#f2f2f7"}}>
            <div className="w-32 h-1.5 bg-gray-400 rounded-full opacity-40"/>
          </div>
        )}
      </div>
    </div>
  );
}
