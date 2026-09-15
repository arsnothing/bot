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

const STANDARD_REPORT_STEPS = Object.freeze(['فرم', 'زمان', 'مکان', 'تصویر']);
const PEOPLE_REPORT_STEPS = Object.freeze([
  'اطلاعات شناسایی',
  'زمان وقوع',
  'مکان وقوع',
  'گزارش وقوع',
  'مستندات'
]);

const DRAFT_STORAGE_KEY = 'faraja-report-draft-v1';
const DRAFT_VERSION = 1;
const REPORT_CATEGORIES = new Set(['افراد', 'املاک', 'اشیاء', 'رویداد', 'نهاد و سازمان']);
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
  state.location = {
    ...state.location,
    province: readFieldValue('province').trim(),
    city: readFieldValue('city').trim(),
    address: readFieldValue('address').trim()
  };
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
    // تصویرهای انتخاب‌شده به‌علت محدودیت ظرفیت localStorage ذخیره نمی‌شوند.
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
  if (!textarea.matches('#formBody textarea[data-auto-resize="true"], #incidentReportBody textarea[data-auto-resize="true"]')) return;
  const maxHeight = 280;
  textarea.style.height = 'auto';
  const height = Math.min(Math.max(textarea.scrollHeight, 52), maxHeight);
  textarea.style.height = `${height}px`;
  textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
}

