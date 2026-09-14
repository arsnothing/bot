<?php
declare(strict_types=1);
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
require_once __DIR__ . '/app/report-handler.php';
handleReportRequest();
require __DIR__ . '/includes/header.php';
?>

<section id="homePage" class="page active">
  <main class="home-content">
    <div class="home-brand">
      <img class="home-logo" src="src/NAJA.webp" alt="لوگو">
    </div>
    <p style="font-size:14px;font-weight:600;">كُونُوا قَوَّامِينَ لِلَّهِ شُهَدَاءَ بِالْقِسْطِ</p>
    <section class="home-quote" aria-label="گزیده‌ای از بیانات درباره امنیت">
      <p>امنیت پایدار، بدون مشارکت و همراهی مردم امکان پذیر نیست.</p>
      <span>قائد شهید امت آیت‌الله سیدعلی خامنه‌ای</span>
    </section>
    <section class="welcome">
      <p>
       هر گزارش مسئولانه شما، گامی مؤثر در مقابله با تهدیدات نوین و پاسداری از امنیت پایدار ایران عزیز اسلامی است؛<br> از این همراهی ارزشمند و مسئولیت پذیری شما سپاسگزاریم.
      </p>
      <div class="signature"> فرماندهی انتظامی جمهوری اسلامی ایران</div>
    </section>

    <div class="home-buttons">
      <button class="main-card" onclick="startReport()" type="button">
        <strong>ثبت گزارش</strong>
      </button>
    </div>
  </main>
</section>

<section id="categoryPage" class="page">
  <main class="shell">
    <button class="back-button" onclick="showPage('homePage')" type="button"><span>بازگشت</span><span class="back-arrow"></span></button>
    <div class="page-head"><h1>موضوع گزارش</h1></div>
    <div class="category-grid">
      <button class="category-card" onclick="chooseCategory('فرد')" type="button">
        <svg class="category-icon" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="19" r="10"/><path d="M14 55c1.5-11 8-18 18-18s16.5 7 18 18"/><path d="M20 35c3.2 3 7.2 4.5 12 4.5S40.8 38 44 35"/></svg><strong>فرد</strong>
      </button>
      <button class="category-card" onclick="chooseCategory('پدیده اجتماعی')" type="button">
        <svg class="category-icon" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="18" r="8"/><circle cx="15" cy="27" r="6"/><circle cx="49" cy="27" r="6"/><path d="M20 55c1-11 5-18 12-18s11 7 12 18M5 54c1-9 4-14 10-14s9 5 10 14M39 54c1-9 4-14 10-14s9 5 10 14"/></svg><strong>پدیده اجتماعی</strong>
      </button>
      <button class="category-card" onclick="chooseCategory('ملک')" type="button">
        <svg class="category-icon" viewBox="0 0 64 64" aria-hidden="true"><path d="M8 27 32 9l24 18v29H8V27Z"/><path d="M16 56V33h32v23M24 56V42h16v14M20 24h24"/></svg><strong>ملک</strong>
      </button>
      <button class="category-card" onclick="chooseCategory('شیء')" type="button">
        <svg class="category-icon" viewBox="0 0 64 64" aria-hidden="true"><path d="M18 14h28l8 8v28H18a8 8 0 0 1-8-8V22a8 8 0 0 1 8-8Z"/><path d="M46 14v10h10M23 31h20M23 40h14"/></svg><strong>شیء</strong>
      </button>
    </div>
  </main>
</section>

