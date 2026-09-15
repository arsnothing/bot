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
      <button class="main-card secondary-main-card" onclick="openLocationRegistration()" type="button">
        <strong>ثبت موقعیت مکانی</strong>
      </button>
    </div>
  </main>
</section>

<section id="locationRegistrationPage" class="page construction-page">
  <main class="construction-shell">
    <button class="back-button button-with-icon" onclick="showPage('homePage')" type="button"><?= buttonIcon('arrow-previous', 'button-icon back-icon') ?><span>بازگشت</span></button>
    <section class="construction-card" aria-labelledby="constructionTitle">
      <div class="construction-visual" aria-hidden="true">
        <div class="construction-glow"></div>
        <div class="construction-ground"></div>
        <div class="construction-building">
          <span></span><span></span><span></span><span></span><span></span><span></span>
        </div>
        <?= buttonIcon('gear', 'construction-gear construction-gear-primary') ?>
        <?= buttonIcon('gear', 'construction-gear construction-gear-secondary') ?>
      </div>
      <p id="constructionStatus" class="construction-status" aria-live="polite"><span></span>در حال آماده‌سازی</p>
      <h1 id="constructionTitle">ثبت موقعیت مکانی<br>در حال ساخت است</h1>
      <p class="construction-copy">این بخش به‌زودی در دسترس قرار می‌گیرد. در حال آماده‌سازی تجربه‌ای دقیق‌تر و بهتر برای ثبت موقعیت هستیم.</p>
      <div class="construction-progress" aria-hidden="true"><span></span></div>
    </section>
  </main>
</section>

<section id="categoryPage" class="page">
  <main class="shell">
    <button class="back-button button-with-icon" onclick="showPage('homePage')" type="button"><?= buttonIcon('arrow-previous', 'button-icon back-icon') ?><span>بازگشت</span></button>
    <div class="page-head"><h1>موضوع گزارش</h1></div>
    <div class="category-grid">
      <button class="category-card" onclick="chooseCategory('افراد')" type="button">
        <?= buttonIcon('community', 'category-icon') ?>
        <strong>افراد</strong>
      </button>
      <button class="category-card" onclick="chooseCategory('رویداد')" type="button">
        <?= buttonIcon('event', 'category-icon') ?>
        <strong>رویداد</strong>
      </button>
      <button class="category-card" onclick="chooseCategory('املاک')" type="button">
        <?= buttonIcon('properties', 'category-icon') ?>
        <strong>املاک</strong>
      </button>
      <button class="category-card" onclick="chooseCategory('اشیاء')" type="button">
        <?= buttonIcon('objects', 'category-icon') ?>
        <strong>اشیاء</strong>
      </button>
    </div>
  </main>
</section>

<section id="objectTypePage" class="page">
  <main class="shell">
    <button class="back-button button-with-icon" onclick="showPage('categoryPage')" type="button"><?= buttonIcon('arrow-previous', 'button-icon back-icon') ?><span>بازگشت</span></button>
    <div class="page-head"><h1>نوع اشیاء</h1></div>
    <div class="option-grid">
      <button class="option-card" onclick="chooseSubtype('بسته مشکوک')" type="button"><?= buttonIcon('package', 'subtype-svg') ?><strong>بسته مشکوک</strong></button>
      <button class="option-card" onclick="chooseSubtype('خودرو مشکوک')" type="button"><?= buttonIcon('car', 'subtype-svg') ?><strong>خودرو مشکوک</strong></button>
      <button class="option-card" onclick="chooseSubtype('پرنده')" type="button"><?= buttonIcon('drone', 'subtype-svg') ?><strong>انواع پرنده</strong></button>
      <button class="option-card" onclick="chooseSubtype('آنتن استارلینک')" type="button"><?= buttonIcon('satellite', 'subtype-svg') ?><strong>آنتن استارلینک</strong></button>
    </div>
  </main>
</section>

<section id="phenomenonTypePage" class="page">
  <main class="shell">
    <button class="back-button button-with-icon" onclick="showPage('categoryPage')" type="button"><?= buttonIcon('arrow-previous', 'button-icon back-icon') ?><span>بازگشت</span></button>
    <div class="page-head"><h1>نوع رویداد</h1></div>
    <div class="option-grid">
      <button class="option-card" onclick="chooseSubtype('تجمع، تحصن یا اغتشاش')" type="button"><?= buttonIcon('crowd', 'subtype-svg') ?><strong>تجمع، تحصن یا اغتشاش</strong></button>
      <button class="option-card" onclick="chooseSubtype('انفجار یا آتش‌سوزی')" type="button"><?= buttonIcon('fire', 'subtype-svg') ?><strong>انفجار یا آتش‌سوزی</strong></button>
    </div>
  </main>
</section>

