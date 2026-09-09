/**
 * Comprehensive Pakistani Districts and Cities Directory
 * Spanning all 7 Administrative Regions:
 * Punjab, Sindh, Khyber Pakhtunkhwa (KP), Balochistan,
 * Islamabad Capital Territory, Azad Jammu & Kashmir (AJK), and Gilgit-Baltistan (GB).
 */

export interface PakistanCity {
  id: string;
  name: string;
  urduName: string;
  province: 'Punjab' | 'Sindh' | 'Khyber Pakhtunkhwa' | 'Balochistan' | 'Islamabad' | 'Azad Kashmir' | 'Gilgit-Baltistan';
  lat: number;
  lon: number;
  isPopular?: boolean;
}

export const PAKISTAN_CITIES: PakistanCity[] = [
  // ===================== ISLAMABAD =====================
  { id: 'islamabad', name: 'Islamabad', urduName: 'اسلام آباد', province: 'Islamabad', lat: 33.6844, lon: 73.0479, isPopular: true },

  // ===================== PUNJAB =====================
  { id: 'lahore', name: 'Lahore', urduName: 'لاہور', province: 'Punjab', lat: 31.5204, lon: 74.3587, isPopular: true },
  { id: 'faisalabad', name: 'Faisalabad', urduName: 'فیصل آباد', province: 'Punjab', lat: 31.4504, lon: 73.1350, isPopular: true },
  { id: 'rawalpindi', name: 'Rawalpindi', urduName: 'راولپنڈی', province: 'Punjab', lat: 33.5651, lon: 73.0169, isPopular: true },
  { id: 'multan', name: 'Multan', urduName: 'ملتان', province: 'Punjab', lat: 30.1575, lon: 71.5249, isPopular: true },
  { id: 'gujranwala', name: 'Gujranwala', urduName: 'گوجرانوالہ', province: 'Punjab', lat: 32.1877, lon: 74.1945, isPopular: true },
  { id: 'bahawalpur', name: 'Bahawalpur', urduName: 'بہاولپور', province: 'Punjab', lat: 29.3544, lon: 71.6911, isPopular: true },
  { id: 'sargodha', name: 'Sargodha', urduName: 'سرگودھا', province: 'Punjab', lat: 32.0836, lon: 72.6711, isPopular: true },
  { id: 'sialkot', name: 'Sialkot', urduName: 'سیالکوٹ', province: 'Punjab', lat: 32.4945, lon: 74.5229, isPopular: true },
  { id: 'sheikhupura', name: 'Sheikhupura', urduName: 'شیخوپورہ', province: 'Punjab', lat: 31.7131, lon: 73.9783 },
  { id: 'rahim-yar-khan', name: 'Rahim Yar Khan', urduName: 'رحیم یار خان', province: 'Punjab', lat: 28.4195, lon: 70.3024, isPopular: true },
  { id: 'jhang', name: 'Jhang', urduName: 'جھنگ', province: 'Punjab', lat: 31.2781, lon: 72.3317 },
  { id: 'sahiwal', name: 'Sahiwal', urduName: 'ساہیوال', province: 'Punjab', lat: 30.6682, lon: 73.1114, isPopular: true },
  { id: 'gujrat', name: 'Gujrat', urduName: 'گجرات', province: 'Punjab', lat: 32.5742, lon: 74.0754 },
  { id: 'kasur', name: 'Kasur', urduName: 'قصور', province: 'Punjab', lat: 31.1179, lon: 74.4408 },
  { id: 'okara', name: 'Okara', urduName: 'اوکاڑہ', province: 'Punjab', lat: 30.8081, lon: 73.4458 },
  { id: 'muzaffargarh', name: 'Muzaffargarh', urduName: 'مظفر گڑھ', province: 'Punjab', lat: 30.0744, lon: 71.1847 },
  { id: 'd-g-khan', name: 'D.G. Khan', urduName: 'ڈیرہ غازی خان', province: 'Punjab', lat: 30.0561, lon: 70.6348 },
  { id: 'khanewal', name: 'Khanewal', urduName: 'خانیوال', province: 'Punjab', lat: 30.3017, lon: 71.9321 },
  { id: 'pakpattan', name: 'Pakpattan', urduName: 'پاکپتن', province: 'Punjab', lat: 30.3410, lon: 73.3866 },
  { id: 'toba-tek-singh', name: 'Toba Tek Singh', urduName: 'ٹوبہ ٹیک سنگھ', province: 'Punjab', lat: 30.9709, lon: 72.4826 },
  { id: 'vehari', name: 'Vehari', urduName: 'وہاڑی', province: 'Punjab', lat: 30.0419, lon: 72.3528 },
  { id: 'bahawalnagar', name: 'Bahawalnagar', urduName: 'بہاولنگر', province: 'Punjab', lat: 29.9987, lon: 73.2536 },
  { id: 'chiniot', name: 'Chiniot', urduName: 'چنیوٹ', province: 'Punjab', lat: 31.7200, lon: 72.9789 },
  { id: 'hafizabad', name: 'Hafizabad', urduName: 'حافظ آباد', province: 'Punjab', lat: 32.0679, lon: 73.6854 },
  { id: 'mandi-bahauddin', name: 'Mandi Bahauddin', urduName: 'منڈی بہاؤالدین', province: 'Punjab', lat: 32.5870, lon: 73.4912 },
  { id: 'nankana-sahib', name: 'Nankana Sahib', urduName: 'ننکانہ صاحب', province: 'Punjab', lat: 31.4492, lon: 73.7125 },
  { id: 'lodhran', name: 'Lodhran', urduName: 'لودھراں', province: 'Punjab', lat: 29.5405, lon: 71.6336 },
  { id: 'attock', name: 'Attock', urduName: 'اٹک', province: 'Punjab', lat: 33.7667, lon: 72.3667 },
  { id: 'chakwal', name: 'Chakwal', urduName: 'چکوال', province: 'Punjab', lat: 32.9328, lon: 72.8631 },
  { id: 'jhelum', name: 'Jhelum', urduName: 'جہلم', province: 'Punjab', lat: 32.9405, lon: 73.7276 },
  { id: 'mianwali', name: 'Mianwali', urduName: 'میانوالی', province: 'Punjab', lat: 32.5839, lon: 71.5370 },
  { id: 'bhakkar', name: 'Bhakkar', urduName: 'بھکر', province: 'Punjab', lat: 31.6253, lon: 71.0657 },
  { id: 'khushab', name: 'Khushab', urduName: 'خوشاب', province: 'Punjab', lat: 32.2967, lon: 72.3525 },
  { id: 'layyah', name: 'Layyah', urduName: 'لیہ', province: 'Punjab', lat: 30.9613, lon: 70.9390 },
  { id: 'rajanpur', name: 'Rajanpur', urduName: 'راجن پور', province: 'Punjab', lat: 29.1035, lon: 70.3250 },
  { id: 'kot-addu', name: 'Kot Addu', urduName: 'کوٹ ادو', province: 'Punjab', lat: 30.4700, lon: 70.9656 },
  { id: 'taunsa', name: 'Taunsa', urduName: 'تونسہ', province: 'Punjab', lat: 30.7042, lon: 70.6506 },
  { id: 'murree', name: 'Murree', urduName: 'مری', province: 'Punjab', lat: 33.9070, lon: 73.3943 },
  { id: 'talagang', name: 'Talagang', urduName: 'تلہ گنگ', province: 'Punjab', lat: 32.9292, lon: 72.4172 },
  { id: 'wazirabad', name: 'Wazirabad', urduName: 'وزیر آباد', province: 'Punjab', lat: 32.4432, lon: 74.1197 },

  // ===================== SINDH =====================
  { id: 'karachi', name: 'Karachi', urduName: 'کراچی', province: 'Sindh', lat: 24.8607, lon: 67.0011, isPopular: true },
  { id: 'hyderabad', name: 'Hyderabad', urduName: 'حیدرآباد', province: 'Sindh', lat: 25.3960, lon: 68.3578, isPopular: true },
  { id: 'sukkur', name: 'Sukkur', urduName: 'سکھر', province: 'Sindh', lat: 27.7052, lon: 68.8574, isPopular: true },
  { id: 'larkana', name: 'Larkana', urduName: 'لاڑکانہ', province: 'Sindh', lat: 27.5570, lon: 68.2028, isPopular: true },
  { id: 'nawabshah', name: 'Nawabshah', urduName: 'نواب شاہ (بینظیر آباد)', province: 'Sindh', lat: 26.2483, lon: 68.4096 },
  { id: 'mirpur-khas', name: 'Mirpur Khas', urduName: 'میرپور خاص', province: 'Sindh', lat: 25.5276, lon: 69.0159 },
  { id: 'jacobabad', name: 'Jacobabad', urduName: 'جیکب آباد', province: 'Sindh', lat: 28.2819, lon: 68.4375 },
  { id: 'shikarpur', name: 'Shikarpur', urduName: 'شکارپور', province: 'Sindh', lat: 27.9571, lon: 68.6382 },
  { id: 'khairpur', name: 'Khairpur', urduName: 'خیرپور', province: 'Sindh', lat: 27.5295, lon: 68.7592 },
  { id: 'thatta', name: 'Thatta', urduName: 'ٹھٹہ', province: 'Sindh', lat: 24.7475, lon: 67.9235 },
  { id: 'badin', name: 'Badin', urduName: 'بدین', province: 'Sindh', lat: 24.6560, lon: 68.8370 },
  { id: 'dadu', name: 'Dadu', urduName: 'دادو', province: 'Sindh', lat: 26.7341, lon: 67.7795 },
  { id: 'jamshoro', name: 'Jamshoro', urduName: 'جامشورو', province: 'Sindh', lat: 25.4300, lon: 68.2800 },
  { id: 'ghotki', name: 'Ghotki', urduName: 'گھوٹکی', province: 'Sindh', lat: 28.0060, lon: 69.3160 },
  { id: 'kashmore', name: 'Kashmore', urduName: 'کشمور', province: 'Sindh', lat: 28.4333, lon: 69.5833 },
  { id: 'matiari', name: 'Matiari', urduName: 'مٹیاری', province: 'Sindh', lat: 25.5971, lon: 68.4467 },
  { id: 'tando-allahyar', name: 'Tando Allahyar', urduName: 'ٹنڈو الہ یار', province: 'Sindh', lat: 25.4605, lon: 68.7176 },
  { id: 'tando-muhammad-khan', name: 'Tando Muhammad Khan', urduName: 'ٹنڈو محمد خان', province: 'Sindh', lat: 25.1238, lon: 68.5369 },
  { id: 'sujawal', name: 'Sujawal', urduName: 'سجاول', province: 'Sindh', lat: 24.6044, lon: 68.0778 },
  { id: 'umerkot', name: 'Umerkot', urduName: 'عمرکوٹ', province: 'Sindh', lat: 25.3549, lon: 69.7376 },
  { id: 'mithi', name: 'Mithi (Tharparkar)', urduName: 'مٹھی (تھرپارکر)', province: 'Sindh', lat: 24.7438, lon: 69.8006 },
  { id: 'sanghar', name: 'Sanghar', urduName: 'سانگھڑ', province: 'Sindh', lat: 26.0464, lon: 68.9481 },
  { id: 'naushahro-feroze', name: 'Naushahro Feroze', urduName: 'نوشہرو فیروز', province: 'Sindh', lat: 26.8401, lon: 68.1227 },
  { id: 'qambar', name: 'Qambar Shahdadkot', urduName: 'قمبر شہداد کوٹ', province: 'Sindh', lat: 27.5866, lon: 68.0006 },

  // ===================== KHYBER PAKHTUNKHWA (KP) =====================
  { id: 'peshawar', name: 'Peshawar', urduName: 'پشاور', province: 'Khyber Pakhtunkhwa', lat: 34.0151, lon: 71.5249, isPopular: true },
  { id: 'mardan', name: 'Mardan', urduName: 'مردان', province: 'Khyber Pakhtunkhwa', lat: 34.1989, lon: 72.0404, isPopular: true },
  { id: 'abbottabad', name: 'Abbottabad', urduName: 'ایبٹ آباد', province: 'Khyber Pakhtunkhwa', lat: 34.1688, lon: 73.2215, isPopular: true },
  { id: 'swat', name: 'Swat (Mingora)', urduName: 'سوات (مینگورہ)', province: 'Khyber Pakhtunkhwa', lat: 35.2227, lon: 72.4258, isPopular: true },
  { id: 'd-i-khan', name: 'D.I. Khan', urduName: 'ڈیرہ اسماعیل خان', province: 'Khyber Pakhtunkhwa', lat: 31.8327, lon: 70.9024 },
  { id: 'kohat', name: 'Kohat', urduName: 'کوہاٹ', province: 'Khyber Pakhtunkhwa', lat: 33.5869, lon: 71.4414 },
  { id: 'bannu', name: 'Bannu', urduName: 'بنوں', province: 'Khyber Pakhtunkhwa', lat: 32.9861, lon: 70.6042 },
  { id: 'haripur', name: 'Haripur', urduName: 'ہری پور', province: 'Khyber Pakhtunkhwa', lat: 33.9999, lon: 72.9341 },
  { id: 'mansehra', name: 'Mansehra', urduName: 'مانسہرہ', province: 'Khyber Pakhtunkhwa', lat: 34.3333, lon: 73.2000 },
  { id: 'charsadda', name: 'Charsadda', urduName: 'چارسدہ', province: 'Khyber Pakhtunkhwa', lat: 34.1482, lon: 71.7406 },
  { id: 'swabi', name: 'Swabi', urduName: 'صوابی', province: 'Khyber Pakhtunkhwa', lat: 34.1202, lon: 72.4700 },
  { id: 'nowshera', name: 'Nowshera', urduName: 'نوشہرہ', province: 'Khyber Pakhtunkhwa', lat: 34.0153, lon: 71.9747 },
  { id: 'malakand', name: 'Malakand', urduName: 'مالاکنڈ', province: 'Khyber Pakhtunkhwa', lat: 34.5656, lon: 71.9304 },
  { id: 'dir', name: 'Dir (Upper & Lower)', urduName: 'دیر', province: 'Khyber Pakhtunkhwa', lat: 35.2074, lon: 71.8764 },
  { id: 'chitral', name: 'Chitral', urduName: 'چترال', province: 'Khyber Pakhtunkhwa', lat: 35.8510, lon: 71.7864 },
  { id: 'kohistan', name: 'Kohistan', urduName: 'کوہستان', province: 'Khyber Pakhtunkhwa', lat: 35.2570, lon: 73.3410 },
  { id: 'buner', name: 'Buner', urduName: 'بونیر', province: 'Khyber Pakhtunkhwa', lat: 34.3942, lon: 72.6150 },
  { id: 'shangla', name: 'Shangla', urduName: 'شانگلہ', province: 'Khyber Pakhtunkhwa', lat: 34.8872, lon: 72.7570 },
  { id: 'battagram', name: 'Battagram', urduName: 'بٹگرام', province: 'Khyber Pakhtunkhwa', lat: 34.6772, lon: 73.0233 },
  { id: 'karak', name: 'Karak', urduName: 'کرک', province: 'Khyber Pakhtunkhwa', lat: 33.1114, lon: 71.0917 },
  { id: 'lakki-marwat', name: 'Lakki Marwat', urduName: 'لکی مروت', province: 'Khyber Pakhtunkhwa', lat: 32.6072, lon: 70.9114 },
  { id: 'tank', name: 'Tank', urduName: 'ٹانک', province: 'Khyber Pakhtunkhwa', lat: 32.2217, lon: 70.3792 },
  { id: 'bajaur', name: 'Bajaur', urduName: 'باجوڑ', province: 'Khyber Pakhtunkhwa', lat: 34.7865, lon: 71.5249 },
  { id: 'kurram', name: 'Kurram (Parachinar)', urduName: 'کرم (پاراچنار)', province: 'Khyber Pakhtunkhwa', lat: 33.8992, lon: 70.1008 },
  { id: 'north-waziristan', name: 'North Waziristan (Miranshah)', urduName: 'شمالی وزیرستان (میران شاہ)', province: 'Khyber Pakhtunkhwa', lat: 32.9990, lon: 70.0710 },
  { id: 'south-waziristan', name: 'South Waziristan (Wana)', urduName: 'جنوبی وزیرستان (وانا)', province: 'Khyber Pakhtunkhwa', lat: 32.2989, lon: 69.5725 },

  // ===================== BALOCHISTAN =====================
  { id: 'quetta', name: 'Quetta', urduName: 'کوئٹہ', province: 'Balochistan', lat: 30.1798, lon: 66.9750, isPopular: true },
  { id: 'gwadar', name: 'Gwadar', urduName: 'گوادر', province: 'Balochistan', lat: 25.1216, lon: 62.3254, isPopular: true },
  { id: 'turbat', name: 'Turbat (Kech)', urduName: 'تربت (کیچ)', province: 'Balochistan', lat: 26.0031, lon: 63.0544, isPopular: true },
  { id: 'khuzdar', name: 'Khuzdar', urduName: 'خضدار', province: 'Balochistan', lat: 27.8115, lon: 66.6186 },
  { id: 'hub', name: 'Hub', urduName: 'حب', province: 'Balochistan', lat: 25.0298, lon: 66.8833 },
  { id: 'sibi', name: 'Sibi', urduName: 'سبی', province: 'Balochistan', lat: 29.5448, lon: 67.8764 },
  { id: 'zhob', name: 'Zhob', urduName: 'ژوب', province: 'Balochistan', lat: 31.3417, lon: 69.4486 },
  { id: 'chaman', name: 'Chaman', urduName: 'چمن', province: 'Balochistan', lat: 30.9236, lon: 66.4512 },
  { id: 'loralai', name: 'Loralai', urduName: 'لورالائی', province: 'Balochistan', lat: 30.3705, lon: 68.5979 },
  { id: 'kalat', name: 'Kalat', urduName: 'قلات', province: 'Balochistan', lat: 29.0225, lon: 66.5916 },
  { id: 'pishin', name: 'Pishin', urduName: 'پشین', province: 'Balochistan', lat: 30.5803, lon: 66.9961 },
  { id: 'mastung', name: 'Mastung', urduName: 'مستونگ', province: 'Balochistan', lat: 29.7997, lon: 66.8455 },
  { id: 'jaffarabad', name: 'Jaffarabad', urduName: 'جعفر آباد', province: 'Balochistan', lat: 28.4310, lon: 68.2410 },
  { id: 'nasirabad', name: 'Nasirabad', urduName: 'نصیر آباد', province: 'Balochistan', lat: 28.5800, lon: 68.1700 },
  { id: 'ziarat', name: 'Ziarat', urduName: 'زیارت', province: 'Balochistan', lat: 30.3824, lon: 67.7256 },
  { id: 'dera-bugti', name: 'Dera Bugti', urduName: 'ڈیرہ بگٹی', province: 'Balochistan', lat: 29.0304, lon: 69.1585 },
  { id: 'kohlu', name: 'Kohlu', urduName: 'کوہلو', province: 'Balochistan', lat: 29.8965, lon: 69.2532 },
  { id: 'panjgur', name: 'Panjgur', urduName: 'پنجگور', province: 'Balochistan', lat: 26.9644, lon: 64.0903 },
  { id: 'chagai', name: 'Chagai (Dalbandin)', urduName: 'چاغی (دالبندین)', province: 'Balochistan', lat: 28.8885, lon: 64.4062 },
  { id: 'lasbela', name: 'Lasbela (Uthal)', urduName: 'لسبیلہ (اوتھل)', province: 'Balochistan', lat: 25.8072, lon: 66.6219 },

  // ===================== AZAD JAMMU & KASHMIR (AJK) =====================
  { id: 'muzaffarabad', name: 'Muzaffarabad', urduName: 'مظفر آباد', province: 'Azad Kashmir', lat: 34.3595, lon: 73.4708, isPopular: true },
  { id: 'mirpur-ajk', name: 'Mirpur (AJK)', urduName: 'میرپور (آزاد کشمیر)', province: 'Azad Kashmir', lat: 33.1484, lon: 73.7519, isPopular: true },
  { id: 'rawalakot', name: 'Rawalakot (Poonch)', urduName: 'راولاکوٹ (پونچھ)', province: 'Azad Kashmir', lat: 33.8584, lon: 73.7604 },
  { id: 'kotli', name: 'Kotli', urduName: 'کوٹلی', province: 'Azad Kashmir', lat: 33.5156, lon: 73.9019 },
  { id: 'bhimber', name: 'Bhimber', urduName: 'بھمبر', province: 'Azad Kashmir', lat: 32.9747, lon: 74.0786 },
  { id: 'bagh', name: 'Bagh', urduName: 'باغ', province: 'Azad Kashmir', lat: 33.9803, lon: 73.7753 },
  { id: 'neelum', name: 'Neelum (Athmuqam)', urduName: 'وادی نیلم (آٹھمقام)', province: 'Azad Kashmir', lat: 34.5878, lon: 73.9072 },
  { id: 'palandri', name: 'Sudhnuti (Palandri)', urduName: 'پلندری (سدھنوتی)', province: 'Azad Kashmir', lat: 33.7126, lon: 73.6887 },

  // ===================== GILGIT-BALTISTAN (GB) =====================
  { id: 'gilgit', name: 'Gilgit', urduName: 'گلگت', province: 'Gilgit-Baltistan', lat: 35.9221, lon: 74.3087, isPopular: true },
  { id: 'skardu', name: 'Skardu', urduName: 'سکردو', province: 'Gilgit-Baltistan', lat: 35.2971, lon: 75.6333, isPopular: true },
  { id: 'hunza', name: 'Hunza (Karimabad)', urduName: 'ہنزہ (کریم آباد)', province: 'Gilgit-Baltistan', lat: 36.3167, lon: 74.6500, isPopular: true },
  { id: 'chilas', name: 'Chilas (Diamer)', urduName: 'چلاس (دیامر)', province: 'Gilgit-Baltistan', lat: 35.4194, lon: 74.0958 },
  { id: 'astore', name: 'Astore', urduName: 'استور', province: 'Gilgit-Baltistan', lat: 35.3667, lon: 74.8500 },
  { id: 'ghizer', name: 'Ghizer (Gahkuch)', urduName: 'غذر (گہکوچ)', province: 'Gilgit-Baltistan', lat: 36.1736, lon: 73.7667 },
  { id: 'nagar', name: 'Nagar', urduName: 'نگر', province: 'Gilgit-Baltistan', lat: 36.2500, lon: 74.7000 },
  { id: 'shigar', name: 'Shigar', urduName: 'شگر', province: 'Gilgit-Baltistan', lat: 35.4278, lon: 75.7278 },
  { id: 'ghanche', name: 'Ghanche (Khaplu)', urduName: 'گانچھے (خپلو)', province: 'Gilgit-Baltistan', lat: 35.1611, lon: 76.3333 },
];