<section id="objectTypePage" class="page">
  <main class="shell">
    <button class="back-button" onclick="showPage('categoryPage')" type="button"><span>بازگشت</span><span class="back-arrow"></span></button>
    <div class="page-head"><h1>نوع شیء</h1></div>
    <div class="option-grid">
      <button class="option-card" onclick="chooseSubtype('بسته مشکوک')" type="button"><svg class="subtype-svg" viewBox="0 0 64 64" aria-hidden="true"><path d="m10 22 22-10 22 10-22 10-22-10Z"/><path d="m10 22v23l22 10 22-10V22M32 32v23"/></svg><strong>بسته مشکوک</strong></button>
      <button class="option-card" onclick="chooseSubtype('خودرو مشکوک')" type="button"><svg class="subtype-svg" viewBox="0 0 64 64" aria-hidden="true"><path d="M11 42h42l-4-16H20l-9 16Z"/><path d="M20 26V21h18l6 5M17 42v6M47 42v6"/><circle cx="21" cy="44" r="5"/><circle cx="44" cy="44" r="5"/></svg><strong>خودرو مشکوک</strong></button>
      <button class="option-card" onclick="chooseSubtype('پرنده')" type="button"><svg class="subtype-svg" viewBox="0 0 64 64" aria-hidden="true"><path d="M8 35c12-13 25-17 42-14l7 6-7 6c-17 3-30-1-42-14"/><path d="M30 29 22 13M30 35l-8 16M43 28l10-9M43 36l10 9"/><path d="M47 22l4-7"/></svg><strong>انواع پرنده</strong></button>
      <button class="option-card" onclick="chooseSubtype('آنتن استارلینک')" type="button"><svg class="subtype-svg" viewBox="0 0 64 64" aria-hidden="true"><path d="M14 50c10-17 26-25 38-28"/><path d="M24 50c5-9 12-15 20-19"/><path d="M18 26a20 20 0 0 1 29-8"/><path d="M25 18a12 12 0 0 1 17-5"/><circle cx="14" cy="50" r="4"/><path d="M38 25l10-5M42 31l11-4"/></svg><strong>آنتن استارلینک</strong></button>
    </div>
  </main>
</section>

<section id="phenomenonTypePage" class="page">
  <main class="shell">
    <button class="back-button" onclick="showPage('categoryPage')" type="button"><span>بازگشت</span><span class="back-arrow"></span></button>
    <div class="page-head"><h1>نوع پدیده اجتماعی</h1></div>
    <div class="option-grid">
      <button class="option-card" onclick="chooseSubtype('تجمع، تحصن یا اغتشاش')" type="button"><svg class="subtype-svg" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="17" r="6"/><circle cx="17" cy="27" r="5"/><circle cx="47" cy="27" r="5"/><path d="M21 53c1-10 5-16 11-16s10 6 11 16M8 51c1-8 4-12 9-12s8 4 9 12M47 51c1-8 4-12 9-12s8 4 9 12"/></svg><strong>تجمع، تحصن یا اغتشاش</strong></button>
      <button class="option-card" onclick="chooseSubtype('انفجار یا آتش‌سوزی')" type="button"><svg class="subtype-svg" viewBox="0 0 64 64" aria-hidden="true"><path d="M33 9c2 9-5 13-1 20 3-4 8-6 9-14 8 8 13 15 10 25-3 10-11 16-20 16-11 0-20-8-20-19 0-8 5-14 12-21 0 8 3 11 7 14 2-5 1-11 3-21Z"/></svg><strong>انفجار یا آتش‌سوزی</strong></button>
    </div>
  </main>
</section>

<section id="formPage" class="page">
  <main class="shell form-shell">
    <button class="back-button" onclick="backFromForm()" type="button"><span>بازگشت</span><span class="back-arrow"></span></button>
    <div class="stepper"><span class="active">فرم</span><i></i><span>زمان</span><i></i><span>مکان</span><i></i><span>تصویر</span></div>
    <div class="page-head"><h1 id="formTitle">ثبت گزارش</h1></div>
    <div id="formBody"></div>
    <div class="form-actions"><button class="primary-button" onclick="continueForm()" type="button">تأیید فرم</button></div>
  </main>
</section>

