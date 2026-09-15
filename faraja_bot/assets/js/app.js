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

function normalizeFieldValue(element) {
  if (element.type === 'file') return;
  let value = faDigits(element.value);

  if (element.dataset.numeric === 'true') {
    value = value.replace(/[^۰-۹]/g, '');
    const maxLength = Number(element.getAttribute('maxlength'));
    if (Number.isInteger(maxLength) && maxLength > 0) value = value.slice(0, maxLength);
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
  if (event.target.matches('input, textarea')) {
    normalizeFieldValue(event.target);
    resizeTextarea(event.target);
  }
});

function showPage(id) {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  const page = document.getElementById(id);
  if (!page) return;
  page.classList.add('active');
  renderReportRoadmaps();
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
  marker = null;
  reportMap = null;
}

function startReport() {
  resetReport();
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
  const placeholder = options.placeholder ? ` placeholder="${options.placeholder}"` : '';
  const validation = options.validation ? ` data-validation="${options.validation}"` : '';
  const numericRule = options.numeric ? ' data-numeric="true"' : '';
  const textRule = options.textOnly ? ' data-text-only="true"' : '';
  const attributes = `data-field="${name}" data-label="${label}"${numericRule}${textRule}${validation}${maxLength}${placeholder}`;

  if (type === 'textarea') {
    return `<div class="field-group"><label>${label}</label><textarea class="field-textarea ${numeric} ${textOnly}" ${attributes} data-auto-resize="true"></textarea></div>`;
  }
  return `<div class="field-group"><label>${label}</label><input class="field-input ${numeric} ${textOnly}" ${attributes} type="${type}" inputmode="${options.numeric ? 'numeric' : 'text'}"></div>`;
}

function choices(name, label, items, options = {}) {
  const columns = options.columns === 3 ? ' choice-row--three' : '';
  return `<div class="field-group"><label>${label}</label><div class="choice-row${columns}" data-choice="${name}">${items.map(item => `<button type="button" class="choice-btn" onclick="pickChoice(this,'${name}','${item.replace(/'/g, "\\'")}')">${item}</button>`).join('')}</div></div>`;
}

function yesNo(name, label) {
  return choices(name, label, ['بله', 'خیر', 'نامشخص'], { columns: 3 });
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
  if (element.dataset.validation === 'height' && (!/^\d{1,3}$/.test(digits) || Number(digits) < 30 || Number(digits) > 250)) {
    return `${label} باید عددی تا ۳ رقم و بین ۳۰ تا ۲۵۰ سانتی‌متر باشد.`;
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
  const primaryLabel = isLast ? 'تأیید فرم' : 'مرحله بعد';
  const primaryIcon = isLast ? iconMarkup('check', 'button-icon action-icon') : iconMarkup('arrow-next', 'button-icon action-icon');
  actions.className = `form-actions${state.formStep === 0 ? ' first-step' : ''}`;
  actions.innerHTML = `
    ${state.formStep > 0 ? `<button class="secondary-button button-with-icon" onclick="previousFormSection()" type="button">${iconMarkup('arrow-previous', 'button-icon action-icon')}<span>مرحله قبل</span></button>` : ''}
    <button class="primary-button button-with-icon" onclick="${isLast ? 'continueForm()' : 'nextFormSection()'}" type="button"><span>${primaryLabel}</span>${primaryIcon}</button>`;

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
      `${field('firstName','نام','text',{textOnly:true})}${field('lastName','نام خانوادگی','text',{textOnly:true})}${field('nationalId','کد ملی','text',{numeric:true,maxLength:10,validation:'national-id',placeholder:'۱۰ رقم'})}${field('age','سن','text',{numeric:true,maxLength:3,validation:'age',placeholder:'مثلاً ۳۵'})}${choices('gender','جنسیت',['مرد','زن'])}`,
      'اطلاعات پایه برای شناسایی فرد را وارد کنید.'),
    formSection('مشخصات ظاهری',
      `${field('height','قد (سانتی‌متر)','text',{numeric:true,maxLength:3,validation:'height',placeholder:'مثلاً ۱۷۵'})}${choices('bodyBuild','اندام',['لاغر','معمولی','چاق'],{columns:3})}${field('face','رنگ چهره','text',{textOnly:true})}${field('hairStatus','وضعیت موی سر','text',{textOnly:true})}${field('hairColor','رنگ مو','text',{textOnly:true})}${field('beard','محاسن','text',{textOnly:true})}${field('appearance','ویژگی خاص','textarea')}`,
      'ویژگی‌های ظاهری قابل مشاهده را ثبت کنید.'),
    formSection('ارتباط و فضای مجازی',
      `${field('phoneFixed','تلفن ثابت','text',{numeric:true,maxLength:11,validation:'phone',placeholder:'۱۱ رقم'})}${field('phoneMobile','تلفن همراه','text',{numeric:true,maxLength:11,validation:'phone',placeholder:'۱۱ رقم'})}${field('phoneWork','تلفن محل کار','text',{numeric:true,maxLength:11,validation:'phone',placeholder:'۱۱ رقم'})}${field('phoneHome','تلفن منزل','text',{numeric:true,maxLength:11,validation:'phone',placeholder:'۱۱ رقم'})}${field('social','نشانی‌های فضای مجازی','textarea')}`,
      'راه‌های ارتباطی یا نشانی‌های مرتبط را وارد کنید.'),
    formSection('نشانی‌های مرتبط',
      `${field('workAddress','آدرس محل کار','textarea')}${field('homeAddress','آدرس منزل','textarea')}`,
      'نشانی‌های شناخته‌شده و مرتبط با فرد را وارد کنید.')
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
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function previousFormSection() {
  if (state.formStep === 0) return;
  collectForm();
  state.formStep -= 1;
  renderFormSection();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function pickChoice(button, name, value) {
  const row = button.parentElement;
  row.querySelectorAll('.choice-btn').forEach(item => item.classList.remove('selected'));
  button.classList.add('selected');
  button.dataset.value = value;
}

function collectForm() {
  const data = { ...state.form };
  delete data.priority;
  delete data.weight;
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
  state.form = data;
}

function restoreFormValues() {
  Object.entries(state.form).forEach(([name, value]) => {
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
  if (!Object.keys(state.form).length) return alert('حداقل یکی از اطلاعات گزارش را وارد کنید.');
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
  if (state.time.date) {
    const [year, month, day] = state.time.date.split('/');
    document.getElementById('dateYear').value = faDigits(year || '');
    document.getElementById('dateMonth').value = faDigits(month || '');
    document.getElementById('dateDay').value = faDigits(day || '');
  }
  document.getElementById('timeClock').value = state.time.clock || '';
  document.getElementById('approxText').value = state.time.approximate || '';
}

function setTimeMode(button, mode) {
  document.querySelectorAll('#timePage .choice-btn').forEach(item => item.classList.remove('selected'));
  button.classList.add('selected');
  state.time = { mode };
  if (mode === 'الان') state.time.selectedAt = new Date().toISOString();
  document.getElementById('exactTime').hidden = mode !== 'دقیق';
  document.getElementById('approxTime').hidden = mode !== 'تقریبی';
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
  });
  state.location.latitude = lat;
  state.location.longitude = lng;
  state.location.known = true;
  document.getElementById('locationStatus').textContent = 'موقعیت انتخاب شد';
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
    success.textContent = 'گزارش با موفقیت ثبت شد.';
  } catch (error) {
    success.textContent = error.message || 'ثبت گزارش انجام نشد.';
  } finally {
    button.disabled = false;
  }
}

renderReportRoadmaps();
normalizeVisibleNumbers();