/**
 * Fast normalize helper for search inputs (strips dashes, spaces, punctuation)
 */
function normalizeStr(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Find city coordinates by name (fuzzy matching + aliases)
 */
export function findPakistanCity(query: string): PakistanCity | undefined {
  if (!query) return undefined;
  const clean = query.trim().toLowerCase();
  const normalized = normalizeStr(clean);

  // Exact ID or Name match
  let found = PAKISTAN_CITIES.find(
    (c) => c.id === clean || c.name.toLowerCase() === clean || c.urduName === query.trim()
  );
  if (found) return found;

  // Normalized alphanumeric match
  found = PAKISTAN_CITIES.find((c) => normalizeStr(c.name) === normalized || normalizeStr(c.id) === normalized);
  if (found) return found;

  // Partial substring match
  found = PAKISTAN_CITIES.find(
    (c) =>
      clean.includes(c.name.toLowerCase()) ||
      c.name.toLowerCase().includes(clean) ||
      clean.includes(c.id) ||
      (c.urduName && query.includes(c.urduName))
  );
  return found;
}

/**
 * Export a coordinates lookup record map
 */
export const PAKISTAN_COORDINATES_MAP: Record<string, { lat: number; lon: number; name: string; province: string }> =
  PAKISTAN_CITIES.reduce((acc, city) => {
    acc[city.id] = { lat: city.lat, lon: city.lon, name: city.name, province: city.province };
    acc[city.name.toLowerCase()] = { lat: city.lat, lon: city.lon, name: city.name, province: city.province };
    return acc;
  }, {} as Record<string, { lat: number; lon: number; name: string; province: string }>);