<section id="formPage" class="page">
  <main class="shell form-shell">
    <button class="back-button button-with-icon" onclick="backFromForm()" type="button"><?= buttonIcon('arrow-previous', 'button-icon back-icon') ?><span>بازگشت</span></button>
    <div class="stepper"><span class="active">فرم</span><i></i><span>زمان</span><i></i><span>مکان</span><i></i><span>تصویر</span></div>
    <div class="page-head"><h1 id="formTitle">ثبت گزارش</h1></div>
    <div id="formBody"></div>
    <div id="formActions" class="form-actions"></div>
  </main>
</section>

<section id="timePage" class="page">
  <main class="shell">
    <button class="back-button button-with-icon" onclick="showPage('formPage')" type="button"><?= buttonIcon('arrow-previous', 'button-icon back-icon') ?><span>بازگشت</span></button>
    <div class="stepper"><span class="done">فرم</span><i class="done"></i><span class="active">زمان</span><i></i><span>مکان</span><i></i><span>تصویر</span></div>
    <div class="page-head"><h1>زمان وقوع</h1></div>
    <div class="choice-row time-choices">
      <button class="choice-btn button-with-icon" data-time="الان" onclick="setTimeMode(this,'الان')" type="button"><?= buttonIcon('clock-now') ?><span>الان</span></button>
      <button class="choice-btn button-with-icon" data-time="دقیق" onclick="setTimeMode(this,'دقیق')" type="button"><?= buttonIcon('calendar-clock') ?><span>زمان دقیق</span></button>
      <button class="choice-btn button-with-icon" data-time="تقریبی" onclick="setTimeMode(this,'تقریبی')" type="button"><?= buttonIcon('clock') ?><span>زمان تقریبی</span></button>
      <button class="choice-btn button-with-icon" data-time="نامشخص" onclick="setTimeMode(this,'نامشخص')" type="button"><?= buttonIcon('clock-off') ?><span>زمان را نمی‌دانم</span></button>
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
    <button class="primary-button page-action button-with-icon" onclick="continueTime()" type="button"><?= buttonIcon('check', 'button-icon action-icon') ?><span>تأیید زمان</span></button>
  </main>
</section>

<section id="locationPage" class="page">
  <main class="shell">
    <button class="back-button button-with-icon" onclick="showPage('timePage')" type="button"><?= buttonIcon('arrow-previous', 'button-icon back-icon') ?><span>بازگشت</span></button>
    <div class="stepper"><span class="done">فرم</span><i class="done"></i><span class="done">زمان</span><i class="done"></i><span class="active">مکان</span><i></i><span>تصویر</span></div>
    <div class="page-head"><h1>مکان</h1></div>
    <div class="location-actions">
      <button class="choice-btn location-choice" onclick="useCurrentLocation()" type="button"><?= buttonIcon('target', 'mini-svg') ?><span>موقعیت فعلی</span></button>
      <button class="choice-btn location-choice" onclick="enableMapPick()" type="button"><?= buttonIcon('map', 'mini-svg') ?><span>انتخاب روی نقشه</span></button>
      <button class="choice-btn location-choice" onclick="locationUnknown()" type="button"><?= buttonIcon('pin-off', 'mini-svg') ?><span>مکان را نمی‌دانم</span></button>
    </div>
    <div id="mapWrap" class="map-wrap"><div id="reportMap"></div></div>
    <div class="location-fields">
      <div class="field-group"><label>استان</label><input id="province" class="field-input" type="text"></div>
      <div class="field-group"><label>شهر</label><input id="city" class="field-input" type="text"></div>
      <div class="field-group"><label>آدرس</label><textarea id="address" class="field-textarea"></textarea></div>
    </div>
    <div id="locationStatus" class="status" aria-live="polite"></div>
    <button class="primary-button page-action button-with-icon" onclick="continueLocation()" type="button"><?= buttonIcon('check', 'button-icon action-icon') ?><span>تأیید مکان</span></button>
  </main>
</section>

<section id="documentsPage" class="page">
  <main class="shell">
    <button class="back-button button-with-icon" onclick="showPage('locationPage')" type="button"><?= buttonIcon('arrow-previous', 'button-icon back-icon') ?><span>بازگشت</span></button>
    <div class="stepper"><span class="done">فرم</span><i class="done"></i><span class="done">زمان</span><i class="done"></i><span class="done">مکان</span><i class="done"></i><span class="active">تصویر</span></div>
    <div class="page-head"><h1>تصویر گزارش</h1></div>
    <label class="document-upload" for="documentInput">
      <?= buttonIcon('image-upload', 'button-icon upload-icon') ?>
      <strong>افزودن تصویر</strong>
    </label>
    <input id="documentInput" type="file" accept="image/*" multiple hidden onchange="addDocuments(this)">
    <div id="documentList" class="document-list"></div>
    <button class="primary-button button-with-icon" onclick="sendReport()" type="button"><?= buttonIcon('send', 'button-icon action-icon') ?><span>تأیید و ثبت گزارش</span></button>
    <div id="successBox" class="success-box" aria-live="polite"></div>
  </main>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
