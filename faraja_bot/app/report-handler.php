<?php
declare(strict_types=1);

function jsonResponse(array $payload, int $status = 200): void {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function clean($value) {
  if (is_string($value)) {
    $value = trim($value);
    return $value === '' ? null : $value;
  }
  return $value;
}

function englishDigits(string $value): string {
  return strtr($value, [
    '۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4',
    '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9',
    '٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4',
    '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9'
  ]);
}

function formValue(array $form, string $key): ?string {
  if (!array_key_exists($key, $form) || !is_scalar($form[$key])) return null;
  $value = trim((string)$form[$key]);
  return $value === '' ? null : $value;
}

function validNationalId(string $value): bool {
  $digits = englishDigits($value);
  if (!preg_match('/^\d{10}$/', $digits) || preg_match('/^(\d)\1{9}$/', $digits)) return false;

  $sum = 0;
  for ($index = 0; $index < 9; $index++) {
    $sum += (int)$digits[$index] * (10 - $index);
  }
  $remainder = $sum % 11;
  $expected = $remainder < 2 ? $remainder : 11 - $remainder;
  return (int)$digits[9] === $expected;
}

function normalizeSocialLinks(array &$form): void {
  if (!array_key_exists('socialLinks', $form)) return;
  if (!is_array($form['socialLinks'])) {
    throw new InvalidArgumentException('نشانی‌های فضای مجازی نامعتبر است.');
  }
  if (count($form['socialLinks']) > 20) {
    throw new InvalidArgumentException('تعداد نشانی‌های فضای مجازی بیش از حد مجاز است.');
  }

  $platformPrefixes = [
    'telegram' => 't.me/',
    'instagram' => 'instagram.com/',
    'x' => 'x.com/',
    'whatsapp' => 'wa.me/',
    'youtube' => 'youtube.com/',
    'facebook' => 'facebook.com/',
    'linkedin' => 'linkedin.com/',
    'github' => 'github.com/',
    'tiktok' => 'tiktok.com/@',
    'threads' => 'threads.net/@',
    'discord' => 'discord.gg/',
    'eitaa' => 'eitaa.com/',
    'bale' => 'ble.ir/',
    'soroush' => 'splus.ir/',
    'rubika' => 'rubika.ir/',
    'igap' => 'igap.net/',
    'gap' => 'gap.im/',
    'virasty' => 'virasty.com/',
    'aparat' => 'aparat.com/'
  ];

  $links = [];
  foreach ($form['socialLinks'] as $link) {
    if (!is_array($link)) continue;
    $platform = isset($link['platform']) && is_string($link['platform']) ? trim($link['platform']) : '';
    $value = isset($link['value']) && is_string($link['value']) ? trim($link['value']) : '';
    if ($platform === '' && $value === '') continue;
    if (!array_key_exists($platform, $platformPrefixes)) {
      throw new InvalidArgumentException('پلتفرم انتخاب‌شده نامعتبر است.');
    }
    // ردیف‌های انتخاب‌شده اما ناتمام در رابط کاربری، در گزارش نهایی ذخیره نمی‌شوند.
    if ($value === '') continue;
    if (strlen($value) > 500 || preg_match('/[\x00-\x1F]/', $value)) {
      throw new InvalidArgumentException('نشانی فضای مجازی نامعتبر است.');
    }
    $value = ltrim($value, '/');
    if ($value === '') continue;
    $links[] = [
      'platform' => $platform,
      'value' => $value,
      'url' => 'https://' . $platformPrefixes[$platform] . $value
    ];
  }

  if ($links) $form['socialLinks'] = $links;
  else unset($form['socialLinks']);
}

function vehiclesHaveMeaningfulValue(array $vehicles): bool {
  foreach ($vehicles as $vehicle) {
    if (!is_array($vehicle)) continue;
    foreach (['kind', 'type', 'color', 'specialFeature'] as $key) {
      if (isset($vehicle[$key]) && is_scalar($vehicle[$key]) && trim((string)$vehicle[$key]) !== '') return true;
    }
    if (!empty($vehicle['noPlate'])) return true;
    if (isset($vehicle['plate']) && is_array($vehicle['plate']) && !empty($vehicle['plate']['template'])) return true;
  }
  return false;
}

function formHasMeaningfulValue(array $form): bool {
  foreach ($form as $key => $value) {
    if (is_scalar($value) && trim((string)$value) !== '') return true;
    if ($key === 'socialLinks' && is_array($value) && count($value) > 0) return true;
    if ($key === 'vehiclePlate' && is_array($value) && !empty($value['template'])) return true;
    if ($key === 'vehicles' && is_array($value) && vehiclesHaveMeaningfulValue($value)) return true;
  }
  return false;
}

function validateFormFields(array $form): void {
  $nationalId = formValue($form, 'nationalId');
  if ($nationalId !== null && !validNationalId($nationalId)) {
    throw new InvalidArgumentException('کد ملی باید ۱۰ رقم معتبر باشد.');
  }

  foreach (['phoneFixed' => 'شماره ثابت محل سکونت', 'phoneMobile' => 'شماره همراه', 'phoneWork' => 'شماره ثابت محل کار', 'phoneHome' => 'شماره ثابت محل سکونت'] as $key => $label) {
    $phone = formValue($form, $key);
    if ($phone !== null && !preg_match('/^\d{11}$/', englishDigits($phone))) {
      throw new InvalidArgumentException($label . ' باید دقیقاً ۱۱ رقم باشد.');
    }
  }

  $age = formValue($form, 'age');
  if ($age !== null) {
    $digits = englishDigits($age);
    if (!preg_match('/^\d{1,3}$/', $digits) || (int)$digits < 1 || (int)$digits > 120) {
      throw new InvalidArgumentException('سن باید عددی بین ۱ تا ۱۲۰ باشد.');
    }
  }

  $height = formValue($form, 'height');
  if ($height !== null) {
    $digits = englishDigits($height);
    if (!preg_match('/^\d{1,3}$/', $digits) || (int)$digits < 1 || (int)$digits > 250) {
      throw new InvalidArgumentException('قد باید عددی تا ۳ رقم و حداکثر ۲۵۰ باشد.');
    }
  }

  $email = formValue($form, 'email');
  if ($email !== null && filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
    throw new InvalidArgumentException('نشانی پست الکترونیک را به شکل یک ایمیل معتبر وارد کنید.');
  }

  $gender = formValue($form, 'gender');
  if ($gender !== null && !in_array($gender, ['مرد', 'زن', 'نامشخص'], true)) {
    throw new InvalidArgumentException('جنسیت باید مرد، زن یا نامشخص باشد.');
  }

  $bodyBuild = formValue($form, 'bodyBuild');
  if ($bodyBuild !== null && !in_array($bodyBuild, ['لاغر', 'معمولی', 'چاق'], true)) {
    throw new InvalidArgumentException('اندام انتخاب‌شده نامعتبر است.');
  }

  foreach (['firstName' => 'نام', 'lastName' => 'نام خانوادگی', 'nickname' => 'شهرت', 'face' => 'رنگ پوست', 'hairStatus' => 'وضعیت موی سر', 'hairColor' => 'رنگ مو', 'beard' => 'محاسن'] as $key => $label) {
    $value = formValue($form, $key);
    if ($value !== null && preg_match('/[0-9۰-۹٠-٩]/u', $value)) {
      throw new InvalidArgumentException($label . ' فقط باید شامل متن باشد.');
    }
  }
}

function normalize(array $input): array {
  $category = clean($input['category'] ?? null);
  if (!$category) throw new InvalidArgumentException('موضوع گزارش مشخص نشده است.');

  // نام‌های پیشین برای نسخه‌های ذخیره‌شده یا مرورگرهای دارای کش، به عنوان جدید یکپارچه می‌شوند.
  $categoryAliases = [
    'فرد' => 'افراد',
    'ملک' => 'املاک',
    'شیء' => 'اشیاء',
    'پدیده اجتماعی' => 'رویداد'
  ];
  $category = $categoryAliases[$category] ?? $category;

  $allowedCategories = ['افراد', 'املاک', 'اشیاء', 'رویداد'];
  if (!in_array($category, $allowedCategories, true)) {
    throw new InvalidArgumentException('موضوع گزارش نامعتبر است.');
  }

  $form = is_array($input['form'] ?? null) ? $input['form'] : [];
  // فیلدهای حذف‌شده در نسخه‌های قدیمی یا ارسال دستی ذخیره نمی‌شوند.
  unset($form['priority'], $form['weight']);
  normalizeSocialLinks($form);
  if (!formHasMeaningfulValue($form)) {
    throw new InvalidArgumentException('اطلاعات گزارش وارد نشده است.');
  }
  validateFormFields($form);

  $report = [
    'reportType' => 'گزارش',
    'category' => $category,
    'subtype' => clean($input['subtype'] ?? null),
    'form' => $form,
    'location' => is_array($input['location'] ?? null) ? $input['location'] : [],
    'time' => is_array($input['time'] ?? null) ? $input['time'] : []
  ];

  if (isset($input['documents']) && is_array($input['documents'])) {
    $documents = [];
    foreach (array_slice($input['documents'], 0, 10) as $document) {
      if (!is_array($document)) continue;
      $name = isset($document['name']) && is_string($document['name']) ? trim($document['name']) : '';
      $data = isset($document['data']) && is_string($document['data']) ? $document['data'] : '';
      if ($name === '' || strlen($name) > 255 || $data === '') {
        throw new InvalidArgumentException('مشخصات فایل بارگذاری‌شده نامعتبر است.');
      }
      if (!preg_match('#^data:([^;,]+)(?:;[^,]*)*;base64,([A-Za-z0-9+/=]*)$#', $data, $matches)) {
        throw new InvalidArgumentException('محتوای فایل بارگذاری‌شده نامعتبر است.');
      }
      $contents = base64_decode($matches[2], true);
      if ($contents === false || strlen($contents) > 100 * 1024 * 1024) {
        throw new InvalidArgumentException('حجم هر فایل نباید بیشتر از ۱۰۰ مگابایت باشد.');
      }
      $mime = strtolower($matches[1]);
      $documents[] = [
        'type' => str_starts_with($mime, 'image/') ? 'image' : 'file',
        'name' => $name,
        'mime' => $mime,
        'size' => strlen($contents),
        'data' => $data
      ];
    }
    $report['documents'] = $documents;
  }

  return $report;
}

function handleReportRequest(): void {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') return;

  $input = json_decode(file_get_contents('php://input') ?: '', true);
  if (!is_array($input)) jsonResponse(['ok' => false, 'message' => 'اطلاعات ارسالی نامعتبر است'], 400);

  try {
    $report = normalize($input);
  } catch (Throwable $error) {
    jsonResponse(['ok' => false, 'message' => $error->getMessage()], 422);
  }

  $report['id'] = bin2hex(random_bytes(8));
  $report['created_at'] = date('c');
  $file = __DIR__ . '/../data/reports.json';
  $reports = [];
  if (is_file($file)) {
    $oldReports = json_decode(file_get_contents($file) ?: '', true);
    if (is_array($oldReports)) $reports = $oldReports;
  }
  $reports[] = $report;

  $json = json_encode($reports, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
  if ($json === false || file_put_contents($file, $json, LOCK_EX) === false) {
    jsonResponse(['ok' => false, 'message' => 'ذخیره گزارش انجام نشد'], 500);
  }
  jsonResponse(['ok' => true, 'message' => 'گزارش با موفقیت ثبت شد', 'report' => $report]);
}