function normalizeVisibleNumbers() {
  document.querySelectorAll('body *').forEach(el => {
    if (el.children.length === 0 && el.textContent.trim()) {
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
  if (target.matches('[data-social-link-value]')) {
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
  if (!target || typeof target.closest !== 'function' || target.closest('[data-social-links]')) return;
  closeSocialPlatformMenus();
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeSocialPlatformMenus();
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
  marker = null;
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
  const inputMode = options.numeric ? 'numeric' : type === 'email' ? 'email' : 'text';
  const attributes = `data-field="${name}" data-label="${label}"${numericRule}${textRule}${validation}${maxLength}${maxValue}${placeholder}${direction}`;

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
  return orgForm();
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
      'شماره‌های تماس و نشانی‌های مرتبط را وارد کنید.')
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

function orgForm() {
  return [
    formSection('مشخصات نهاد یا سازمان',
      `${field('orgName','نام نهاد یا سازمان')}${choices('orgType','نوع نهاد یا سازمان',['دولتی','خصوصی','نظامی','انتظامی','عمومی','غیردولتی','نامشخص'])}${field('orgAddress','محل و آدرس','textarea')}`,
      'نام، نوع و نشانی نهاد یا سازمان را وارد کنید.'),
    formSection('فعالیت و افراد مرتبط',
      `${field('orgActivity','حوزه و نوع فعالیت','textarea')}${field('orgManager','مسئول یا مدیر مرتبط')}${field('orgPeople','افراد مرتبط','textarea')}`,
      'حوزه فعالیت و افراد مرتبط را ثبت کنید.'),
    formSection('موضوع و منبع گزارش',
      `${field('orgReason','موضوع و علت گزارش','textarea')}${field('orgActions','اقدامات یا نحوه وقوع','textarea')}${field('source','نحوه اطلاع منبع','textarea')}`,
      'موضوع گزارش و نحوه اطلاع خود را شرح دهید.')
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
  const mode = state.time.mode;
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
  if (mode === 'الان') state.time.selectedAt = new Date().toISOString();
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

function openLocation() {
  document.getElementById('province').value = state.location.province || '';
  document.getElementById('city').value = state.location.city || '';
  document.getElementById('address').value = state.location.address || '';
  document.getElementById('locationStatus').textContent = '';
  showPage('locationPage');
}

function initMap() {
  if (reportMap) return;
  reportMap = L.map('reportMap', { zoomControl: true, attributionControl: true }).setView([35.6892, 51.3890], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(reportMap);
  reportMap.on('click', event => setMapPoint(event.latlng.lat, event.latlng.lng));
}

function enableMapPick() {
  initMap();
  document.getElementById('mapWrap').classList.add('visible');
  document.getElementById('locationStatus').textContent = '';
  setTimeout(() => reportMap.invalidateSize(), 100);
}

function setMapPoint(lat, lng) {
  initMap();
  if (marker) marker.setLatLng([lat, lng]);
  else marker = L.marker([lat, lng], { draggable: true }).addTo(reportMap);
  marker.on('dragend', event => {
    const point = event.target.getLatLng();
    state.location.latitude = point.lat;
    state.location.longitude = point.lng;
    persistReportDraft();
  });
  state.location.latitude = lat;
  state.location.longitude = lng;
  state.location.known = true;
  document.getElementById('locationStatus').textContent = 'موقعیت انتخاب شد';
  persistReportDraft();
}

function useCurrentLocation() {
  if (!navigator.geolocation) {
    document.getElementById('locationStatus').textContent = 'موقعیت فعلی در دسترس نیست';
    return;
  }
  navigator.geolocation.getCurrentPosition(
    position => {
      setMapPoint(position.coords.latitude, position.coords.longitude);
      enableMapPick();
      reportMap.setView([position.coords.latitude, position.coords.longitude], 15);
    },
    () => {
      document.getElementById('locationStatus').textContent = 'دسترسی به موقعیت فعلی ممکن نیست';
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

function locationUnknown() {
  state.location.known = false;
  delete state.location.latitude;
  delete state.location.longitude;
  document.getElementById('locationStatus').textContent = '';
  persistReportDraft();
}

function continueLocation() {
  state.location.province = document.getElementById('province').value.trim();
  state.location.city = document.getElementById('city').value.trim();
  state.location.address = document.getElementById('address').value.trim();
  if (state.location.known === undefined) state.location.known = false;
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
  if (title) title.textContent = state.category === 'افراد' ? 'مستندات گزارش' : 'تصویر گزارش';
  renderDocuments();
  showPage('documentsPage');
}

function addDocuments(input) {
  const files = Array.from(input.files || []).filter(file => file.type.startsWith('image/')).slice(0, 10);
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = () => {
      state.documents.push({ type: 'image', name: file.name, mime: file.type, data: reader.result });
      renderDocuments();
    };
    reader.readAsDataURL(file);
  });
  input.value = '';
}

function renderDocuments() {
  const box = document.getElementById('documentList');
  box.innerHTML = state.documents.map((document, index) => `
    <div class="document-item">
      <img src="${document.data}" alt="">
      <span>${document.name}</span>
      <button class="document-delete-button" type="button" aria-label="حذف تصویر ${faDigits(index + 1)}" onclick="removeDocument(${index})">${iconMarkup('trash', 'button-icon delete-icon')}<span>حذف</span></button>
    </div>`).join('');
}

function removeDocument(index) {
  state.documents.splice(index, 1);
  renderDocuments();
}

async function sendReport() {
  collectForm();
  const payload = {
    reportType: 'گزارش',
    category: state.category,
    subtype: state.subtype,
    form: state.form,
    location: state.location,
    time: state.time,
    documents: state.documents
  };

  const button = document.querySelector('#documentsPage .primary-button');
  const success = document.getElementById('successBox');
  button.disabled = true;
  success.textContent = '';

  try {
    const response = await fetch('app/report-handler.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const output = await response.json();
    if (!response.ok || !output.ok) throw new Error(output.message || 'ثبت گزارش انجام نشد.');
    hasSubmittedReport = true;
    clearReportDraft();
    success.textContent = 'گزارش با موفقیت ثبت شد.';
  } catch (error) {
    success.textContent = error.message || 'ثبت گزارش انجام نشد.';
  } finally {
    button.disabled = false;
  }
}

if (!restoreReportDraft()) {
  renderReportRoadmaps();
  normalizeVisibleNumbers();
}
