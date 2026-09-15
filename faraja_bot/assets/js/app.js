const state = {
  category: '',
  subtype: '',
  form: {},
  formStep: 0,
  location: {},
  time: {},
  documents: []
};

let reportMap = null;
let marker = null;
let locationRequestSequence = 0;

const forms = {};

const CATEGORY_ALIASES = Object.freeze({
  'فرد': 'افراد',
  'ملک': 'املاک',
  'شیء': 'اشیاء',
  'پدیده اجتماعی': 'رویداد'
});

function canonicalCategory(category) {
  return CATEGORY_ALIASES[category] || category;
}

const STANDARD_REPORT_STEPS = Object.freeze(['فرم', 'زمان', 'مکان', 'مستندات']);
const PEOPLE_REPORT_STEPS = Object.freeze([
  'اطلاعات شناسایی',
  'زمان وقوع',
  'مکان وقوع',
  'گزارش وقوع',
  'مستندات'
]);

const DRAFT_STORAGE_KEY = 'faraja-report-draft-v1';
const DRAFT_VERSION = 2;
const REPORT_CATEGORIES = new Set(['افراد', 'املاک', 'اشیاء', 'رویداد']);
const RESTORABLE_PAGE_IDS = new Set([
  'homePage',
  'locationRegistrationPage',
  'categoryPage',
  'objectTypePage',
  'phenomenonTypePage',
  'formPage',
  'timePage',
  'locationPage',
  'incidentReportPage',
  'documentsPage'
]);

let timeDraft = null;
let isRestoringDraft = false;
let hasSubmittedReport = false;

const SOCIAL_PLATFORMS = Object.freeze([
  { id: 'telegram', name: 'تلگرام', prefix: 't.me/', aliases: ['t.me', 'telegram.me', 'telegram.com'], search: 'تلگرام telegram' },
  { id: 'instagram', name: 'اینستاگرام', prefix: 'instagram.com/', aliases: ['instagram.com'], search: 'اینستاگرام instagram' },
  { id: 'x', name: 'ایکس', prefix: 'x.com/', aliases: ['x.com', 'twitter.com'], search: 'ایکس x twitter توییتر' },
  { id: 'whatsapp', name: 'واتس‌اپ', prefix: 'wa.me/', aliases: ['wa.me', 'whatsapp.com'], search: 'واتس اپ whatsapp' },
  { id: 'youtube', name: 'یوتیوب', prefix: 'youtube.com/', aliases: ['youtube.com', 'youtu.be'], search: 'یوتیوب youtube' },
  { id: 'facebook', name: 'فیسبوک', prefix: 'facebook.com/', aliases: ['facebook.com', 'fb.com'], search: 'فیسبوک facebook fb' },
  { id: 'linkedin', name: 'لینکدین', prefix: 'linkedin.com/', aliases: ['linkedin.com'], search: 'لینکدین linkedin' },
  { id: 'github', name: 'گیت‌هاب', prefix: 'github.com/', aliases: ['github.com'], search: 'گیت هاب github' },
  { id: 'tiktok', name: 'تیک‌تاک', prefix: 'tiktok.com/@', aliases: ['tiktok.com'], search: 'تیک تاک tiktok' },
  { id: 'threads', name: 'تردز', prefix: 'threads.net/@', aliases: ['threads.net'], search: 'تردز threads' },
  { id: 'discord', name: 'دیسکورد', prefix: 'discord.gg/', aliases: ['discord.gg', 'discord.com'], search: 'دیسکورد discord' },
  { id: 'eitaa', name: 'ایتا', prefix: 'eitaa.com/', aliases: ['eitaa.com'], search: 'ایتا eitaa' },
  { id: 'bale', name: 'بله', prefix: 'ble.ir/', aliases: ['ble.ir', 'bale.ai'], search: 'بله bale ble' },
  { id: 'soroush', name: 'سروش‌پلاس', prefix: 'splus.ir/', aliases: ['splus.ir', 'soroushplus.ir'], search: 'سروش پلاس soroush splus' },
  { id: 'rubika', name: 'روبیکا', prefix: 'rubika.ir/', aliases: ['rubika.ir'], search: 'روبیکا rubika' },
  { id: 'igap', name: 'آی‌گپ', prefix: 'igap.net/', aliases: ['igap.net'], search: 'ای گپ آی گپ igap' },
  { id: 'gap', name: 'گپ', prefix: 'gap.im/', aliases: ['gap.im'], search: 'گپ gap' },
  { id: 'virasty', name: 'ویراستی', prefix: 'virasty.com/', aliases: ['virasty.com'], search: 'ویراستی virasty' },
  { id: 'aparat', name: 'آپارات', prefix: 'aparat.com/', aliases: ['aparat.com'], search: 'آپارات aparat' }
]);
const SOCIAL_PLATFORM_BY_ID = new Map(SOCIAL_PLATFORMS.map(platform => [platform.id, platform]));

const SOCIAL_LOGO_FILES = Object.freeze({
  telegram: 'telegram.svg',
  instagram: 'instagram.svg',
  x: 'x.svg',
  whatsapp: 'whatsapp.svg',
  youtube: 'youtube.svg',
  facebook: 'facebook.svg',
  linkedin: 'linkedin.svg',
  github: 'github.svg',
  tiktok: 'tiktok.svg',
  threads: 'threads.svg',
  discord: 'discord.svg',
  eitaa: 'eitaa.svg',
  bale: 'bale.svg',
  soroush: 'soroush.png',
  rubika: 'rubika.png',
  igap: 'igap.png',
  gap: 'gap.png',
  virasty: 'virasty.png',
  aparat: 'aparat.svg'
});

let socialLinkRowSequence = 0;

function renderReportRoadmaps() {
  const isPeopleReport = state.category === 'افراد';
  const steps = isPeopleReport ? PEOPLE_REPORT_STEPS : STANDARD_REPORT_STEPS;
  const stepAttribute = isPeopleReport ? 'peopleStep' : 'standardStep';
  const signature = steps.join('|');

  document.querySelectorAll('[data-report-roadmap]').forEach(stepper => {
    const activeStep = Number(stepper.dataset[stepAttribute]);
    stepper.classList.toggle('report-stepper--people', isPeopleReport);
    stepper.classList.remove('roadmap-ready');

    if (stepper.dataset.roadmapSteps !== signature) {
      stepper.innerHTML = steps.map((label, index) => {
        const connector = index < steps.length - 1 ? '<i aria-hidden="true"></i>' : '';
        return `<span>${label}</span>${connector}`;
      }).join('');
      stepper.dataset.roadmapSteps = signature;
    }

    stepper.querySelectorAll('span').forEach((item, index) => {
      const isDone = index < activeStep;
      const isActive = index === activeStep;
      item.classList.toggle('done', isDone);
      item.classList.toggle('active', isActive);
      if (isActive) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
    stepper.querySelectorAll('i').forEach((connector, index) => {
      connector.classList.toggle('done', index < activeStep);
    });

    // Force the compact roadmap to transition from its neutral state when the page changes.
    void stepper.offsetWidth;
    stepper.classList.add('roadmap-ready');
  });
}

function revealActiveRoadmap(page) {
  if (!page || typeof page.querySelector !== 'function') return;
  const roadmap = page.querySelector('.report-stepper--people');
  if (!roadmap || roadmap.scrollWidth <= roadmap.clientWidth) return;
  const activeStep = roadmap.querySelector('span.active');
  if (!activeStep || typeof activeStep.scrollIntoView !== 'function') return;

  const reduceMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  activeStep.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
}

function iconMarkup(name, className = 'button-icon') {
  return `<svg xmlns="http://www.w3.org/2000/svg" class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#icon-${name}"></use></svg>`;
}

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const EN_DIGITS = '0123456789';
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';

function faDigits(value) {
  return String(value ?? '')
    .replace(/[0-9]/g, digit => FA_DIGITS[Number(digit)])
    .replace(/[٠-٩]/g, digit => FA_DIGITS[AR_DIGITS.indexOf(digit)]);
}

function enDigits(value) {
  return String(value ?? '')
    .replace(/[۰-۹]/g, digit => EN_DIGITS[FA_DIGITS.indexOf(digit)])
    .replace(/[٠-٩]/g, digit => EN_DIGITS[AR_DIGITS.indexOf(digit)]);
}

function isPlainRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readFieldValue(id) {
  const element = document.getElementById(id);
  return element && typeof element.value === 'string' ? element.value : '';
}

function captureTimeDraft() {
  timeDraft = {
    day: readFieldValue('dateDay'),
    month: readFieldValue('dateMonth'),
    year: readFieldValue('dateYear'),
    clock: readFieldValue('timeClock'),
    approximate: readFieldValue('approxText')
  };
}

function captureLocationDraft() {
  const location = { ...state.location };
  const province = document.getElementById('province');
  const city = document.getElementById('city');
  const address = document.getElementById('address');

  if (province && province.value.trim()) location.province = province.value.trim();
  else delete location.province;
  if (city && city.value.trim()) location.city = city.value.trim();
  else delete location.city;
  if (address && address.value.trim()) location.address = address.value.trim();
  else delete location.address;
  state.location = location;
}

function getDraftStorage() {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch (error) {
    return null;
  }
}

function activePageId() {
  const activePage = document.querySelector('.page.active');
  return activePage && RESTORABLE_PAGE_IDS.has(activePage.id) ? activePage.id : 'homePage';
}

function capturePageDraft(pageId) {
  if (pageId === 'formPage' || pageId === 'incidentReportPage') collectForm();
  if (pageId === 'timePage') captureTimeDraft();
  if (pageId === 'locationPage') captureLocationDraft();
}

function persistReportDraft(pageId = activePageId()) {
  if (isRestoringDraft || hasSubmittedReport) return;
  const storage = getDraftStorage();
  if (!storage) return;

  const savedPage = RESTORABLE_PAGE_IDS.has(pageId) ? pageId : 'homePage';
  capturePageDraft(savedPage);

  const snapshot = {
    version: DRAFT_VERSION,
    page: savedPage,
    state: {
      category: state.category,
      subtype: state.subtype,
      form: state.form,
      formStep: state.formStep,
      location: state.location,
      time: state.time
    },
    timeDraft
  };

  try {
    // فایل‌های انتخاب‌شده به‌علت محدودیت ظرفیت localStorage ذخیره نمی‌شوند.
    storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    // ذخیره‌سازی مرورگر ممکن است در حالت خصوصی یا فضای پرشده در دسترس نباشد.
  }
}

function clearReportDraft() {
  const storage = getDraftStorage();
  if (!storage) return;
  try {
    storage.removeItem(DRAFT_STORAGE_KEY);
  } catch (error) {
    // نبودن دسترسی به localStorage نباید روند گزارش را متوقف کند.
  }
}

function restoredTimeDraft(value) {
  if (!isPlainRecord(value)) return null;
  return {
    day: typeof value.day === 'string' ? value.day : '',
    month: typeof value.month === 'string' ? value.month : '',
    year: typeof value.year === 'string' ? value.year : '',
    clock: typeof value.clock === 'string' ? value.clock : '',
    approximate: typeof value.approximate === 'string' ? value.approximate : ''
  };
}

function restoreReportDraft() {
  const storage = getDraftStorage();
  if (!storage) return false;

  let snapshot;
  try {
    const raw = storage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return false;
    snapshot = JSON.parse(raw);
  } catch (error) {
    clearReportDraft();
    return false;
  }

  if (!isPlainRecord(snapshot) || snapshot.version !== DRAFT_VERSION || !isPlainRecord(snapshot.state)) {
    clearReportDraft();
    return false;
  }

  const savedState = snapshot.state;
  const category = canonicalCategory(typeof savedState.category === 'string' ? savedState.category : '');
  state.category = REPORT_CATEGORIES.has(category) ? category : '';
  state.subtype = typeof savedState.subtype === 'string' ? savedState.subtype : '';
  state.form = isPlainRecord(savedState.form) ? { ...savedState.form } : {};
  state.formStep = Number.isInteger(savedState.formStep) && savedState.formStep >= 0 ? savedState.formStep : 0;
  state.location = isPlainRecord(savedState.location) ? { ...savedState.location } : {};
  state.time = isPlainRecord(savedState.time) ? { ...savedState.time } : {};
  state.documents = [];
  timeDraft = restoredTimeDraft(snapshot.timeDraft);

  let pageId = typeof snapshot.page === 'string' && RESTORABLE_PAGE_IDS.has(snapshot.page) ? snapshot.page : 'homePage';
  const needsCategory = new Set(['objectTypePage', 'phenomenonTypePage', 'formPage', 'timePage', 'locationPage', 'incidentReportPage', 'documentsPage']);
  if (needsCategory.has(pageId) && !state.category) pageId = 'categoryPage';
  if (pageId === 'objectTypePage' && state.category !== 'اشیاء') pageId = 'categoryPage';
  if (pageId === 'phenomenonTypePage' && state.category !== 'رویداد') pageId = 'categoryPage';
  if (pageId === 'incidentReportPage' && state.category !== 'افراد') pageId = 'locationPage';

  isRestoringDraft = true;
  try {
    if (pageId === 'formPage') openForm();
    else if (pageId === 'timePage') openTime();
    else if (pageId === 'locationPage') openLocation();
    else if (pageId === 'incidentReportPage') openIncidentReport();
    else if (pageId === 'documentsPage') openDocuments();
    else showPage(pageId);
  } finally {
    isRestoringDraft = false;
  }

  persistReportDraft(pageId);
  return true;
}

function normalizeFieldValue(element) {
  if (element.type === 'file' || element.dataset.socialLinkValue !== undefined) return;
  let value = element.type === 'email' || element.dataset.preserveLatin === 'true' ? String(element.value) : faDigits(element.value);

  if (element.dataset.numeric === 'true') {
    value = value.replace(/[^۰-۹]/g, '');
    const maxLength = Number(element.getAttribute('maxlength'));
    if (Number.isInteger(maxLength) && maxLength > 0) value = value.slice(0, maxLength);

    const maxValue = Number(element.dataset.maxValue);
    const numberValue = Number(enDigits(value));
    if (Number.isFinite(maxValue) && value && Number.isFinite(numberValue) && numberValue > maxValue) {
      value = faDigits(maxValue);
    }
  }

  if (element.dataset.textOnly === 'true') {
    value = value.replace(/[0-9۰-۹٠-٩]/g, '');
  }

  element.value = value;
}

function resizeTextarea(textarea) {
  if (!textarea.matches('#formBody textarea[data-auto-resize="true"], #incidentReportBody textarea[data-auto-resize="true"], #locationPage textarea[data-auto-resize="true"]')) return;
  const maxHeight = 280;
  textarea.style.height = 'auto';
  const height = Math.min(Math.max(textarea.scrollHeight, 52), maxHeight);
  textarea.style.height = `${height}px`;
  textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
}

function normalizeVisibleNumbers() {
  document.querySelectorAll('body *').forEach(el => {
    const keepsLatin = typeof el.closest === 'function' && el.closest('[data-preserve-latin="true"]');
    if (!keepsLatin && el.children.length === 0 && el.textContent.trim()) {
      el.textContent = faDigits(el.textContent);
    }
  });
  document.querySelectorAll('input, textarea').forEach(el => {
    if (el.value) normalizeFieldValue(el);
    resizeTextarea(el);
  });
}

document.addEventListener('input', event => {
  const target = event.target;
  if (!target || typeof target.matches !== 'function') return;
  if (target.matches('.social-platform-search')) {
    filterSocialPlatforms(target);
    return;
  }
  if (target.matches('.searchable-select-search')) {
    filterSearchableSelect(target);
    return;
  }
  if (target.matches('[data-social-link-value]')) {
    persistReportDraft();
    return;
  }
  if (target.matches('[data-vehicle-plate-input]')) {
    normalizeVehiclePlateInput(target);
    syncVehiclePlatePreview(target);
    persistReportDraft();
    return;
  }
  if (target.matches('input, textarea')) {
    normalizeFieldValue(target);
    resizeTextarea(target);
    persistReportDraft();
  }
});

document.addEventListener('click', event => {
  const target = event.target;
  if (!target || typeof target.closest !== 'function') return;
  if (target.closest('[data-social-links], [data-searchable-select]')) return;
  closeSocialPlatformMenus();
  closeSearchableSelects();
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeSocialPlatformMenus();
    closeSearchableSelects();
  }
});

if (typeof window.addEventListener === 'function') {
  window.addEventListener('pagehide', () => persistReportDraft());
}

function showPage(id) {
  const page = document.getElementById(id);
  if (!page) return;
  persistReportDraft();
  document.querySelectorAll('.page').forEach(item => item.classList.remove('active'));
  page.classList.add('active');
  renderReportRoadmaps();
  persistReportDraft(id);
  const revealRoadmap = () => revealActiveRoadmap(page);
  if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(revealRoadmap);
  else setTimeout(revealRoadmap, 0);
  window.scrollTo({ top: 0, behavior: 'instant' });
  setTimeout(normalizeVisibleNumbers, 0);
}

function resetReport() {
  state.category = '';
  state.subtype = '';
  state.form = {};
  state.formStep = 0;
  state.location = {};
  state.time = {};
  state.documents = [];
  timeDraft = null;
  hasSubmittedReport = false;
  locationRequestSequence += 1;
  clearLocationMarker();
  if (reportMap && typeof reportMap.remove === 'function') reportMap.remove();
  reportMap = null;
}

function startReport() {
  resetReport();
  clearReportDraft();
  showPage('categoryPage');
}

function openLocationRegistration() {
  showPage('locationRegistrationPage');
}

function chooseCategory(category) {
  category = canonicalCategory(category);
  if (!REPORT_CATEGORIES.has(category)) return showPage('categoryPage');
  state.category = category;
  state.subtype = '';
  state.form = {};
  state.formStep = 0;
  if (category === 'اشیاء') return showPage('objectTypePage');
  if (category === 'رویداد') return showPage('phenomenonTypePage');
  openForm();
}

function chooseSubtype(subtype) {
  state.subtype = subtype;
  state.form = {};
  state.formStep = 0;
  openForm();
}

function field(name, label, type = 'text', options = {}) {
  const numeric = options.numeric ? 'numeric' : '';
  const textOnly = options.textOnly ? 'text-only' : '';
  const maxLength = options.maxLength ? ` maxlength="${options.maxLength}"` : '';
  const maxValue = Number.isFinite(options.maxValue) ? ` data-max-value="${options.maxValue}"` : '';
  const placeholder = options.placeholder ? ` placeholder="${options.placeholder}"` : '';
  const validation = options.validation ? ` data-validation="${options.validation}"` : '';
  const numericRule = options.numeric ? ' data-numeric="true"' : '';
  const textRule = options.textOnly ? ' data-text-only="true"' : '';
  const direction = options.ltr ? ' dir="ltr"' : '';
  const preserveLatin = options.preserveLatin ? ' data-preserve-latin="true"' : '';
  const inputMode = options.numeric ? 'numeric' : type === 'email' ? 'email' : 'text';
  const attributes = `data-field="${name}" data-label="${label}"${numericRule}${textRule}${validation}${maxLength}${maxValue}${placeholder}${direction}${preserveLatin}`;

  if (type === 'textarea') {
    return `<div class="field-group"><label>${label}</label><textarea class="field-textarea ${numeric} ${textOnly}" ${attributes} data-auto-resize="true"></textarea></div>`;
  }
  return `<div class="field-group"><label>${label}</label><input class="field-input ${numeric} ${textOnly}" ${attributes} type="${type}" inputmode="${inputMode}"></div>`;
}

function choices(name, label, items, options = {}) {
  const columns = options.columns === 3 ? ' choice-row--three' : '';
  return `<div class="field-group"><label>${label}</label><div class="choice-row${columns}" data-choice="${name}">${items.map(item => `<button type="button" class="choice-btn" onclick="pickChoice(this,'${name}','${item.replace(/'/g, "\\'")}')">${item}</button>`).join('')}</div></div>`;
}

