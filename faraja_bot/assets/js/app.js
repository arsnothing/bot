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
const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const EN_DIGITS = '0123456789';

function faDigits(value) {
  return String(value ?? '').replace(/[0-9]/g, d => FA_DIGITS[Number(d)]);
}

function enDigits(value) {
  return String(value ?? '').replace(/[۰-۹]/g, d => EN_DIGITS[FA_DIGITS.indexOf(d)]);
}

function normalizeVisibleNumbers() {
  document.querySelectorAll('body *').forEach(el => {
    if (el.children.length === 0 && el.textContent.trim()) {
      el.textContent = faDigits(el.textContent);
    }
  });
  document.querySelectorAll('input, textarea').forEach(el => {
    if (el.value) el.value = faDigits(el.value);
  });
}

document.addEventListener('input', event => {
  if (event.target.matches('input, textarea')) {
    event.target.value = faDigits(event.target.value);
  }
});

function showPage(id) {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  const page = document.getElementById(id);
  if (!page) return;
  page.classList.add('active');
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

function chooseCategory(category) {
  state.category = category;
  state.subtype = '';
  state.form = {};
  state.formStep = 0;
  if (category === 'شیء') return showPage('objectTypePage');
  if (category === 'پدیده اجتماعی') return showPage('phenomenonTypePage');
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
  if (type === 'textarea') {
    return `<div class="field-group"><label>${label}</label><textarea class="field-textarea ${numeric}" data-field="${name}"></textarea></div>`;
  }
  return `<div class="field-group"><label>${label}</label><input class="field-input ${numeric}" data-field="${name}" type="${type}" inputmode="${options.numeric ? 'numeric' : 'text'}"></div>`;
}

function choices(name, label, items) {
  return `<div class="field-group"><label>${label}</label><div class="choice-row" data-choice="${name}">${items.map(item => `<button type="button" class="choice-btn" onclick="pickChoice(this,'${name}','${item.replace(/'/g, "\\'")}')">${item}</button>`).join('')}</div></div>`;
}

function yesNo(name, label) {
  return choices(name, label, ['بله', 'خیر', 'نامشخص']);
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
  actions.className = `form-actions${state.formStep === 0 ? ' first-step' : ''}`;
  actions.innerHTML = `
    ${state.formStep > 0 ? '<button class="secondary-button" onclick="previousFormSection()" type="button">مرحله قبل</button>' : ''}
    <button class="primary-button" onclick="${isLast ? 'continueForm()' : 'nextFormSection()'}" type="button">${isLast ? 'تأیید فرم' : 'مرحله بعد'}</button>`;

  restoreFormValues();
  setTimeout(normalizeVisibleNumbers, 0);
}

function buildForm(category, subtype) {
  if (category === 'فرد') return personForm();
  if (category === 'ملک') return propertyForm();
  if (category === 'شیء') return objectForm(subtype);
  if (category === 'پدیده اجتماعی') return phenomenonForm(subtype);
  return orgForm();
}

function personForm() {
  return [
    formSection('مشخصات فردی',
      `${field('firstName','نام')}${field('lastName','نام خانوادگی')}${field('nationalId','کد ملی','text',{numeric:true})}${field('age','سن','text',{numeric:true})}${choices('gender','جنسیت',['مرد','زن','نامشخص'])}`,
      'اطلاعات پایه برای شناسایی فرد را وارد کنید.'),
    formSection('مشخصات ظاهری',
      `${field('height','قد','text',{numeric:true})}${field('weight','وزن','text',{numeric:true})}${field('face','رنگ چهره')}${field('hairStatus','وضعیت موی سر')}${field('hairColor','رنگ مو')}${field('beard','محاسن')}${field('appearance','ویژگی خاص','textarea')}`,
      'ویژگی‌های ظاهری قابل مشاهده را ثبت کنید.'),
    formSection('ارتباط و فضای مجازی',
      `${field('phoneFixed','تلفن ثابت','text',{numeric:true})}${field('phoneMobile','تلفن همراه','text',{numeric:true})}${field('phoneWork','تلفن محل کار','text',{numeric:true})}${field('phoneHome','تلفن منزل','text',{numeric:true})}${field('social','نشانی‌های فضای مجازی','textarea')}`,
      'راه‌های ارتباطی یا نشانی‌های مرتبط را وارد کنید.'),
    formSection('موضوع گزارش',
      `${field('workAddress','آدرس محل کار','textarea')}${field('homeAddress','آدرس منزل','textarea')}${field('crimeType','نوع جرم یا تخلف','textarea')}${field('crimeMethod','نحوه ارتکاب و ترتیب وقوع','textarea')}${field('crimePlace','آدرس و مشخصات مکان وقوع','textarea')}${field('crimeDate','زمان وقوع یا زمان احتمالی','textarea')}${field('relatedPeople','همکاران و افراد مرتبط','textarea')}${field('source','نحوه اطلاع منبع','textarea')}`,
      'جزئیات رخداد و نحوه اطلاع خود را ثبت کنید.')
  ];
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
  document.querySelectorAll('#formBody [data-field]').forEach(element => {
    const value = element.value.trim();
    if (value) data[element.dataset.field] = value;
    else delete data[element.dataset.field];
  });
  document.querySelectorAll('#formBody [data-choice]').forEach(row => {
    const selected = row.querySelector('.selected');
    if (selected) data[row.dataset.choice] = selected.dataset.value || selected.textContent.trim();
    else delete data[row.dataset.choice];
  });
  state.form = data;
}

function restoreFormValues() {
  Object.entries(state.form).forEach(([name, value]) => {
    const fieldElement = document.querySelector(`#formBody [data-field="${CSS.escape(name)}"]`);
    if (fieldElement) fieldElement.value = value;
    const row = document.querySelector(`#formBody [data-choice="${CSS.escape(name)}"]`);
    if (row) {
      row.querySelectorAll('.choice-btn').forEach(button => {
        if (button.textContent.trim() === value) {
          button.classList.add('selected');
          button.dataset.value = value;
        }
      });
    }
  });
}

function continueForm() {
  collectForm();
  if (!Object.keys(state.form).length) return alert('حداقل یکی از اطلاعات گزارش را وارد کنید.');
  openTime();
}

function backFromForm() {
  if (state.formStep > 0) return previousFormSection();
  collectForm();
  if (state.category === 'شیء') return showPage('objectTypePage');
  if (state.category === 'پدیده اجتماعی') return showPage('phenomenonTypePage');
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
  openDocuments();
}

function openDocuments() {
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
      <button type="button" onclick="removeDocument(${index})">حذف</button>
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

normalizeVisibleNumbers();
