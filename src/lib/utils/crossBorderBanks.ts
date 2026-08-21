export interface CrossBorderBank {
  name: string;
  domain: string;
  logo: string;
}

export interface CrossBorderGroup {
  code: string;
  flag: string;
  nameKey: string;
  banks: CrossBorderBank[];
}

export const CROSS_BORDER_GROUPS: CrossBorderGroup[] = [
  {
    code: 'ID',
    flag: '/flags/id.svg',
    nameKey: 'countryID',
    banks: [
      { name: 'Bank Central Asia (BCA)', domain: 'bca.co.id', logo: '/banks/bca.png' },
      { name: 'Bank Syariah Indonesia', domain: 'bankbsi.co.id', logo: '/banks/bsi.png' },
      { name: 'DANA', domain: 'dana.id', logo: '/banks/dana.png' },
      { name: 'CIMB Niaga', domain: 'cimbniaga.com', logo: '/banks/cimb-niaga.png' },
      { name: 'Bank Sinarmas', domain: 'banksinarmas.com', logo: '/banks/sinarmas.png' },
      { name: 'Bank Mega', domain: 'bankmega.com', logo: '/banks/bank-mega.png' },
      { name: 'Permata Bank', domain: 'permatabank.com', logo: '/banks/permata.png' },
      { name: 'BPD Bali', domain: 'bpdbali.co.id', logo: '/banks/bpd-bali.png' },
      { name: 'Bank Mandiri', domain: 'bankmandiri.co.id', logo: '/banks/mandiri.png' },
      { name: 'LinkAja', domain: 'linkaja.id', logo: '/banks/linkaja.png' },
      { name: 'Ottocash', domain: 'ottocash.id', logo: '/banks/ottocash.png' },
    ],
  },
  {
    code: 'MY',
    flag: '/flags/my.svg',
    nameKey: 'countryMY',
    banks: [
      { name: 'CIMB', domain: 'cimb.com', logo: '/banks/cimb.png' },
      { name: 'Hong Leong Bank', domain: 'hlb.com.my', logo: '/banks/hlb.png' },
      { name: 'Maybank', domain: 'maybank.com', logo: '/banks/maybank.png' },
      { name: 'Touch ’n Go', domain: 'tngdigital.com.my', logo: '/banks/tng.png' },
      { name: 'Public Bank', domain: 'pbebank.com', logo: '/banks/public-bank.png' },
      { name: 'BigPay', domain: 'bigpayme.com', logo: '/banks/bigpay.png' },
      { name: 'OCBC', domain: 'ocbc.com', logo: '/banks/ocbc.png' },
      { name: 'FINEXUS', domain: 'finexusgroup.com', logo: '/banks/finexus.png' },
      { name: 'Bank of China', domain: 'bankofchina.com', logo: '/banks/boc.png' },
      { name: 'Bank Islam Malaysia', domain: 'bankislam.com', logo: '/banks/bank-islam.png' },
      { name: 'MobilityOne', domain: 'mobilityone.com.my', logo: '/banks/mobilityone.png' },
      { name: 'RHB', domain: 'rhbgroup.com', logo: '/banks/rhb.png' },
      { name: 'BOOST', domain: 'myboost.com.my', logo: '/banks/boost.png' },
    ],
  },
  {
    code: 'KH',
    flag: '/flags/kh.svg',
    nameKey: 'countryKH',
    banks: [
      { name: 'ACLEDA Bank', domain: 'acledabank.com.kh', logo: '/banks/acleda.png' },
      { name: 'Sathapana Bank', domain: 'sathapana.com.kh', logo: '/banks/sathapana.png' },
      { name: 'Hattha Bank', domain: 'hatthabank.com', logo: '/banks/hattha.png' },
      { name: 'Cambodia Post Bank', domain: 'cambodiapostbank.com', logo: '/banks/cpb.png' },
      { name: 'FTB Bank', domain: 'ftbbank.com', logo: '/banks/ftb.png' },
      { name: 'BIC Bank', domain: 'bicbank.com.kh', logo: '/banks/bic.png' },
      { name: 'LOLC (Cambodia)', domain: 'lolc.com.kh', logo: '/banks/lolc.png' },
      { name: 'Phillip Bank', domain: 'phillipbank.com.kh', logo: '/banks/phillip.png' },
      { name: 'ABA Bank', domain: 'ababank.com', logo: '/banks/aba.png' },
      { name: 'Canadia Bank', domain: 'canadiabank.com.kh', logo: '/banks/canadia.png' },
      { name: 'AMK Microfinance', domain: 'amk.com.kh', logo: '/banks/amk.png' },
    ],
  },
  {
    code: 'SG',
    flag: '/flags/sg.svg',
    nameKey: 'countrySG',
    banks: [
      { name: 'DBS', domain: 'dbs.com', logo: '/banks/dbs.png' },
      { name: 'OCBC', domain: 'ocbc.com', logo: '/banks/ocbc-sg.png' },
      { name: 'UOB', domain: 'uob.com.sg', logo: '/banks/uob.png' },
    ],
  },
  {
    code: 'VN',
    flag: '/flags/vn.svg',
    nameKey: 'countryVN',
    banks: [
      { name: 'TPBank', domain: 'tpb.vn', logo: '/banks/tpbank.png' },
      { name: 'Sacombank', domain: 'sacombank.com.vn', logo: '/banks/sacombank.png' },
      { name: 'VietinBank', domain: 'vietinbank.vn', logo: '/banks/vietinbank.png' },
      { name: 'Nam A Bank', domain: 'namabank.com.vn', logo: '/banks/namabank.png' },
      { name: 'BIDV', domain: 'bidv.com.vn', logo: '/banks/bidv.png' },
      { name: 'Techcombank', domain: 'techcombank.com', logo: '/banks/techcombank.png' },
      { name: 'Woori Bank', domain: 'wooribank.com.vn', logo: '/banks/woori.png' },
      { name: 'Vietcombank', domain: 'vietcombank.com.vn', logo: '/banks/vietcombank.png' },
      { name: 'BVBank', domain: 'bvbank.com.vn', logo: '/banks/bvbank.png' },
      { name: 'MB Bank', domain: 'mbbank.com.vn', logo: '/banks/mb.png' },
      { name: 'Shinhan Bank', domain: 'shinhan.com.vn', logo: '/banks/shinhan.png' },
      { name: 'Eximbank', domain: 'eximbank.com.vn', logo: '/banks/eximbank.png' },
      { name: 'HDBank', domain: 'hdbank.com.vn', logo: '/banks/hdbank.png' },
      { name: 'VRB', domain: 'vrb.com.vn', logo: '/banks/vrb.png' },
      { name: 'MoMo', domain: 'momo.vn', logo: '/banks/momo.png' },
      { name: 'NCB', domain: 'ncb.com.vn', logo: '/banks/ncb.png' },
    ],
  },
  {
    code: 'HK',
    flag: '/flags/hk.svg',
    nameKey: 'countryHK',
    banks: [
      { name: 'Bank of China (HK)', domain: 'bochk.com', logo: '/banks/bochk.png' },
      { name: 'Bank of Communications (HK)', domain: 'bankcomm.com.hk', logo: '/banks/bocom.png' },
      { name: 'Bank of East Asia', domain: 'hkbea.com', logo: '/banks/bea.png' },
      { name: 'Citibank (HK)', domain: 'citibank.com.hk', logo: '/banks/citi-hk.png' },
      { name: 'Fubon Bank (HK)', domain: 'fubonbank.com.hk', logo: '/banks/fubon.png' },
      { name: 'Hang Seng Bank', domain: 'hangseng.com', logo: '/banks/hangseng.png' },
      { name: 'HSBC', domain: 'hsbc.com.hk', logo: '/banks/hsbc.png' },
      { name: 'Octopus', domain: 'octopus.com.hk', logo: '/banks/octopus.png' },
      { name: 'Tap & Go', domain: 'tapngo.com.hk', logo: '/banks/tapngo.png' },
      { name: 'Yintran Group', domain: 'yedpay.com', logo: '/banks/yintran.png' },
    ],
  },
  {
    code: 'LA',
    flag: '/flags/la.svg',
    nameKey: 'countryLA',
    banks: [
      { name: 'BCEL', domain: 'bcel.com.la', logo: '/banks/bcel.png' },
      { name: 'Joint Development Bank', domain: 'jdbbank.com.la', logo: '/banks/jdb.png' },
      { name: 'Agricultural Promotion Bank', domain: 'apb.com.la', logo: '/banks/apb.png' },
      { name: 'Lao-Viet Bank', domain: 'laovietbank.com.la', logo: '/banks/laoviet.png' },
      { name: 'ST Bank', domain: 'stbanklaos.la', logo: '/banks/stbank.png' },
      { name: 'ACLEDA Bank Lao', domain: 'acledabank.com.la', logo: '/banks/acleda-la.png' },
      { name: 'Lao Development Bank', domain: 'ldb.gov.la', logo: '/banks/ldb.png' },
      { name: 'MJBL', domain: 'mjbl.com.la', logo: '/banks/mjbl.png' },
      { name: 'Sacom Bank', domain: 'sacombank.com', logo: '/banks/sacom.png' },
      { name: 'PSVB', domain: 'phongsavanhbank.com', logo: '/banks/psvb.png' },
    ],
  },
];
