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

function validateFormFields(array $form): void {
  $nationalId = formValue($form, 'nationalId');
  if ($nationalId !== null && !validNationalId($nationalId)) {
    throw new InvalidArgumentException('کد ملی باید ۱۰ رقم معتبر باشد.');
  }

  foreach (['phoneFixed' => 'تلفن ثابت', 'phoneMobile' => 'تلفن همراه', 'phoneWork' => 'تلفن محل کار', 'phoneHome' => 'تلفن منزل'] as $key => $label) {
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
    if (!preg_match('/^\d{1,3}$/', $digits) || (int)$digits < 30 || (int)$digits > 250) {
      throw new InvalidArgumentException('قد باید عددی تا ۳ رقم و بین ۳۰ تا ۲۵۰ سانتی‌متر باشد.');
    }
  }

  $gender = formValue($form, 'gender');
  if ($gender !== null && !in_array($gender, ['مرد', 'زن', 'نامشخص'], true)) {
    throw new InvalidArgumentException('جنسیت باید مرد، زن یا نامشخص باشد.');
  }

  $bodyBuild = formValue($form, 'bodyBuild');
  if ($bodyBuild !== null && !in_array($bodyBuild, ['لاغر', 'معمولی', 'چاق'], true)) {
    throw new InvalidArgumentException('اندام انتخاب‌شده نامعتبر است.');
  }

  foreach (['firstName' => 'نام', 'lastName' => 'نام خانوادگی', 'nickname' => 'شهرت', 'face' => 'رنگ چهره', 'hairStatus' => 'وضعیت موی سر', 'hairColor' => 'رنگ مو', 'beard' => 'محاسن'] as $key => $label) {
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

  $allowedCategories = ['افراد', 'املاک', 'اشیاء', 'رویداد', 'نهاد و سازمان'];
  if (!in_array($category, $allowedCategories, true)) {
    throw new InvalidArgumentException('موضوع گزارش نامعتبر است.');
  }

  $form = is_array($input['form'] ?? null) ? $input['form'] : [];
  // فیلدهای حذف‌شده در نسخه‌های قدیمی یا ارسال دستی ذخیره نمی‌شوند.
  unset($form['priority'], $form['weight']);
  if (count(array_filter($form, fn($value) => is_scalar($value) && trim((string)$value) !== '')) === 0) {
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
      $mime = (string)($document['mime'] ?? '');
      if (str_starts_with($mime, 'image/')) $documents[] = $document;
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