function yesNo(name, label) {
  return choices(name, label, ['بله', 'خیر', 'نامشخص'], { columns: 3 });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

const MAX_DOCUMENTS = 10;
const MAX_DOCUMENT_BYTES = 100 * 1024 * 1024;
const MAX_VEHICLES = 10;

const VEHICLE_KIND_OPTIONS = Object.freeze([
  { value: 'خودرو', label: 'خودرو', search: 'خودرو سواری وانت کامیون اتوبوس' },
  { value: 'موتورسیکلت', label: 'موتورسیکلت', search: 'موتور موتور سیکلت' }
]);

// Persian labels, colors, letters, and plate structures mirror the active Iranian formats.
// The blue country band is rendered for every format, including motorcycle and transit plates.
const VEHICLE_PLATE_TEMPLATES = Object.freeze([
  { id: 'private', label: 'پلاک شخصی / ملی', search: 'ملی شخصی سواری خودرو ب ج د س ص ط ق ل م ن و ه ی', layout: 'national', tone: 'light', vehicleKinds: ['خودرو'] },
  { id: 'disabled', label: 'معلولین و جانبازان', search: 'معلولین جانبازان ژ ویلچر', layout: 'national', tone: 'light', fixedLetter: 'ژ', vehicleKinds: ['خودرو'] },
  { id: 'taxi', label: 'تاکسی', search: 'تاکسی ت عمومی زرد', layout: 'national', tone: 'yellow', fixedLetter: 'ت', vehicleKinds: ['خودرو'] },
  { id: 'public', label: 'خودروی عمومی', search: 'عمومی ع اتوبوس مینی بوس کامیون زرد', layout: 'national', tone: 'yellow', fixedLetter: 'ع', vehicleKinds: ['خودرو'] },
  { id: 'government', label: 'دولتی', search: 'دولتی اداری الف قرمز', layout: 'national', tone: 'red', fixedLetter: 'الف', vehicleKinds: ['خودرو'] },
  { id: 'police', label: 'نیروی انتظامی', search: 'پلیس انتظامی پ سبز', layout: 'national', tone: 'green', fixedLetter: 'پ', vehicleKinds: ['خودرو'] },
  { id: 'irgc', label: 'سپاه پاسداران', search: 'سپاه پاسداران ث سبز', layout: 'national', tone: 'green', fixedLetter: 'ث', vehicleKinds: ['خودرو'] },
  { id: 'army', label: 'ارتش', search: 'ارتش ش خاکی', layout: 'national', tone: 'khaki', fixedLetter: 'ش', vehicleKinds: ['خودرو'] },
  { id: 'armed-forces', label: 'ستاد کل نیروهای مسلح', search: 'نیروهای مسلح ستاد کل ف آبی', layout: 'national', tone: 'blue', fixedLetter: 'ف', vehicleKinds: ['خودرو'] },
  { id: 'defense', label: 'وزارت دفاع', search: 'دفاع ز آبی', layout: 'national', tone: 'blue', fixedLetter: 'ز', vehicleKinds: ['خودرو'] },
  { id: 'agricultural', label: 'ادوات کشاورزی', search: 'کشاورزی ک ماشین آلات زرد', layout: 'national', tone: 'yellow', fixedLetter: 'ک', vehicleKinds: ['خودرو'] },
  { id: 'temporary-persian', label: 'گذر موقت (گ)', search: 'گذر موقت گ سفید', layout: 'national', tone: 'light', fixedLetter: 'گ', vehicleKinds: ['خودرو'] },
  { id: 'temporary-latin', label: 'گذر موقت جدید (لاتین)', search: 'گذر موقت جدید انگلیسی لاتین temporary transit international', layout: 'latin', tone: 'light', vehicleKinds: ['خودرو'] },
  { id: 'diplomatic', label: 'دیپلماتیک (D)', search: 'دیپلماتیک سفارت انگلیسی D آبی', layout: 'national', tone: 'blue', fixedLetter: 'D', preserveLetter: true, vehicleKinds: ['خودرو'] },
  { id: 'service', label: 'خدمات سفارت (S)', search: 'سرویس خدمت سفارت انگلیسی S آبی', layout: 'national', tone: 'blue', fixedLetter: 'S', preserveLetter: true, vehicleKinds: ['خودرو'] },
  { id: 'protocol', label: 'تشریفات / PROTOCOL', search: 'تشریفات protocol قرمز', layout: 'protocol', tone: 'red', vehicleKinds: ['خودرو'] },
  { id: 'free-zone', label: 'منطقه آزاد تجاری', search: 'منطقه آزاد تجاری free zone', layout: 'free-zone', tone: 'light', vehicleKinds: ['خودرو'] },
  { id: 'historical', label: 'خودروی تاریخی', search: 'تاریخی کلاسیک قهوه ای', layout: 'historical', tone: 'brown', vehicleKinds: ['خودرو'] },
  { id: 'motorcycle', label: 'پلاک موتورسیکلت', search: 'موتور موتورسیکلت', layout: 'motorcycle', tone: 'light', vehicleKinds: ['موتورسیکلت'] }
]);

function searchableSelectOptionMarkup(item, selectedValue = '') {
  const value = String(item.value ?? item.id ?? '');
  const label = String(item.label ?? item.name ?? value);
  const search = String(item.search ?? `${label} ${value}`);
  const preview = item.preview ? `<span class="searchable-select-option-preview">${item.preview}</span>` : '';
  const detail = item.detail ? `<span class="searchable-select-option-detail">${escapeHtml(item.detail)}</span>` : '';
  const selected = value === String(selectedValue ?? '');
  return `<button type="button" class="searchable-select-option${item.optionClass ? ` ${item.optionClass}` : ''}" role="option" data-searchable-select-option data-value="${escapeHtml(value)}" data-search="${escapeHtml(search)}" aria-selected="${selected ? 'true' : 'false'}" onclick="selectSearchableSelectOption(this)">${preview}<span class="searchable-select-option-copy"><span class="searchable-select-option-name">${escapeHtml(label)}</span>${detail}</span></button>`;
}

function searchableSelectMarkup(name, label, items, options = {}) {
  const value = String(options.value ?? '');
  const selected = items.find(item => String(item.value ?? item.id ?? '') === value);
  const selectedLabel = selected ? String(selected.label ?? selected.name ?? selected.value ?? selected.id) : (options.placeholder || 'انتخاب کنید');
  const inputId = options.inputId ? ` id="${escapeHtml(options.inputId)}"` : '';
  const fieldName = options.fieldName ? ` data-field="${escapeHtml(options.fieldName)}" data-label="${escapeHtml(label)}"` : '';
  const isDisabled = Boolean(options.disabled);
  const disabled = isDisabled ? ' disabled' : '';
  const menuId = `searchable-select-menu-${name}`;
  const rootClass = `${options.wrap === false ? '' : 'field-group '}searchable-select-field${options.className ? ` ${options.className}` : ''}`;
  const labelMarkup = label ? `<label>${escapeHtml(label)}</label>` : '';

  return `<div class="${rootClass}" data-searchable-select data-select-name="${escapeHtml(name)}" data-placeholder="${escapeHtml(options.placeholder || 'انتخاب کنید')}">
    ${labelMarkup}
    <input type="hidden"${inputId} data-searchable-select-value${fieldName} value="${escapeHtml(value)}">
    <button type="button" class="searchable-select-trigger button-with-icon" aria-haspopup="listbox" aria-controls="${menuId}" aria-expanded="false" onclick="toggleSearchableSelect(this)"${disabled}><span class="searchable-select-trigger-copy" data-searchable-select-label>${escapeHtml(selectedLabel)}</span>${iconMarkup('chevron-down', 'searchable-select-chevron')}</button>
    <div id="${menuId}" class="searchable-select-menu" role="dialog" aria-label="${escapeHtml(label || 'انتخاب گزینه')}">
      <div class="searchable-select-search-wrap">
        ${iconMarkup('search', 'searchable-select-search-icon')}
        <input type="search" class="searchable-select-search" autocomplete="off" placeholder="جست‌وجو" aria-label="جست‌وجو در گزینه‌ها">
      </div>
      <div class="searchable-select-options" role="listbox" aria-label="${escapeHtml(label || 'گزینه‌ها')}">${items.map(item => searchableSelectOptionMarkup(item, value)).join('')}</div>
    </div>
  </div>`;
}

function searchableSelectValue(component) {
  const input = component && component.querySelector('[data-searchable-select-value]');
  return input ? input.value : '';
}

function searchableSelectOptionForValue(component, value) {
  return Array.from(component ? component.querySelectorAll('[data-searchable-select-option]') : [])
    .find(option => option.dataset.value === String(value ?? '')) || null;
}

function updateSearchableSelectPresentation(component) {
  if (!component) return;
  const input = component.querySelector('[data-searchable-select-value]');
  const trigger = component.querySelector('.searchable-select-trigger');
  const label = component.querySelector('[data-searchable-select-label]');
  const value = input ? input.value : '';
  const selected = searchableSelectOptionForValue(component, value);
  const selectedLabel = selected ? selected.querySelector('.searchable-select-option-name') : null;
  if (label) label.textContent = selectedLabel ? selectedLabel.textContent : (component.dataset.placeholder || 'انتخاب کنید');
  component.classList.toggle('has-value', Boolean(selected));
  component.querySelectorAll('[data-searchable-select-option]').forEach(option => {
    const isSelected = option === selected;
    option.classList.toggle('selected', isSelected);
    option.setAttribute('aria-selected', String(isSelected));
  });
  if (trigger && trigger.disabled) component.classList.add('is-disabled');
  else component.classList.remove('is-disabled');
}

function closeSearchableSelects(except = null) {
  document.querySelectorAll('[data-searchable-select].is-picker-open').forEach(component => {
    if (component === except) return;
    component.classList.remove('is-picker-open');
    const trigger = component.querySelector('.searchable-select-trigger');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  });
}

function toggleSearchableSelect(trigger) {
  const component = trigger.closest('[data-searchable-select]');
  if (!component || trigger.disabled) return;
  const shouldOpen = !component.classList.contains('is-picker-open');
  closeSearchableSelects(component);
  closeSocialPlatformMenus();
  component.classList.toggle('is-picker-open', shouldOpen);
  trigger.setAttribute('aria-expanded', String(shouldOpen));
  if (!shouldOpen) return;
  const search = component.querySelector('.searchable-select-search');
  if (search) {
    search.value = '';
    filterSearchableSelect(search);
    setTimeout(() => search.focus(), 0);
  }
}

function filterSearchableSelect(searchInput) {
  const component = searchInput.closest('[data-searchable-select]');
  if (!component) return;
  const query = normalizedSocialSearch(searchInput.value);
  component.querySelectorAll('[data-searchable-select-option]').forEach(option => {
    option.hidden = Boolean(query) && !normalizedSocialSearch(option.dataset.search).includes(query);
  });
}

function setSearchableSelectItems(component, items, options = {}) {
  if (!component) return;
  const input = component.querySelector('[data-searchable-select-value]');
  const optionsBox = component.querySelector('.searchable-select-options');
  if (!input || !optionsBox) return;
  const nextValue = options.value === undefined ? input.value : String(options.value ?? '');
  input.value = nextValue;
  optionsBox.innerHTML = items.map(item => searchableSelectOptionMarkup(item, nextValue)).join('');
  const trigger = component.querySelector('.searchable-select-trigger');
  if (trigger && options.disabled !== undefined) trigger.disabled = Boolean(options.disabled);
  if (options.placeholder) component.dataset.placeholder = options.placeholder;
  updateSearchableSelectPresentation(component);
}

function selectSearchableSelectOption(option) {
  const component = option.closest('[data-searchable-select]');
  const input = component && component.querySelector('[data-searchable-select-value]');
  if (!component || !input) return;
  input.value = option.dataset.value || '';
  updateSearchableSelectPresentation(component);
  closeSearchableSelects();
  handleSearchableSelectChange(component);
  persistReportDraft();
}

function handleSearchableSelectChange(component) {
  const name = component.dataset.selectName;
  if (name === 'locationProvince') {
    const province = searchableSelectValue(component);
    state.location.province = province;
    state.location.city = '';
    updateLocationCountyPicker(province);
    return;
  }
  if (name && name.startsWith('vehicleKind-')) {
    updateVehicleKind(component);
    return;
  }
  if (name && name.startsWith('vehiclePlateTemplate-')) {
    updateVehiclePlateTemplate(component);
  }
}

function setSearchableSelectDisabled(component, disabled, placeholder = 'انتخاب کنید') {
  if (!component) return;
  const trigger = component.querySelector('.searchable-select-trigger');
  if (trigger) trigger.disabled = Boolean(disabled);
  component.dataset.placeholder = placeholder;
  if (disabled) {
    component.classList.remove('is-picker-open');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  }
  updateSearchableSelectPresentation(component);
}

function vehiclePlateTemplateFor(templateId) {
  return VEHICLE_PLATE_TEMPLATES.find(template => template.id === templateId) || null;
}

function vehiclePlateTemplatesForKind(kind) {
  if (!VEHICLE_KIND_OPTIONS.some(item => item.value === kind)) return [];
  return VEHICLE_PLATE_TEMPLATES.filter(template => Array.isArray(template.vehicleKinds) && template.vehicleKinds.includes(kind));
}

function iranFlagMarkup() {
  return `<svg class="iran-flag" viewBox="0 0 30 20" aria-hidden="true" focusable="false">
    <rect width="30" height="6.67" y="0" fill="#239f40"/>
    <rect width="30" height="6.66" y="6.67" fill="#fff"/>
    <rect width="30" height="6.67" y="13.33" fill="#da1e37"/>
    <path d="M15 6.4c-.9 1.15-1.2 2.1-1.2 3.1 0 1.5.58 2.66 1.2 4.1.62-1.44 1.2-2.6 1.2-4.1 0-1-.3-1.95-1.2-3.1Zm-2.6 4.02h5.2v1.03h-5.2zM14.48 4.9h1.04v10.2h-1.04z" fill="#da1e37"/>
  </svg>`;
}

function iranPlateCountryBandMarkup() {
  return `<span class="iran-plate-country-band" data-preserve-latin="true" aria-hidden="true">${iranFlagMarkup()}<b>I.R. IRAN</b><em>ایران</em></span>`;
}

function vehiclePlatePreviewMarkup(template, parts = {}, isOption = false) {
  if (!template) return '';
  const values = isPlainRecord(parts) ? parts : {};
  const slot = (name, fallback, options = {}) => {
    const value = typeof values[name] === 'string' && values[name] ? values[name] : fallback;
    const className = options.className ? ` ${options.className}` : '';
    const preserveLatin = options.preserveLatin ? ' data-preserve-latin="true" dir="ltr"' : '';
    return `<span class="vehicle-plate-value${className}" data-plate-preview-part="${name}" data-default-value="${escapeHtml(fallback)}"${preserveLatin}>${escapeHtml(value)}</span>`;
  };
  const className = `vehicle-plate-preview vehicle-plate-preview--${template.tone}${isOption ? ' vehicle-plate-preview--sample' : ''}`;
  const countryBand = iranPlateCountryBandMarkup();

  if (template.layout === 'latin') {
    return `<span class="${className} vehicle-plate-preview--latin" data-preserve-latin="true" dir="ltr">${countryBand}<span class="vehicle-plate-latin-copy"><small>TEMPORARY</small>${slot('latin', '12A-34567', { preserveLatin: true })}</span></span>`;
  }
  if (template.layout === 'motorcycle') {
    return `<span class="${className} vehicle-plate-preview--motorcycle">${countryBand}<span class="vehicle-plate-motorcycle-copy">${slot('first', '۱۲۳')}${slot('second', '۴۵۶')}<small>موتورسیکلت</small></span></span>`;
  }
  if (template.layout === 'protocol') {
    return `<span class="${className} vehicle-plate-preview--protocol" data-preserve-latin="true" dir="ltr">${countryBand}<span class="vehicle-plate-protocol-copy"><small>PROTOCOL</small>${slot('number', '1234', { preserveLatin: true })}</span></span>`;
  }
  if (template.layout === 'free-zone') {
    return `<span class="${className} vehicle-plate-preview--free-zone">${countryBand}<span class="vehicle-plate-free-zone-copy"><small>منطقه آزاد</small>${slot('number', '۱۲۳۴۵')}${slot('zone', 'کیش')}</span></span>`;
  }
  if (template.layout === 'historical') {
    return `<span class="${className} vehicle-plate-preview--historical">${countryBand}<span class="vehicle-plate-historical-copy"><small>تاریخی</small>${slot('number', '۱۲۳۴۵')}</span></span>`;
  }

  const letter = template.fixedLetter
    ? `<span class="vehicle-plate-letter"${template.preserveLetter ? ' data-preserve-latin="true" dir="ltr"' : ''}>${escapeHtml(template.fixedLetter)}</span>`
    : slot('letter', 'ب', { className: 'vehicle-plate-letter' });
  return `<span class="${className}">${countryBand}${slot('right', '۱۲')}${letter}${slot('left', '۳۴۵')}<span class="vehicle-plate-region">${slot('region', '۶۷')}</span></span>`;
}

function vehiclePlateInputMarkup(part, label, options = {}, value = '') {
  const numeric = options.numeric ? ' data-numeric="true"' : '';
  const textOnly = options.textOnly ? ' data-text-only="true"' : '';
  const latin = options.latin ? ' data-preserve-latin="true" dir="ltr" autocapitalize="characters" spellcheck="false"' : '';
  const maxLength = options.maxLength ? ` maxlength="${options.maxLength}"` : '';
  const inputMode = options.numeric ? 'numeric' : 'text';
  return `<label class="vehicle-plate-input-wrap"><span>${label}</span><input type="text" class="field-input vehicle-plate-input${options.numeric ? ' numeric' : ''}" data-vehicle-plate-input data-plate-part="${part}"${numeric}${textOnly}${latin}${maxLength} inputmode="${inputMode}" autocomplete="off" value="${escapeHtml(value)}"></label>`;
}

function vehiclePlateEditorMarkup(templateId, savedParts = {}) {
  const template = vehiclePlateTemplateFor(templateId);
  if (!template) {
    return '<div class="vehicle-plate-editor vehicle-plate-editor--empty" data-vehicle-plate-editor><p>قالب پلاک این وسیله نقلیه را انتخاب کنید.</p></div>';
  }

  let inputs = '';
  if (template.layout === 'national') {
    inputs = `${vehiclePlateInputMarkup('right', 'دو رقم سمت راست', { numeric: true, maxLength: 2 }, savedParts.right || '')}${template.fixedLetter ? '' : vehiclePlateInputMarkup('letter', 'حرف پلاک', { textOnly: true, maxLength: 1 }, savedParts.letter || '')}${vehiclePlateInputMarkup('left', 'سه رقم', { numeric: true, maxLength: 3 }, savedParts.left || '')}${vehiclePlateInputMarkup('region', 'کد دو رقمی', { numeric: true, maxLength: 2 }, savedParts.region || '')}`;
  } else if (template.layout === 'motorcycle') {
    inputs = `${vehiclePlateInputMarkup('first', 'سه رقم اول', { numeric: true, maxLength: 3 }, savedParts.first || '')}${vehiclePlateInputMarkup('second', 'سه رقم دوم', { numeric: true, maxLength: 3 }, savedParts.second || '')}`;
  } else if (template.layout === 'latin') {
    inputs = vehiclePlateInputMarkup('latin', 'شماره لاتین پلاک', { latin: true, maxLength: 16 }, savedParts.latin || '');
  } else if (template.layout === 'free-zone') {
    inputs = `${vehiclePlateInputMarkup('number', 'شماره پنج رقمی', { numeric: true, maxLength: 5 }, savedParts.number || '')}${vehiclePlateInputMarkup('zone', 'نام منطقه آزاد', { textOnly: true, maxLength: 20 }, savedParts.zone || '')}`;
  } else {
    inputs = vehiclePlateInputMarkup('number', 'شماره پلاک', { numeric: true, maxLength: 5 }, savedParts.number || '');
  }

  return `<div class="vehicle-plate-editor" data-vehicle-plate-editor data-plate-template="${template.id}">
    <div class="vehicle-plate-preview-wrap" aria-label="نمایش قالب انتخاب‌شده">${vehiclePlatePreviewMarkup(template, savedParts)}</div>
    <div class="vehicle-plate-inputs vehicle-plate-inputs--${template.layout}">${inputs}</div>
  </div>`;
}

function normalizedVehiclePlate(value, kind = '') {
  if (!isPlainRecord(value)) return null;
  const template = vehiclePlateTemplateFor(value.template);
  if (!template || (kind && !vehiclePlateTemplatesForKind(kind).some(item => item.id === template.id))) return null;
  const parts = {};
  if (isPlainRecord(value.parts)) {
    Object.entries(value.parts).forEach(([part, partValue]) => {
      if (typeof partValue === 'string' && partValue.trim()) parts[part] = partValue.trim();
    });
  }
  if (template.fixedLetter) parts.letter = template.fixedLetter;
  return { template: template.id, label: template.label, parts };
}

function normalizedVehicleRecord(value) {
  const source = isPlainRecord(value) ? value : {};
  const rawPlate = isPlainRecord(source.plate) ? source.plate : (isPlainRecord(source.vehiclePlate) ? source.vehiclePlate : null);
  let kind = VEHICLE_KIND_OPTIONS.some(item => item.value === source.kind) ? source.kind : '';
  if (!kind && rawPlate && vehiclePlateTemplateFor(rawPlate.template)) {
    kind = rawPlate.template === 'motorcycle' ? 'موتورسیکلت' : 'خودرو';
  }
  const record = {};
  if (kind) record.kind = kind;
  ['type', 'color', 'specialFeature'].forEach(key => {
    if (typeof source[key] === 'string' && source[key].trim()) record[key] = source[key].trim();
  });
  const noPlate = source.noPlate === true || source.noPlate === 'بله' || source.vehicleNoPlate === 'بله';
  if (noPlate) record.noPlate = true;
  else {
    const plate = normalizedVehiclePlate(rawPlate, kind);
    if (plate) record.plate = plate;
  }
  return record;
}

function vehicleRecordHasMeaningfulValue(vehicle) {
  if (!isPlainRecord(vehicle)) return false;
  return Boolean(
    vehicle.kind || vehicle.type || vehicle.color || vehicle.specialFeature || vehicle.noPlate ||
    (isPlainRecord(vehicle.plate) && vehicle.plate.template)
  );
}

function clearLegacyPersonVehicleFields(data) {
  ['vehicleKind', 'vehicleType', 'vehicleColor', 'vehiclePlate', 'vehicleNoPlate', 'vehicleSpecialFeature'].forEach(key => delete data[key]);
}

function ensurePersonVehicles() {
  const existing = state.form.vehicles;
  let vehicles;
  if (Array.isArray(existing)) {
    vehicles = existing.slice(0, MAX_VEHICLES).map(normalizedVehicleRecord);
  } else {
    const legacy = normalizedVehicleRecord({
      kind: state.form.vehicleKind,
      type: state.form.vehicleType,
      color: state.form.vehicleColor,
      plate: state.form.vehiclePlate,
      noPlate: state.form.vehicleNoPlate,
      specialFeature: state.form.vehicleSpecialFeature
    });
    vehicles = vehicleRecordHasMeaningfulValue(legacy) ? [legacy] : [];
  }
  if (!vehicles.length) vehicles = [{}];
  state.form.vehicles = vehicles;
  clearLegacyPersonVehicleFields(state.form);
  return vehicles;
}

function vehicleTextFieldMarkup(vehicle, key, label, options = {}) {
  const value = typeof vehicle[key] === 'string' ? vehicle[key] : '';
  const placeholder = options.placeholder ? ` placeholder="${escapeHtml(options.placeholder)}"` : '';
  if (options.textarea) {
    return `<div class="field-group"><label>${label}</label><textarea class="field-textarea" data-vehicle-field="${key}" data-auto-resize="true"${placeholder}>${escapeHtml(value)}</textarea></div>`;
  }
  return `<div class="field-group"><label>${label}</label><input class="field-input" type="text" data-vehicle-field="${key}"${placeholder} value="${escapeHtml(value)}"></div>`;
}

function vehiclePlateField(vehicle, index) {
  const kind = vehicle.kind || '';
  const availableTemplates = vehiclePlateTemplatesForKind(kind);
  const storedPlate = normalizedVehiclePlate(vehicle.plate, kind);
  const template = storedPlate && availableTemplates.some(item => item.id === storedPlate.template) ? vehiclePlateTemplateFor(storedPlate.template) : null;
  const noPlate = vehicle.noPlate === true;
  const options = availableTemplates.map(item => ({
    ...item,
    value: item.id,
    preview: vehiclePlatePreviewMarkup(item, {}, true)
  }));
  const canChooseTemplate = Boolean(kind);
  const placeholder = canChooseTemplate ? 'قالب پلاک را انتخاب کنید' : 'ابتدا وسیله نقلیه را انتخاب کنید';
  return `<div class="field-group vehicle-plate-field${noPlate ? ' is-no-plate' : ''}" data-vehicle-plate-field data-vehicle-index="${index}">
    <label>پلاک</label>
    <p class="vehicle-plate-description">اطلاعات پلاک مشاهده شده را وارد کنید</p>
    ${searchableSelectMarkup(`vehiclePlateTemplate-${index}`, '', options, { value: template ? template.id : '', placeholder, wrap: false, className: 'vehicle-plate-template-select', disabled: noPlate || !canChooseTemplate })}
    <label class="vehicle-no-plate"><input type="checkbox" data-vehicle-no-plate onchange="toggleVehicleNoPlate(this)"${noPlate ? ' checked' : ''}><span>فاقد پلاک</span></label>
    <div data-vehicle-plate-editor-container>${noPlate ? '<div class="vehicle-plate-editor vehicle-plate-editor--empty" data-vehicle-plate-editor><p>برای این وسیله نقلیه، پلاکی مشاهده نشده است.</p></div>' : vehiclePlateEditorMarkup(template ? template.id : '', storedPlate ? storedPlate.parts : {})}</div>
  </div>`;
}

function vehicleCardMarkup(vehicle, index, total) {
  const title = `وسیله نقلیه ${faDigits(index + 1)}`;
  const removeButton = total > 1 ? `<button class="vehicle-remove-button" type="button" onclick="removeVehicle(this)">حذف این وسیله</button>` : '';
  return `<article class="vehicle-card" data-vehicle-card data-vehicle-index="${index}">
    <header class="vehicle-card-heading"><h3>${title}</h3>${removeButton}</header>
    <div class="vehicle-card-fields">
      ${searchableSelectMarkup(`vehicleKind-${index}`, 'وسیله نقلیه', VEHICLE_KIND_OPTIONS, { value: vehicle.kind || '', placeholder: 'خودرو یا موتورسیکلت را انتخاب کنید', className: 'vehicle-kind-select' })}
      ${vehicleTextFieldMarkup(vehicle, 'type', 'نوع')}
      ${vehicleTextFieldMarkup(vehicle, 'color', 'رنگ')}
      ${vehiclePlateField(vehicle, index)}
      ${vehicleTextFieldMarkup(vehicle, 'specialFeature', 'ویژگی خاص', { textarea: true, placeholder: 'تصادف، خوردگی رنگ و موارد بارز دیگر' })}
    </div>
  </article>`;
}

function vehicleCollectionInnerMarkup() {
  const vehicles = ensurePersonVehicles();
  const atLimit = vehicles.length >= MAX_VEHICLES;
  return `<div class="vehicle-card-list">${vehicles.map((vehicle, index) => vehicleCardMarkup(vehicle, index, vehicles.length)).join('')}</div>
    <button class="vehicle-add-button" type="button" onclick="addVehicle()"${atLimit ? ' disabled' : ''}>افزودن وسیله نقلیه دیگر${atLimit ? ` (حداکثر ${faDigits(MAX_VEHICLES)})` : ''}</button>`;
}

function vehicleCollectionMarkup() {
  return `<div class="vehicle-collection" data-vehicle-collection aria-label="فهرست وسایل نقلیه">${vehicleCollectionInnerMarkup()}</div>`;
}

function renderVehiclePackages() {
  const collection = document.querySelector('[data-vehicle-collection]');
  if (!collection) return;
  collection.innerHTML = vehicleCollectionInnerMarkup();
  collection.querySelectorAll('[data-searchable-select]').forEach(updateSearchableSelectPresentation);
  collection.querySelectorAll('textarea[data-auto-resize="true"]').forEach(resizeTextarea);
  setTimeout(normalizeVisibleNumbers, 0);
}

function vehicleCardIndexFor(element) {
  const card = element && element.closest ? element.closest('[data-vehicle-card]') : null;
  const index = card ? Number(card.dataset.vehicleIndex) : NaN;
  return Number.isInteger(index) && index >= 0 ? index : -1;
}

function updateVehicleKind(component) {
  const index = vehicleCardIndexFor(component);
  if (index < 0) return;
  collectForm();
  const vehicles = ensurePersonVehicles();
  const vehicle = vehicles[index];
  if (!vehicle) return;
  vehicle.kind = searchableSelectValue(component);
  if (vehicle.plate && !vehiclePlateTemplatesForKind(vehicle.kind).some(item => item.id === vehicle.plate.template)) delete vehicle.plate;
  renderVehiclePackages();
}

function updateVehiclePlateTemplate(component) {
  const index = vehicleCardIndexFor(component);
  if (index < 0) return;
  const selectedTemplate = searchableSelectValue(component);
  const previousTemplate = Array.isArray(state.form.vehicles) && isPlainRecord(state.form.vehicles[index]) && isPlainRecord(state.form.vehicles[index].plate)
    ? state.form.vehicles[index].plate.template
    : '';
  collectForm();
  const vehicles = ensurePersonVehicles();
  const vehicle = vehicles[index];
  const template = vehicle && vehiclePlateTemplateFor(selectedTemplate);
  if (!vehicle || !template || !vehiclePlateTemplatesForKind(vehicle.kind).some(item => item.id === template.id)) return;
  if (previousTemplate !== template.id) vehicle.plate = { template: template.id, label: template.label, parts: template.fixedLetter ? { letter: template.fixedLetter } : {} };
  renderVehiclePackages();
}

function toggleVehicleNoPlate(checkbox) {
  const index = vehicleCardIndexFor(checkbox);
  if (index < 0) return;
  collectForm();
  const vehicle = ensurePersonVehicles()[index];
  if (!vehicle) return;
  if (checkbox.checked) {
    vehicle.noPlate = true;
    delete vehicle.plate;
  } else {
    delete vehicle.noPlate;
  }
  renderVehiclePackages();
  persistReportDraft();
}

function addVehicle() {
  collectForm();
  const vehicles = ensurePersonVehicles();
  if (vehicles.length >= MAX_VEHICLES) return;
  vehicles.push({});
  renderVehiclePackages();
  persistReportDraft();
}

function removeVehicle(button) {
  const index = vehicleCardIndexFor(button);
  if (index < 0) return;
  collectForm();
  const vehicles = ensurePersonVehicles();
  vehicles.splice(index, 1);
  if (!vehicles.length) vehicles.push({});
  renderVehiclePackages();
  persistReportDraft();
}

function normalizeVehiclePlateInput(input) {
  normalizeFieldValue(input);
  if (input.dataset.preserveLatin === 'true') {
    input.value = enDigits(input.value).toUpperCase().replace(/[^A-Z0-9 -]/g, '');
  }
  if (input.dataset.platePart === 'letter') {
    input.value = input.value.replace(/[^آ-یءئ]/g, '').slice(0, 1);
  }
}

function syncVehiclePlatePreview(input) {
  const editor = input.closest('[data-vehicle-plate-editor]');
  if (!editor) return;
  const preview = editor.querySelector(`[data-plate-preview-part="${input.dataset.platePart}"]`);
  if (!preview) return;
  const fallback = preview.dataset.defaultValue || preview.textContent;
  preview.textContent = input.value || fallback;
}

function collectVehiclePackages(data) {
  const collection = document.querySelector('[data-vehicle-collection]');
  // Only the active sequential form section is in the DOM. Keep package records
  // intact while the reporter is on earlier steps, time, location, or documents.
  if (!collection) return;

  const vehicles = [];
  collection.querySelectorAll('[data-vehicle-card]').forEach(card => {
    const kindPicker = card.querySelector('[data-select-name^="vehicleKind-"]');
    const platePicker = card.querySelector('[data-select-name^="vehiclePlateTemplate-"]');
    const kind = searchableSelectValue(kindPicker);
    const record = {
      kind,
      type: (card.querySelector('[data-vehicle-field="type"]')?.value || '').trim(),
      color: (card.querySelector('[data-vehicle-field="color"]')?.value || '').trim(),
      specialFeature: (card.querySelector('[data-vehicle-field="specialFeature"]')?.value || '').trim()
    };
    const noPlate = card.querySelector('[data-vehicle-no-plate]');
    if (noPlate && noPlate.checked) {
      record.noPlate = true;
    } else {
      const template = vehiclePlateTemplateFor(searchableSelectValue(platePicker));
      if (template && vehiclePlateTemplatesForKind(kind).some(item => item.id === template.id)) {
        const parts = {};
        card.querySelectorAll('[data-vehicle-plate-input]').forEach(input => {
          const value = input.value.trim();
          if (value) parts[input.dataset.platePart] = value;
        });
        if (template.fixedLetter) parts.letter = template.fixedLetter;
        record.plate = { template: template.id, label: template.label, parts };
      }
    }
    vehicles.push(normalizedVehicleRecord(record));
  });
  data.vehicles = vehicles.slice(0, MAX_VEHICLES);
  clearLegacyPersonVehicleFields(data);
}

function socialPlatformFor(platformId) {
  return typeof platformId === 'string' ? SOCIAL_PLATFORM_BY_ID.get(platformId) || null : null;
}

function socialPlatformLogoMarkup(platform, className = 'social-platform-logo') {
  if (!platform) return '';
  const logoFile = SOCIAL_LOGO_FILES[platform.id];
  if (!logoFile) return '';
  return `<img class="${className} social-platform-logo--${platform.id}" src="assets/social-icons/${logoFile}" alt="" aria-hidden="true" draggable="false" decoding="async">`;
}

function normalizedSocialSearch(value) {
  return String(value ?? '')
    .toLocaleLowerCase('fa')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\u200c/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSocialLinkValue(platform, value) {
  const rawValue = String(value ?? '').trim();
  if (!platform || !rawValue) return '';

  const withoutProtocol = rawValue.replace(/^(?:https?:)?\/\//i, '').replace(/^www\./i, '');
  const loweredValue = withoutProtocol.toLowerCase();
  const prefix = platform.prefix.toLowerCase();
  if (loweredValue.startsWith(prefix)) return withoutProtocol.slice(platform.prefix.length).replace(/^\/+/, '');

  for (const alias of platform.aliases) {
    const loweredAlias = alias.toLowerCase().replace(/\/+$/, '');
    if (loweredValue === loweredAlias) return '';
    if (loweredValue.startsWith(`${loweredAlias}/`)) return withoutProtocol.slice(alias.length).replace(/^\/+/, '');
  }

  return rawValue.replace(/^\/+/, '');
}

function socialLinkUrl(platform, value) {
  const normalizedValue = normalizeSocialLinkValue(platform, value);
  return normalizedValue ? `https://${platform.prefix}${normalizedValue}` : '';
}

function savedSocialLinks() {
  if (!Array.isArray(state.form.socialLinks)) return [];
  return state.form.socialLinks.reduce((links, item) => {
    if (!isPlainRecord(item)) return links;
    const platform = socialPlatformFor(item.platform);
    if (!platform) return links;
    const rawValue = typeof item.value === 'string' ? item.value : typeof item.url === 'string' ? item.url : '';
    links.push({ platform: platform.id, value: normalizeSocialLinkValue(platform, rawValue) });
    return links;
  }, []);
}

function socialPlatformOptionMarkup(platform) {
  return `<button type="button" class="social-platform-option" role="option" data-social-platform-option data-social-search="${escapeHtml(platform.search)}" onclick="selectSocialPlatform(this,'${platform.id}')">${socialPlatformLogoMarkup(platform)}<span class="social-platform-option-name">${platform.name}</span><span class="social-platform-option-prefix" dir="ltr">${platform.prefix}</span></button>`;
}

function socialLinkRowMarkup(savedLink = {}) {
  const platform = socialPlatformFor(savedLink.platform);
  const rawValue = typeof savedLink.value === 'string' ? savedLink.value : typeof savedLink.url === 'string' ? savedLink.url : '';
  const value = platform ? normalizeSocialLinkValue(platform, rawValue) : '';
  const menuId = `social-platform-menu-${++socialLinkRowSequence}`;
  const selectedMarkup = platform
    ? `${socialPlatformLogoMarkup(platform)}<span class="sr-only">${platform.name}</span>`
    : `${iconMarkup('link', 'social-platform-empty-icon')}<span class="social-platform-trigger-copy">انتخاب شبکه</span>`;
  const prefixMarkup = platform
    ? `<span class="social-link-prefix" dir="ltr">${platform.prefix}</span>`
    : '<span class="social-link-prefix social-link-prefix--empty">نشانی</span>';
  const inputState = platform ? '' : ' disabled';
  const helper = platform
    ? 'شناسه، مسیر پیام یا پست، یا لینک کامل را وارد کنید.'
    : 'ابتدا پلتفرم موردنظر را انتخاب کنید.';

  return `<div class="social-link-row${platform ? ' is-selected' : ''}" data-social-link-row data-platform="${platform ? platform.id : ''}">
    <div class="social-link-control">
      <button type="button" class="social-platform-trigger button-with-icon" aria-haspopup="dialog" aria-controls="${menuId}" aria-expanded="false" aria-label="${platform ? `تغییر پلتفرم؛ ${platform.name}` : 'انتخاب پلتفرم'}" onclick="toggleSocialPlatformMenu(this)">${selectedMarkup}${iconMarkup('chevron-down', 'social-platform-chevron')}</button>
      <div class="social-link-entry">
        ${prefixMarkup}
        <input type="text" class="social-link-value" data-social-link-value dir="ltr" value="${escapeHtml(value)}"${inputState} maxlength="500" autocomplete="off" autocapitalize="none" spellcheck="false" aria-label="شناسه یا مسیر نشانی فضای مجازی" onblur="normalizeSocialLinkEntry(this)">
      </div>
      <button type="button" class="social-link-remove" aria-label="حذف این نشانی" onclick="removeSocialLink(this)">${iconMarkup('trash', 'social-link-remove-icon')}<span class="sr-only">حذف</span></button>
    </div>
    <div id="${menuId}" class="social-platform-menu" role="dialog" aria-label="انتخاب پلتفرم">
      <div class="social-platform-search-wrap">
        ${iconMarkup('search', 'social-platform-search-icon')}
        <input type="search" class="social-platform-search" autocomplete="off" placeholder="جست‌وجوی پلتفرم" aria-label="جست‌وجوی پلتفرم">
      </div>
      <div class="social-platform-options" role="listbox" aria-label="فهرست پلتفرم‌ها">${SOCIAL_PLATFORMS.map(socialPlatformOptionMarkup).join('')}</div>
    </div>
    <p class="social-link-helper">${helper}</p>
  </div>`;
}

function socialLinksField() {
  const savedLinks = savedSocialLinks();
  const rows = savedLinks.length ? savedLinks : [{}];
  return `<div class="field-group social-links-field" data-social-links data-person-contact-fields>
    <label>نشانی‌های فضای مجازی</label>
    <p class="social-links-description">پلتفرم را انتخاب کنید و سپس شناسه، مسیر پیام یا پست، یا لینک آن را وارد کنید.</p>
    <div class="social-link-list" data-social-link-list>${rows.map(socialLinkRowMarkup).join('')}</div>
    <button type="button" class="social-add-button button-with-icon" onclick="addSocialLink()">${iconMarkup('plus', 'social-add-icon')}<span>افزودن نشانی دیگر</span></button>
  </div>`;
}

function closeSocialPlatformMenus(except = null) {
  document.querySelectorAll('.social-link-row.is-picker-open').forEach(row => {
    if (row === except) return;
    row.classList.remove('is-picker-open');
    const trigger = row.querySelector('.social-platform-trigger');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  });
}

function toggleSocialPlatformMenu(trigger) {
  const row = trigger.closest('[data-social-link-row]');
  if (!row) return;
  const shouldOpen = !row.classList.contains('is-picker-open');
  closeSocialPlatformMenus(row);
  row.classList.toggle('is-picker-open', shouldOpen);
  trigger.setAttribute('aria-expanded', String(shouldOpen));

  if (shouldOpen) {
    const search = row.querySelector('.social-platform-search');
    if (search) {
      search.value = '';
      filterSocialPlatforms(search);
      setTimeout(() => search.focus(), 0);
    }
  }
}

function filterSocialPlatforms(searchInput) {
  const row = searchInput.closest('[data-social-link-row]');
  if (!row) return;
  const query = normalizedSocialSearch(searchInput.value);
  row.querySelectorAll('[data-social-platform-option]').forEach(option => {
    option.hidden = Boolean(query) && !normalizedSocialSearch(option.dataset.socialSearch).includes(query);
  });
}

function selectSocialPlatform(option, platformId) {
  const platform = socialPlatformFor(platformId);
  const row = option.closest('[data-social-link-row]');
  if (!platform || !row) return;
  const currentInput = row.querySelector('[data-social-link-value]');
  const value = currentInput ? currentInput.value : '';
  row.outerHTML = socialLinkRowMarkup({ platform: platform.id, value: normalizeSocialLinkValue(platform, value) });
  persistReportDraft();
}

function normalizeSocialLinkEntry(input) {
  const row = input.closest('[data-social-link-row]');
  const platform = row ? socialPlatformFor(row.dataset.platform) : null;
  if (!platform) return;
  input.value = normalizeSocialLinkValue(platform, input.value);
  persistReportDraft();
}

function addSocialLink() {
  const list = document.querySelector('[data-social-link-list]');
  if (!list) return;
  collectForm();
  list.insertAdjacentHTML('beforeend', socialLinkRowMarkup());
  const trigger = list.lastElementChild && list.lastElementChild.querySelector('.social-platform-trigger');
  if (trigger) toggleSocialPlatformMenu(trigger);
  persistReportDraft();
}

function removeSocialLink(button) {
  const row = button.closest('[data-social-link-row]');
  const list = row && row.parentElement;
  if (!row || !list) return;
  if (list.children.length === 1) row.outerHTML = socialLinkRowMarkup();
  else row.remove();
  collectForm();
  persistReportDraft();
}

function collectSocialLinks(data) {
  const group = document.querySelector('[data-social-links]');
  if (!group) return;

  delete data.social;
  delete data.socialLinks;
  const links = [];
  group.querySelectorAll('[data-social-link-row]').forEach(row => {
    const platform = socialPlatformFor(row.dataset.platform);
    if (!platform) return;
    const input = row.querySelector('[data-social-link-value]');
    const value = normalizeSocialLinkValue(platform, input ? input.value : '');
    links.push({ platform: platform.id, value, url: socialLinkUrl(platform, value) });
  });
  if (links.length) data.socialLinks = links;
}

function hasMeaningfulFormValue() {
  return Object.entries(state.form).some(([name, value]) => {
    if (name === 'socialLinks' && Array.isArray(value)) {
      return value.some(link => isPlainRecord(link) && typeof link.value === 'string' && link.value.trim());
    }
    if (name === 'vehiclePlate' && isPlainRecord(value)) return Boolean(value.template);
    if (name === 'vehicles' && Array.isArray(value)) return value.some(vehicleRecordHasMeaningfulValue);
    return typeof value === 'string' && value.trim();
  });
}

function isValidNationalId(value) {
  const digits = enDigits(value);
  if (!/^\d{10}$/.test(digits) || /^(\d)\1{9}$/.test(digits)) return false;
  const total = digits.slice(0, 9).split('').reduce((sum, digit, index) => sum + Number(digit) * (10 - index), 0);
  const remainder = total % 11;
  const checkDigit = Number(digits[9]);
  return checkDigit === (remainder < 2 ? remainder : 11 - remainder);
}

function fieldValidationMessage(element) {
  const value = element.value.trim();
  if (!value || !element.dataset.validation) return '';

  const digits = enDigits(value);
  const label = element.dataset.label || 'این فیلد';
  if (element.dataset.validation === 'national-id' && !isValidNationalId(digits)) {
    return `${label} باید ۱۰ رقم معتبر باشد.`;
  }
  if (element.dataset.validation === 'phone' && !/^\d{11}$/.test(digits)) {
    return `${label} باید دقیقاً ۱۱ رقم باشد.`;
  }
  if (element.dataset.validation === 'age' && (!/^\d{1,3}$/.test(digits) || Number(digits) < 1 || Number(digits) > 120)) {
    return `${label} باید عددی بین ۱ تا ۱۲۰ باشد.`;
  }
  if (element.dataset.validation === 'height' && (!/^\d{1,3}$/.test(digits) || Number(digits) < 1 || Number(digits) > 250)) {
    return `${label} باید عددی تا ۳ رقم و حداکثر ۲۵۰ باشد.`;
  }
  if (element.dataset.validation === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return `${label} را به شکل یک ایمیل معتبر وارد کنید.`;
  }
  return '';
}

function validateVisibleFormFields() {
  const invalid = Array.from(document.querySelectorAll('#formBody [data-validation], #incidentReportBody [data-validation]'))
    .map(element => ({ element, message: fieldValidationMessage(element) }))
    .find(item => item.message);

  if (!invalid) return true;
  if (typeof invalid.element.focus === 'function') invalid.element.focus();
  alert(invalid.message);
  return false;
}

function formSection(title, fields, description) {
  return { title, fields, description };
}

function openForm() {
  const title = state.subtype ? `${state.category} — ${state.subtype}` : state.category;
  const sections = buildForm(state.category, state.subtype);
  if (!sections.length) return showPage('categoryPage');
  state.formStep = Math.min(Math.max(Number(state.formStep) || 0, 0), sections.length - 1);
  document.getElementById('formTitle').textContent = title;
  renderFormSection(sections);
  showPage('formPage');
}

function renderFormSection(sections = buildForm(state.category, state.subtype)) {
  const total = sections.length;
  const current = sections[state.formStep];
  const isLast = state.formStep === total - 1;
  const currentNumber = faDigits(state.formStep + 1);
  const totalNumber = faDigits(total);
  const progress = ((state.formStep + 1) / total) * 100;

  document.getElementById('formBody').innerHTML = `
    <div class="form-section-progress" aria-label="بخش ${currentNumber} از ${totalNumber}">
      <span>بخش ${currentNumber} از ${totalNumber}</span>
      <div class="form-section-progress-track" aria-hidden="true"><span style="--form-progress:${progress}%"></span></div>
    </div>
    <section class="form-section-card" aria-labelledby="formSectionTitle">
      <header class="form-section-heading">
        <h2 id="formSectionTitle">${current.title}</h2>
        <p>${current.description}</p>
      </header>
      <div class="form-section-fields">${current.fields}</div>
    </section>`;

  const actions = document.getElementById('formActions');
  const primaryLabel = isLast ? 'تایید فرم شناسایی' : 'مرحله بعد';
  actions.className = `form-actions${state.formStep === 0 ? ' first-step' : ''}`;
  actions.innerHTML = `
    ${state.formStep > 0 ? `<button class="secondary-button" onclick="previousFormSection()" type="button">مرحله قبل</button>` : ''}
    <button class="primary-button" onclick="${isLast ? 'continueForm()' : 'nextFormSection()'}" type="button">${primaryLabel}</button>`;

  restoreFormValues();
  setTimeout(normalizeVisibleNumbers, 0);
}

function buildForm(category, subtype) {
  category = canonicalCategory(category);
  if (category === 'افراد') return personForm();
  if (category === 'املاک') return propertyForm();
  if (category === 'اشیاء') return objectForm(subtype);
  if (category === 'رویداد') return phenomenonForm(subtype);
  return [];
}

function personForm() {
  return [
    formSection('مشخصات فردی',
      `${field('firstName','نام','text',{textOnly:true})}${field('lastName','نام خانوادگی','text',{textOnly:true})}${field('nickname','شهرت','text',{textOnly:true})}${field('nationalId','کد ملی','text',{numeric:true,maxLength:10,validation:'national-id'})}${field('age','سن','text',{numeric:true,maxLength:3,validation:'age'})}${choices('gender','جنسیت',['مرد','زن','نامشخص'],{columns:3})}`,
      'اطلاعات پایه برای شناسایی فرد را وارد کنید.'),
    formSection('مشخصات ظاهری',
      `${field('height','قد','text',{numeric:true,maxLength:3,maxValue:250,validation:'height'})}${choices('bodyBuild','اندام',['لاغر','معمولی','چاق'],{columns:3})}${field('face','رنگ پوست','text',{textOnly:true})}${field('hairColor','رنگ مو','text',{textOnly:true})}${field('hairStatus','وضعیت موی سر','text',{textOnly:true})}${field('beard','محاسن','text',{textOnly:true})}${field('appearance','ویژگی خاص','textarea',{placeholder:'شامل زخم، تتو، معلولیت و موارد بارز دیگر'})}`,
      'ویژگی‌های ظاهری قابل مشاهده را ثبت کنید.'),
    formSection('پل‌های ارتباطی',
      `${field('phoneMobile','شماره همراه','text',{numeric:true,maxLength:11,validation:'phone'})}${field('phoneFixed','شماره ثابت محل سکونت','text',{numeric:true,maxLength:11,validation:'phone'})}${field('homeAddress','نشانی محل سکونت','textarea')}${field('phoneWork','شماره ثابت محل کار','text',{numeric:true,maxLength:11,validation:'phone'})}${field('workAddress','نشانی محل کار','textarea')}${field('email','نشانی پست الکترونیک','email',{validation:'email',placeholder:'example@gmail.com',ltr:true})}${socialLinksField()}`,
      'شماره‌های تماس و نشانی‌های مرتبط را وارد کنید.'),
    formSection('وسایل نقلیه',
      vehicleCollectionMarkup(),
      'برای هر وسیله نقلیه، نوع، رنگ، پلاک و ویژگی‌های قابل مشاهده را ثبت کنید.')
  ];
}

function incidentReportSection() {
  return formSection('شرح و جزئیات وقوع',
    `${field('crimeType','نوع جرم یا تخلف','textarea')}${field('crimeMethod','نحوه ارتکاب و ترتیب وقوع','textarea')}${field('crimePlace','آدرس و مشخصات مکان وقوع','textarea')}${field('crimeDate','زمان وقوع یا زمان احتمالی','textarea')}${field('relatedPeople','همکاران و افراد مرتبط','textarea')}${field('source','نحوه اطلاع منبع','textarea')}`,
    'جزئیات رخداد و نحوه اطلاع خود را ثبت کنید.');
}

function renderIncidentReport() {
  const section = incidentReportSection();
  document.getElementById('incidentReportBody').innerHTML = `
    <section class="form-section-card incident-report-card" aria-labelledby="incidentReportSectionTitle">
      <header class="form-section-heading">
        <h2 id="incidentReportSectionTitle">${section.title}</h2>
        <p>${section.description}</p>
      </header>
      <div class="form-section-fields">${section.fields}</div>
    </section>`;
  restoreFormValues();
  setTimeout(normalizeVisibleNumbers, 0);
}

function propertyForm() {
  return [
    formSection('مشخصات و محل ملک',
      `${field('propertyAddress','آدرس ملک','textarea')}${field('owners','مشخصات صاحبان یا ساکنان','textarea')}${field('vehicles','مشخصات خودرو و موتورسیکلت‌های مرتبط','textarea')}`,
      'موقعیت و افراد یا وسایل مرتبط با ملک را وارد کنید.'),
    formSection('فعالیت و حفاظت ملک',
      `${field('activity','نوع فعالیت احتمالی','textarea')}${field('security','سیستم حفاظت و کنترل','textarea')}${field('specialSecurity','اقدامات حفاظتی و کنترل خاص','textarea')}`,
      'وضعیت فعالیت و تمهیدات حفاظتی محل را شرح دهید.'),
    formSection('موضوع گزارش',
      `${field('suspicionReason','دلایل مشکوک بودن ملک','textarea')}${field('source','نحوه اطلاع منبع','textarea')}`,
      'دلیل گزارش و نحوه اطلاع خود را ثبت کنید.')
  ];
}

function objectForm(subtype) {
  if (subtype === 'بسته مشکوک') {
    return [
      formSection('مشخصات بسته',
        `${field('objectType','نوع شیء مشکوک')}${choices('packageType','نوع بسته‌بندی',['پلمپ','چسب','عادی','نامشخص'])}${field('specialSigns','علائم خاص و ویژه','textarea')}`,
        'مشخصات قابل مشاهده بسته یا شیء را وارد کنید.'),
      formSection('محل و علت گزارش',
        `${field('packageAddress','آدرس محل قرارگیری','textarea')}${field('suspicionReason','علت مشکوک بودن بسته','textarea')}${field('source','نحوه اطلاع منبع','textarea')}`,
        'محل قرارگیری، علت گزارش و نحوه اطلاع خود را ثبت کنید.')
    ];
  }
  if (subtype === 'خودرو مشکوک') {
    return [
      formSection('مشخصات خودرو',
        `${field('vehicleType','نوع خودرو')}${field('vehicleColor','رنگ')}${field('vehiclePlate','پلاک')}`,
        'مشخصات ظاهری و پلاک خودرو را وارد کنید.'),
      formSection('مشاهده و گزارش',
        `${field('vehicleAddress','محل مشاهده','textarea')}${field('vehicleReason','علت مشکوک بودن خودرو','textarea')}${field('riderAppearance','مشخصات ظاهری راکب','textarea')}${field('vehicleTime','ساعت مشاهده، توقف یا تردد','text')}${field('source','نحوه اطلاع منبع','textarea')}`,
        'جزئیات مشاهده خودرو و نحوه اطلاع خود را ثبت کنید.')
    ];
  }
  if (subtype === 'پرنده') {
    return [
      formSection('مشخصات و حرکت پرنده',
        `${field('birdType','نوع پرنده')}${field('birdVisible','مشخصات قابل رؤیت','textarea')}${field('birdSound','صدا','textarea')}${field('birdDirection','مسیر حرکت')}${field('birdSpeed','سرعت حرکت')}${choices('birdMotion','متحرک یا ثابت',['متحرک','ثابت','نامشخص'])}`,
        'ویژگی‌های قابل مشاهده و نحوه حرکت پرنده را وارد کنید.'),
      formSection('سابقه و مستندات',
        `${yesNo('birdRepeat','تکرار رؤیت در گذشته')}${field('birdObservation','نحوه مشاهده منبع','textarea')}${field('birdSourceRelation','آشنایی منبع با موضوع','textarea')}${field('birdEvidence','مستندات احتمالی','textarea')}`,
        'سابقه مشاهده، ارتباط منبع و مستندات احتمالی را ثبت کنید.')
    ];
  }
  if (subtype === 'کالا') {
    return [
      formSection('مشخصات کالا',
        `${field('goodsType','نوع کالا')}${field('goodsBrand','برند یا سازنده')}${field('goodsModel','مدل یا مشخصات')}${field('goodsQuantity','تعداد','text',{numeric:true})}${field('goodsPackaging','نوع بسته‌بندی')}`,
        'مشخصات اصلی کالا را وارد کنید.'),
      formSection('مبدأ، مقصد و گزارش',
        `${field('goodsOrigin','مبدأ یا محل تهیه')}${field('goodsDestination','مقصد یا محل نگهداری','textarea')}${field('goodsReason','علت اهمیت یا مشکوک بودن','textarea')}${field('source','نحوه اطلاع منبع','textarea')}`,
        'مسیر کالا، علت گزارش و نحوه اطلاع خود را ثبت کنید.')
    ];
  }
  return [
    formSection('محل و مشخصات آنتن',
      `${field('starlinkAddress','آدرس محل نصب آنتن','textarea')}${field('starlinkOwners','مشخصات صاحبان و استفاده‌کنندگان','textarea')}${field('starlinkAppearance','مشخصات ظاهری آنتن','textarea')}`,
      'محل نصب و مشخصات قابل مشاهده آنتن را وارد کنید.'),
    formSection('علت استفاده و منبع',
      `${field('starlinkReason','علت استفاده','textarea')}${field('source','نحوه اطلاع منبع','textarea')}${field('sourceRelation','زمان و نحوه آشنایی منبع با موضوع','textarea')}`,
      'علت استفاده و نحوه اطلاع یا آشنایی خود با موضوع را ثبت کنید.')
  ];
}

function phenomenonForm(subtype) {
  if (subtype === 'تجمع، تحصن یا اغتشاش') {
    return [
      formSection('محل و حاضران',
        `${field('phenomenonAddress','آدرس و محل وقوع','textarea')}${field('participantCount','تعداد افراد حاضر و شرکت‌کننده','text',{numeric:true})}`,
        'محل رخداد و تعداد تقریبی افراد حاضر را وارد کنید.'),
      formSection('وضعیت تجمع',
        `${field('participantActions','اقدامات شرکت‌کنندگان','textarea')}${field('signsSlogans','دستنوشته‌ها، شعارها و خواسته‌ها','textarea')}${field('leaders','مشخصات لیدرها','textarea')}${field('futureActions','اقدامات احتمالی آینده','textarea')}${field('formation','نحوه شکل‌گیری پدیده','textarea')}${yesNo('history','سابقه قبلی پدیده')}`,
        'روند شکل‌گیری، وضعیت فعلی و اقدامات احتمالی را شرح دهید.'),
      formSection('اطلاع‌رسانی و منبع',
        `${field('callMethod','نحوه فراخوان و اطلاع‌رسانی','textarea')}${field('source','نحوه اطلاع منبع','textarea')}`,
        'روش اطلاع‌رسانی و نحوه اطلاع خود را ثبت کنید.')
    ];
  }
  return [
    formSection('محل و خسارت',
      `${field('eventAddress','آدرس و محل رخداد','textarea')}${field('importance','اهمیت مکان مورد تهدید','textarea')}${field('damage','خسارت‌های جانی و مالی و تخریب','textarea')}`,
      'محل رخداد و خسارت‌های واردشده را ثبت کنید.'),
    formSection('عوامل و نحوه وقوع',
      `${field('suspects','مشخصات مظنونین احتمالی','textarea')}${field('responders','حضور یا عدم حضور نیروهای خدماتی و مأمورین','textarea')}${field('eventCause','نحوه وقوع و چگونگی آغاز و گسترش','textarea')}${field('intent','انگیزه یا عامل احتمالی در صورت عمدی بودن','textarea')}${field('source','نحوه اطلاع منبع','textarea')}`,
      'عوامل احتمالی، نحوه رخداد و منبع اطلاع را وارد کنید.')
  ];
}

function nextFormSection() {
  const sections = buildForm(state.category, state.subtype);
  if (state.formStep >= sections.length - 1) return continueForm();
  collectForm();
  if (!validateVisibleFormFields()) return;
  state.formStep += 1;
  renderFormSection(sections);
  persistReportDraft();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function previousFormSection() {
  if (state.formStep === 0) return;
  collectForm();
  state.formStep -= 1;
  renderFormSection();
  persistReportDraft();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function pickChoice(button, name, value) {
  const row = button.parentElement;
  row.querySelectorAll('.choice-btn').forEach(item => item.classList.remove('selected'));
  button.classList.add('selected');
  button.dataset.value = value;
  persistReportDraft();
}

function collectForm() {
  const data = { ...state.form };
  delete data.priority;
  delete data.weight;
  if (document.querySelector('[data-person-contact-fields]')) delete data.phoneHome;
  document.querySelectorAll('#formBody [data-field], #incidentReportBody [data-field]').forEach(element => {
    const value = element.value.trim();
    if (value) data[element.dataset.field] = value;
    else delete data[element.dataset.field];
  });
  document.querySelectorAll('#formBody [data-choice], #incidentReportBody [data-choice]').forEach(row => {
    const selected = row.querySelector('.selected');
    if (selected) data[row.dataset.choice] = selected.dataset.value || selected.textContent.trim();
    else delete data[row.dataset.choice];
  });
  collectSocialLinks(data);
  collectVehiclePackages(data);
  state.form = data;
}

function restoreFormValues() {
  Object.entries(state.form).forEach(([name, value]) => {
    if (typeof value !== 'string') return;
    const fieldElement = document.querySelector(`#formBody [data-field="${CSS.escape(name)}"], #incidentReportBody [data-field="${CSS.escape(name)}"]`);
    if (fieldElement) fieldElement.value = value;
    const row = document.querySelector(`#formBody [data-choice="${CSS.escape(name)}"], #incidentReportBody [data-choice="${CSS.escape(name)}"]`);
    if (row) {
      row.querySelectorAll('.choice-btn').forEach(button => {
        if (button.textContent.trim() === value) {
          button.classList.add('selected');
          button.dataset.value = value;
        }
      });
    }
  });
  document.querySelectorAll('#formBody [data-searchable-select], #incidentReportBody [data-searchable-select]').forEach(updateSearchableSelectPresentation);
  document.querySelectorAll('#formBody textarea[data-auto-resize="true"], #incidentReportBody textarea[data-auto-resize="true"]').forEach(resizeTextarea);
}

function continueForm() {
  collectForm();
  if (!validateVisibleFormFields()) return;
  if (!hasMeaningfulFormValue()) return alert('حداقل یکی از اطلاعات گزارش را وارد کنید.');
  openTime();
}

function backFromForm() {
  if (state.formStep > 0) return previousFormSection();
  collectForm();
  if (state.category === 'اشیاء') return showPage('objectTypePage');
  if (state.category === 'رویداد') return showPage('phenomenonTypePage');
  showPage('categoryPage');
}

function openTime() {
  restoreTimeFields();
  showPage('timePage');
}

function restoreTimeFields() {
  document.querySelectorAll('#timePage .choice-btn').forEach(button => button.classList.remove('selected'));
  const mode = state.time.mode === 'الان' ? 'اکنون' : state.time.mode;
  if (state.time.mode === 'الان') state.time.mode = mode;
  if (mode) {
    const selected = document.querySelector(`#timePage .choice-btn[data-time="${CSS.escape(mode)}"]`);
    if (selected) selected.classList.add('selected');
  }
  document.getElementById('exactTime').hidden = mode !== 'دقیق';
  document.getElementById('approxTime').hidden = mode !== 'تقریبی';

  const savedTimeDraft = timeDraft;
  const [year, month, day] = !savedTimeDraft && state.time.date ? state.time.date.split('/') : [];
  document.getElementById('dateYear').value = savedTimeDraft ? savedTimeDraft.year : faDigits(year || '');
  document.getElementById('dateMonth').value = savedTimeDraft ? savedTimeDraft.month : faDigits(month || '');
  document.getElementById('dateDay').value = savedTimeDraft ? savedTimeDraft.day : faDigits(day || '');
  document.getElementById('timeClock').value = savedTimeDraft ? savedTimeDraft.clock : state.time.clock || '';
  document.getElementById('approxText').value = savedTimeDraft ? savedTimeDraft.approximate : state.time.approximate || '';
}

function setTimeMode(button, mode) {
  document.querySelectorAll('#timePage .choice-btn').forEach(item => item.classList.remove('selected'));
  button.classList.add('selected');
  state.time = { mode };
  if (mode === 'اکنون') state.time.selectedAt = new Date().toISOString();
  document.getElementById('exactTime').hidden = mode !== 'دقیق';
  document.getElementById('approxTime').hidden = mode !== 'تقریبی';
  persistReportDraft();
}

function continueTime() {
  if (!state.time.mode) return alert('زمان را مشخص کنید.');
  if (state.time.mode === 'دقیق') {
    const day = enDigits(document.getElementById('dateDay').value);
    const month = enDigits(document.getElementById('dateMonth').value);
    const year = enDigits(document.getElementById('dateYear').value);
    const clock = document.getElementById('timeClock').value.trim();
    const dayNumber = Number(day), monthNumber = Number(month), yearNumber = Number(year);
    const clockPattern = /^(?:[01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!day || !month || !year || !clock) return alert('تاریخ و ساعت را کامل کنید.');
    if (dayNumber < 1 || dayNumber > 31 || monthNumber < 1 || monthNumber > 12 || yearNumber < 1300 || yearNumber > 1500) return alert('تاریخ واردشده معتبر نیست.');
    if (!clockPattern.test(enDigits(clock))) return alert('ساعت را به شکل ساعت:دقیقه وارد کنید.');
    state.time.date = `${year}/${month}/${day}`;
    state.time.clock = clock;
  }
  if (state.time.mode === 'تقریبی') {
    const approximate = document.getElementById('approxText').value.trim();
    if (!approximate) return alert('زمان تقریبی را وارد کنید.');
    state.time.approximate = approximate;
  }
  openLocation();
}

function locationData() {
  const data = typeof window !== 'undefined' ? window.IRAN_COUNTIES_BY_PROVINCE : null;
  return isPlainRecord(data) ? data : {};
}

function locationProvinceItems() {
  return Object.keys(locationData()).map(name => ({ value: name, label: name, search: name }));
}

function locationCountyItems(province) {
  const counties = locationData()[province];
  return Array.isArray(counties) ? counties.map(name => ({ value: name, label: name, search: name })) : [];
}

function setLocationModeVisual(mode) {
  document.querySelectorAll('#locationPage [data-location-mode]').forEach(button => {
    const selected = button.dataset.locationMode === mode;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}

function renderLocationFields() {
  const box = document.getElementById('locationFields');
  if (!box) return;
  const mode = state.location.mode;
  if (!['current', 'map', 'unknown'].includes(mode)) {
    box.innerHTML = '<p class="location-mode-guidance">ابتدا یکی از روش‌های تعیین مکان وقوع را انتخاب کنید.</p>';
    return;
  }

  const unknown = mode === 'unknown';
  const province = unknown ? state.location.province || '' : '';
  const city = unknown ? state.location.city || '' : '';
  const counties = locationCountyItems(province);
  if (unknown) delete state.location.address;
  const regionFields = unknown ? `<div class="location-region-fields">
    ${searchableSelectMarkup('locationProvince', 'استان مکان وقوع', locationProvinceItems(), { inputId: 'province', value: province, placeholder: 'استان را انتخاب کنید' })}
    ${searchableSelectMarkup('locationCounty', 'شهرستان مکان وقوع', counties, { inputId: 'city', value: city, placeholder: province ? 'شهرستان را انتخاب کنید' : 'ابتدا استان را انتخاب کنید', disabled: !province })}
  </div>` : '';
  const detailsField = unknown ? '' : `<div class="field-group location-address-field">
      <label for="address">جزئیات مکان وقوع</label>
      <textarea id="address" class="field-textarea" data-auto-resize="true" placeholder="شامل کدپستی، پلاک، طبقه و واحد و ...">${escapeHtml(state.location.address || '')}</textarea>
    </div>`;

  box.innerHTML = `${regionFields}${detailsField}`;
  box.querySelectorAll('[data-searchable-select]').forEach(updateSearchableSelectPresentation);
  const address = document.getElementById('address');
  if (address) resizeTextarea(address);
}

function updateLocationCountyPicker(province) {
  const component = document.querySelector('#locationFields [data-select-name="locationCounty"]');
  if (!component) return;
  const counties = locationCountyItems(province);
  setSearchableSelectItems(component, counties, {
    value: '',
    disabled: !province,
    placeholder: province ? 'شهرستان را انتخاب کنید' : 'ابتدا استان را انتخاب کنید'
  });
}

function clearLocationMarker() {
  if (marker && reportMap && typeof reportMap.removeLayer === 'function') reportMap.removeLayer(marker);
  marker = null;
}

function hideReportMap() {
  const wrap = document.getElementById('mapWrap');
  if (wrap) wrap.classList.remove('visible');
}

function initMap() {
  if (reportMap) return true;
  if (typeof L === 'undefined') return false;
  const mapElement = document.getElementById('reportMap');
  if (!mapElement) return false;
  reportMap = L.map(mapElement, { zoomControl: true, attributionControl: true }).setView([35.6892, 51.3890], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(reportMap);
  reportMap.on('click', event => setMapPoint(event.latlng.lat, event.latlng.lng));
  return true;
}

function showReportMap() {
  const wrap = document.getElementById('mapWrap');
  const status = document.getElementById('locationStatus');
  if (!initMap()) {
    if (status) status.textContent = 'نمایش نقشه در این مرورگر در دسترس نیست.';
    return false;
  }
  if (wrap) wrap.classList.add('visible');
  setTimeout(() => {
    if (reportMap && typeof reportMap.invalidateSize === 'function') reportMap.invalidateSize();
  }, 100);
  return true;
}

function restoreLocationMarker() {
  const latitude = Number(state.location.latitude);
  const longitude = Number(state.location.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !reportMap || typeof L === 'undefined') return;
  if (marker) marker.setLatLng([latitude, longitude]);
  else {
    marker = L.marker([latitude, longitude], { draggable: true }).addTo(reportMap);
    marker.on('dragend', event => {
      if (!['current', 'map'].includes(state.location.mode)) return;
      const point = event.target.getLatLng();
      state.location.latitude = point.lat;
      state.location.longitude = point.lng;
      persistReportDraft();
    });
  }
  reportMap.setView([latitude, longitude], Math.max(reportMap.getZoom ? reportMap.getZoom() : 6, 13));
}

function setMapPoint(lat, lng) {
  if (!['current', 'map'].includes(state.location.mode) || !initMap()) return;
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
  if (marker) marker.setLatLng([latitude, longitude]);
  else {
    marker = L.marker([latitude, longitude], { draggable: true }).addTo(reportMap);
    marker.on('dragend', event => {
      if (!['current', 'map'].includes(state.location.mode)) return;
      const point = event.target.getLatLng();
      state.location.latitude = point.lat;
      state.location.longitude = point.lng;
      persistReportDraft();
    });
  }
  state.location.latitude = latitude;
  state.location.longitude = longitude;
  state.location.known = true;
  const status = document.getElementById('locationStatus');
  if (status) status.textContent = state.location.mode === 'current' ? 'موقعیت فعلی ثبت شد.' : 'موقعیت انتخاب شد.';
  persistReportDraft();
}

function requestCurrentLocation() {
  const status = document.getElementById('locationStatus');
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    if (status) status.textContent = 'دسترسی به موقعیت فعلی در این مرورگر ممکن نیست؛ می‌توانید «انتخاب روی نقشه» را انتخاب کنید.';
    return;
  }
  const requestId = ++locationRequestSequence;
  if (status) status.textContent = 'در حال دریافت موقعیت فعلی؛ در صورت درخواست مرورگر، دسترسی GPS را تأیید کنید.';
  navigator.geolocation.getCurrentPosition(
    position => {
      if (state.location.mode !== 'current' || requestId !== locationRequestSequence) return;
      setMapPoint(position.coords.latitude, position.coords.longitude);
      if (reportMap && typeof reportMap.setView === 'function') reportMap.setView([position.coords.latitude, position.coords.longitude], 15);
    },
    () => {
      if (state.location.mode !== 'current' || requestId !== locationRequestSequence) return;
      if (status) status.textContent = 'دسترسی به موقعیت فعلی ممکن نشد؛ می‌توانید «انتخاب روی نقشه» را انتخاب کنید.';
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

function selectLocationMode(mode) {
  if (!['current', 'map', 'unknown'].includes(mode)) return;
  if (state.location.mode !== mode) {
    locationRequestSequence += 1;
    clearLocationMarker();
    state.location = { mode };
  }

  setLocationModeVisual(mode);
  renderLocationFields();
  const status = document.getElementById('locationStatus');
  if (mode === 'unknown') {
    hideReportMap();
    if (status) status.textContent = '';
  } else {
    showReportMap();
    restoreLocationMarker();
    if (mode === 'map' && status && !Number.isFinite(Number(state.location.latitude))) {
      status.textContent = 'نقطه مکان وقوع را روی نقشه انتخاب کنید.';
    }
    if (mode === 'current' && !Number.isFinite(Number(state.location.latitude))) requestCurrentLocation();
  }
  persistReportDraft();
}

function openLocation() {
  const mode = ['current', 'map', 'unknown'].includes(state.location.mode) ? state.location.mode : '';
  setLocationModeVisual(mode);
  renderLocationFields();
  const status = document.getElementById('locationStatus');
  if (mode === 'current' || mode === 'map') {
    showReportMap();
    restoreLocationMarker();
    if (status) {
      if (Number.isFinite(Number(state.location.latitude))) status.textContent = mode === 'current' ? 'موقعیت فعلی ثبت شده است.' : 'موقعیت انتخاب‌شده روی نقشه ثبت شده است.';
      else status.textContent = mode === 'map' ? 'نقطه مکان وقوع را روی نقشه انتخاب کنید.' : 'برای دریافت موقعیت فعلی، گزینه را دوباره انتخاب کنید.';
    }
  } else {
    hideReportMap();
    if (status) status.textContent = '';
  }
  showPage('locationPage');
}

function continueLocation() {
  captureLocationDraft();
  const mode = state.location.mode;
  if (!['current', 'map', 'unknown'].includes(mode)) return alert('روش تعیین مکان وقوع را انتخاب کنید.');
  if (mode === 'unknown') {
    if (!state.location.province) return alert('استان مکان وقوع را انتخاب کنید.');
    if (!state.location.city) return alert('شهرستان مکان وقوع را انتخاب کنید.');
    state.location.known = false;
    delete state.location.latitude;
    delete state.location.longitude;
  } else {
    if (!Number.isFinite(Number(state.location.latitude)) || !Number.isFinite(Number(state.location.longitude))) {
      return alert(mode === 'current' ? 'دریافت موقعیت فعلی کامل نشده است.' : 'نقطه مکان وقوع را روی نقشه انتخاب کنید.');
    }
    state.location.known = true;
    delete state.location.province;
    delete state.location.city;
  }
  if (state.category === 'افراد') return openIncidentReport();
  openDocuments();
}


function openIncidentReport() {
  renderIncidentReport();
  showPage('incidentReportPage');
}

function continueIncidentReport() {
  collectForm();
  if (!validateVisibleFormFields()) return;
  openDocuments();
}

function backFromIncidentReport() {
  collectForm();
  openLocation();
}

function backFromDocuments() {
  if (state.category === 'افراد') return openIncidentReport();
  showPage('locationPage');
}

function openDocuments() {
  const title = document.getElementById('documentsPageTitle');
  if (title) title.textContent = 'مستندات گزارش';
  renderDocuments();
  showPage('documentsPage');
}

function isImageDocument(document) {
  return Boolean(document) && typeof document.mime === 'string' && document.mime.startsWith('image/');
}

let documentSequence = 0;

function documentTypeLabel(document) {
  if (isImageDocument(document)) return 'تصویر';
  const extension = typeof document.name === 'string' && document.name.includes('.')
    ? document.name.split('.').pop().slice(0, 8).toUpperCase()
    : '';
  return extension || 'فایل';
}

function formatDocumentSize(bytes) {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size < 0) return '';
  if (size < 1024 * 1024) return `${faDigits(Math.max(1, Math.round(size / 1024)))} کیلوبایت`;
  const megabytes = Math.round((size / (1024 * 1024)) * 10) / 10;
  return `${faDigits(megabytes)} مگابایت`;
}

function documentIsReading(document) {
  return Boolean(document) && document.status === 'reading';
}

function documentStatusText(document) {
  if (documentIsReading(document)) return `در حال آماده‌سازی ${faDigits(Math.round(Number(document.progress) || 0))}٪`;
  if (document && document.status === 'error') return document.error || 'خواندن فایل انجام نشد';
  const type = documentTypeLabel(document);
  const size = formatDocumentSize(document && document.size);
  return size ? `${type} · ${size}` : type;
}

function updateDocumentUploadCard() {
  const card = document.querySelector('.document-upload-card');
  const input = document.getElementById('documentInput');
  const atLimit = state.documents.length >= MAX_DOCUMENTS;
  const isReading = state.documents.some(documentIsReading);
  if (card) {
    card.classList.toggle('is-full', atLimit);
    card.classList.toggle('is-reading', isReading);
    card.setAttribute('aria-busy', String(isReading));
  }
  if (input) input.disabled = atLimit;
}

function addDocuments(input) {
  setDocumentTransferStatus();
  const selectedFiles = Array.from(input.files || []);
  const slots = Math.max(0, MAX_DOCUMENTS - state.documents.length);
  const withinSizeLimit = selectedFiles.filter(file => Number.isFinite(file.size) && file.size <= MAX_DOCUMENT_BYTES);
  const accepted = withinSizeLimit.slice(0, slots);
  const oversized = selectedFiles.length - withinSizeLimit.length;
  const overCount = Math.max(0, withinSizeLimit.length - slots);

  if (oversized || overCount) {
    const notices = [];
    if (oversized) notices.push(`هر فایل باید حداکثر ${faDigits(100)} مگابایت باشد.`);
    if (overCount) notices.push(`حداکثر ${faDigits(MAX_DOCUMENTS)} فایل قابل بارگذاری است.`);
    alert(notices.join(' '));
  }
  if (typeof FileReader === 'undefined') {
    if (accepted.length) alert('خواندن فایل در این مرورگر در دسترس نیست.');
    input.value = '';
    return;
  }

  accepted.forEach(file => {
    const entry = {
      id: `document-${++documentSequence}`,
      type: String(file.type || '').startsWith('image/') ? 'image' : 'file',
      name: file.name || 'فایل بدون نام',
      mime: file.type || 'application/octet-stream',
      size: file.size,
      status: 'reading',
      progress: 0,
      data: ''
    };
    state.documents.push(entry);
    const reader = new FileReader();
    reader.onprogress = event => {
      if (!state.documents.includes(entry)) return;
      if (event.lengthComputable && event.total > 0) entry.progress = Math.min(100, (event.loaded / event.total) * 100);
      renderDocuments();
    };
    reader.onload = () => {
      if (!state.documents.includes(entry)) return;
      if (typeof reader.result !== 'string') {
        entry.status = 'error';
        entry.error = 'خواندن فایل انجام نشد';
      } else {
        entry.data = reader.result;
        entry.status = 'ready';
        entry.progress = 100;
      }
      renderDocuments();
    };
    reader.onerror = reader.onabort = () => {
      if (!state.documents.includes(entry)) return;
      entry.status = 'error';
      entry.error = 'خواندن فایل انجام نشد';
      renderDocuments();
    };
    try {
      reader.readAsDataURL(file);
    } catch (error) {
      entry.status = 'error';
      entry.error = 'خواندن فایل انجام نشد';
      renderDocuments();
    }
  });
  input.value = '';
  renderDocuments();
}

function documentProgressMarkup(document) {
  if (!documentIsReading(document)) return '';
  const progress = Math.max(0, Math.min(100, Math.round(Number(document.progress) || 0)));
  return `<span class="document-item-progress"><span>در حال آماده‌سازی</span><progress max="100" value="${progress}">${faDigits(progress)}٪</progress><b>${faDigits(progress)}٪</b></span>`;
}

function renderDocuments() {
  const box = document.getElementById('documentList');
  if (!box) return;
  updateDocumentUploadCard();
  if (!state.documents.length) {
    box.innerHTML = '<div class="document-empty-state"><strong>امکان انتخاب چند فایل وجود دارد</strong><span>تصویر، PDF و سایر مستندات را می‌توانید با هم بارگذاری کنید.</span></div>';
    return;
  }
  box.innerHTML = state.documents.map((document, index) => {
    const imagePreview = isImageDocument(document) && typeof document.data === 'string' && document.data
      ? `<img src="${escapeHtml(document.data)}" alt="">`
      : `<span class="document-file-preview" aria-hidden="true">${iconMarkup('report', 'document-file-icon')}</span>`;
    const errorClass = document.status === 'error' ? ' is-error' : '';
    return `<div class="document-item${errorClass}">
      ${imagePreview}
      <span class="document-item-copy"><strong>${escapeHtml(document.name)}</strong><small>${escapeHtml(documentStatusText(document))}</small>${documentProgressMarkup(document)}</span>
      <button class="document-delete-button" type="button" aria-label="حذف فایل ${faDigits(index + 1)}" onclick="removeDocument(${index})">${iconMarkup('trash', 'button-icon delete-icon')}<span>حذف</span></button>
    </div>`;
  }).join('');
}

function removeDocument(index) {
  state.documents.splice(index, 1);
  setDocumentTransferStatus();
  renderDocuments();
}

function setDocumentTransferStatus(message = '', progress = null, isError = false) {
  const status = document.getElementById('documentTransferStatus');
  if (!status) return;
  if (!message) {
    status.hidden = true;
    status.classList.remove('is-error');
    status.textContent = '';
    return;
  }
  status.hidden = false;
  status.classList.toggle('is-error', isError);
  const validProgress = Number.isFinite(progress);
  const normalizedProgress = validProgress ? Math.max(0, Math.min(100, Math.round(progress))) : 0;
  status.innerHTML = `<span>${escapeHtml(message)}${validProgress ? ` ${faDigits(normalizedProgress)}٪` : ''}</span><span class="document-transfer-track${validProgress ? '' : ' is-indeterminate'}" aria-hidden="true"><i style="--document-transfer-progress:${normalizedProgress}%"></i></span>`;
}

function submitReportPayload(payload, onProgress) {
  if (typeof XMLHttpRequest === 'undefined') {
    return fetch('app/report-handler.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(async response => {
      let output = {};
      try { output = await response.json(); } catch (error) { /* handled below */ }
      if (!response.ok || !output.ok) throw new Error(output.message || 'ثبت گزارش انجام نشد.');
      return output;
    });
  }

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', 'app/report-handler.php', true);
    request.setRequestHeader('Content-Type', 'application/json');
    if (request.upload) {
      request.upload.onprogress = event => {
        if (event.lengthComputable && event.total > 0) onProgress((event.loaded / event.total) * 100);
        else onProgress(null);
      };
    }
    request.onload = () => {
      let output = {};
      try { output = JSON.parse(request.responseText || '{}'); } catch (error) { /* handled below */ }
      if (request.status >= 200 && request.status < 300 && output.ok) resolve(output);
      else reject(new Error(output.message || 'ثبت گزارش انجام نشد.'));
    };
    request.onerror = () => reject(new Error('ارتباط با سرور برقرار نشد.'));
    request.onabort = () => reject(new Error('ارسال گزارش متوقف شد.'));
    request.send(JSON.stringify(payload));
  });
}

async function sendReport() {
  collectForm();
  const pendingDocument = state.documents.find(document => documentIsReading(document));
  if (pendingDocument) {
    setDocumentTransferStatus('بارگذاری فایل‌ها هنوز کامل نشده است؛ لطفاً صبر کنید.');
    return;
  }
  const failedDocument = state.documents.find(document => document.status === 'error' || !document.data);
  if (failedDocument) {
    setDocumentTransferStatus('یک فایل آماده نشده است؛ آن را حذف و دوباره انتخاب کنید.', null, true);
    return;
  }

  const payload = {
    reportType: 'گزارش',
    category: state.category,
    subtype: state.subtype,
    form: state.form,
    location: state.location,
    time: state.time,
    documents: state.documents.map(document => ({
      type: document.type,
      name: document.name,
      mime: document.mime,
      size: document.size,
      data: document.data
    }))
  };

  const button = document.querySelector('#documentsPage .primary-button');
  const success = document.getElementById('successBox');
  if (!button) return;
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  success.textContent = '';
  setDocumentTransferStatus(state.documents.length ? 'در حال ارسال گزارش و مستندات' : 'در حال ارسال گزارش', 0);

  try {
    await submitReportPayload(payload, progress => {
      setDocumentTransferStatus(state.documents.length ? 'در حال ارسال گزارش و مستندات' : 'در حال ارسال گزارش', progress);
    });
    hasSubmittedReport = true;
    clearReportDraft();
    setDocumentTransferStatus('ارسال گزارش با موفقیت کامل شد.', 100);
    success.textContent = 'گزارش با موفقیت ثبت شد.';
  } catch (error) {
    setDocumentTransferStatus(error.message || 'ثبت گزارش انجام نشد.', null, true);
    success.textContent = '';
  } finally {
    button.disabled = false;
    button.removeAttribute('aria-busy');
  }
}
if (!restoreReportDraft()) {
  renderReportRoadmaps();
  normalizeVisibleNumbers();
}