<section id="timePage" class="page">
  <main class="shell">
    <button class="back-button" onclick="showPage('formPage')" type="button"><span>بازگشت</span><span class="back-arrow"></span></button>
    <div class="stepper"><span class="done">فرم</span><i class="done"></i><span class="active">زمان</span><i></i><span>مکان</span><i></i><span>تصویر</span></div>
    <div class="page-head"><h1>زمان وقوع</h1></div>
    <div class="choice-row time-choices">
      <button class="choice-btn" data-time="الان" onclick="setTimeMode(this,'الان')" type="button">الان</button>
      <button class="choice-btn" data-time="دقیق" onclick="setTimeMode(this,'دقیق')" type="button">زمان دقیق</button>
      <button class="choice-btn" data-time="تقریبی" onclick="setTimeMode(this,'تقریبی')" type="button">زمان تقریبی</button>
      <button class="choice-btn" data-time="نامشخص" onclick="setTimeMode(this,'نامشخص')" type="button">زمان را نمی‌دانم</button>
    </div>
    <div id="exactTime" class="conditional-fields" hidden>
      <div class="date-row">
        <div><label>روز</label><input id="dateDay" class="field-input numeric" inputmode="numeric" maxlength="۲" autocomplete="off"></div>
        <div><label>ماه</label><input id="dateMonth" class="field-input numeric" inputmode="numeric" maxlength="۲" autocomplete="off"></div>
        <div><label>سال</label><input id="dateYear" class="field-input numeric" inputmode="numeric" maxlength="۴" autocomplete="off"></div>
      </div>
      <div class="field-group"><label>ساعت</label><input id="timeClock" class="field-input numeric" inputmode="numeric" maxlength="۵" autocomplete="off"></div>
    </div>
    <div id="approxTime" class="conditional-fields" hidden>
      <div class="field-group"><label>زمان تقریبی</label><input id="approxText" class="field-input" type="text"></div>
    </div>
    <button class="primary-button page-action" onclick="continueTime()" type="button">تأیید زمان</button>
  </main>
</section>

<section id="locationPage" class="page">
  <main class="shell">
    <button class="back-button" onclick="showPage('timePage')" type="button"><span>بازگشت</span><span class="back-arrow"></span></button>
    <div class="stepper"><span class="done">فرم</span><i class="done"></i><span class="done">زمان</span><i class="done"></i><span class="active">مکان</span><i></i><span>تصویر</span></div>
    <div class="page-head"><h1>مکان</h1></div>
    <div class="location-actions">
      <button class="choice-btn location-choice" onclick="useCurrentLocation()" type="button"><svg class="mini-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>موقعیت فعلی</button>
      <button class="choice-btn location-choice" onclick="enableMapPick()" type="button"><svg class="mini-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>انتخاب روی نقشه</button>
      <button class="choice-btn location-choice" onclick="locationUnknown()" type="button"><svg class="mini-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/></svg>مکان را نمی‌دانم</button>
    </div>
    <div id="mapWrap" class="map-wrap"><div id="reportMap"></div></div>
    <div class="location-fields">
      <div class="field-group"><label>استان</label><input id="province" class="field-input" type="text"></div>
      <div class="field-group"><label>شهر</label><input id="city" class="field-input" type="text"></div>
      <div class="field-group"><label>آدرس</label><textarea id="address" class="field-textarea"></textarea></div>
    </div>
    <div id="locationStatus" class="status" aria-live="polite"></div>
    <button class="primary-button page-action" onclick="continueLocation()" type="button">تأیید مکان</button>
  </main>
</section>

<section id="documentsPage" class="page">
  <main class="shell">
    <button class="back-button" onclick="showPage('locationPage')" type="button"><span>بازگشت</span><span class="back-arrow"></span></button>
    <div class="stepper"><span class="done">فرم</span><i class="done"></i><span class="done">زمان</span><i class="done"></i><span class="done">مکان</span><i class="done"></i><span class="active">تصویر</span></div>
    <div class="page-head"><h1>تصویر گزارش</h1></div>
    <label class="document-upload" for="documentInput">
      <svg viewBox="0 0 64 64" aria-hidden="true"><rect x="9" y="13" width="46" height="38" rx="6"/><circle cx="22" cy="26" r="4"/><path d="m14 46 12-12 8 8 7-7 9 11"/></svg>
      <strong>افزودن تصویر</strong>
    </label>
    <input id="documentInput" type="file" accept="image/*" multiple hidden onchange="addDocuments(this)">
    <div id="documentList" class="document-list"></div>
    <button class="primary-button" onclick="sendReport()" type="button">تأیید و ثبت گزارش</button>
    <div id="successBox" class="success-box" aria-live="polite"></div>
  </main>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
