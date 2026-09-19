<?php
declare(strict_types=1);

// The 100 MiB allowance belongs to the entire document upload field, not each file.
const MAX_DOCUMENT_TOTAL_BYTES = 104857600;
const MAX_PROPERTY_PEOPLE = 10;

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

function incidentScenarioRequiredFields(): array {
  return [
    'جرائم زیست محیطی' => ['environmentSubject', 'environmentAction', 'environmentLocation'],
    'تعدی مامورین دولتی' => ['officialAbuseActor', 'officialAbuseAction', 'officialAbuseImpact'],
    'جرائم سایبری' => ['cyberService', 'cyberConduct', 'cyberImpact'],
    'جرائم عمومی علیه اموال و اشخاص' => ['generalOffenceTarget', 'generalOffenceAction', 'generalOffenceImpact'],
    'تیراندازی' => ['shootingLocation', 'shootingDirection', 'shootingWeaponSigns'],
    'بهره برداری غیرمجاز' => ['unauthorizedResource', 'unauthorizedMethod', 'unauthorizedLocation'],
    'ادم ربایی' => ['abductionPerson', 'abductionLastSeen', 'abductionRelatedPeople'],
    'پیدایش اجساد ناشناس' => ['unknownBodyLocation', 'unknownBodyCondition', 'unknownBodyIdentitySigns'],
    'حوادث و سوانح غیر عمدی' => ['accidentType', 'accidentCause', 'accidentDamage'],
    'امور امنیتی مجاز' => ['authorizedSecurityMatter', 'authorizedSecurityLocation', 'authorizedSecurityDetails'],
    'امور خاص اتباع بیگانه_ دیپلمات' => ['foreignDiplomatPerson', 'foreignDiplomatConnection', 'foreignDiplomatPlace'],
    'مشاهدات وقایع مرزی' => ['borderEventLocation', 'borderEventDirection', 'borderEventPeople'],
    'امور مالی و ملکی' => ['financialPropertySubject', 'financialPropertyTransaction', 'financialPropertyImpact'],
    'درگیری مسلحانه' => ['armedConflictLocation', 'armedConflictParties', 'armedConflictWeaponSigns'],
    'وقایع و فراخوان سایبری' => ['cyberCallPlatform', 'cyberCallContent', 'cyberCallAudience'],
    'حوادث مرتبط با با مواد محترقه غیر مجاز' => ['explosiveItemType', 'explosiveItemLocation', 'explosiveItemRisk'],
    'جرائم علیه امنیت داخلی و خارجی' => ['securityThreatType', 'securityThreatTarget', 'securityThreatEvidence'],
    'جرائم برخلاف تکالیف نظامی' => ['militaryDutyPerson', 'militaryDutyBreach', 'militaryDutyLocation'],
    'جرائم مرتبط با فرار' => ['escapePerson', 'escapeStatus', 'escapeDirection'],
    'جرائم علیه تمامیت اشخاص' => ['physicalIntegrityPerson', 'physicalIntegrityAction', 'physicalIntegrityInjury'],
    'جرائم علیه شخصیت معنوی و اشخاص و آزادی تن' => ['dignityPerson', 'dignityAction', 'dignityEvidence'],
    'جرائم علیه اموال و مالکیت' => ['propertyOffenceTarget', 'propertyOffenceAction', 'propertyOffenceLoss'],
    'جرائم علیه نظم و آسایش عمومی' => ['publicOrderLocation', 'publicOrderBehavior', 'publicOrderImpact'],
    'جرائم مرتبط با مواد مخدر_ قاچاق و تبانی' => ['drugType', 'drugQuantity', 'drugCultivatorProducer', 'drugStudentInvolvement', 'drugTransit'],
    'جرائم ضد عفت و اخلاق عمومی' => ['moralityContext', 'moralityAction', 'moralityPeople'],
    'جرائم مرتبط با رانندگی و وسایل نقلیه' => ['trafficVehicle', 'trafficViolation', 'trafficRisk'],
    'جرائم مرتبط با جعل و تزویر' => ['documentForgerySubject', 'documentForgerySigns', 'documentForgeryUse'],
    'جرائم مربوط به سوءاستفاده از شغل' => ['occupationalRole', 'occupationalAbuse', 'occupationalBenefit'],
    'جرائم مرتبط با ضابطین' => ['officerRelation', 'officerAction', 'officerEvidence'],
    'جرائم رایانه ای' => ['computerService', 'computerAccess', 'computerHarm'],
    'جرائم پزشکی و بهداشتی' => ['medicalSubject', 'medicalProvider', 'medicalEffect'],
    'فراخوان ها' => ['publicCallTopic', 'publicCallChannel', 'publicCallTime'],
    'تخلفات بهداشتی' => ['healthViolationPlace', 'healthViolationAction', 'healthViolationRisk'],
    'اعتراض مسافرین' => ['passengerRoute', 'passengerReason', 'passengerSituation'],
    'مفاسد اجتماعی' => ['socialCorruptionPlace', 'socialCorruptionActivity', 'socialCorruptionImpact'],
    'سرقت نزاع و درگیری' => ['theftTarget', 'theftOpportunityReason', 'theftConflictDetails'],
    'شرارت' => ['disorderActor', 'disorderActions', 'disorderThreat'],
    'جعل و تقلب' => ['fraudSubject', 'fraudSigns', 'fraudUse'],
    'غصب شغل و عناوین' => ['impersonationTitle', 'impersonationPerson', 'impersonationBenefit'],
    'قاچاق' => ['traffickingGoods', 'traffickingRoute', 'traffickingIntent'],
    'مواد مخدر' => ['drugType', 'drugQuantity', 'drugCultivatorProducer', 'drugStudentInvolvement', 'drugTransit'],
    'خودکشی' => ['selfHarmPerson', 'selfHarmStatus', 'selfHarmSigns'],
    'تهدید و اکراه' => ['threatTarget', 'threatMethod', 'threatDemand'],
    'حوادث و سوانح عمدی' => ['intentionalIncidentPlace', 'intentionalIncidentAction', 'intentionalIncidentDamage'],
    'امور امنیتی و غیر‌مجاز' => ['unauthorizedSecurityMatter', 'unauthorizedSecurityLocation', 'unauthorizedSecuritySigns'],
    'امور خاص اتباع بیگانه' => ['foreignPerson', 'foreignStatus', 'foreignActivity'],
    'جرائم مالی و اقتصادی' => ['financialEconomicSubject', 'financialEconomicMethod', 'financialEconomicAmount'],
    'جرائم و تخلفات راهور' => ['roadViolationVehicle', 'roadViolationLocation', 'roadViolationRisk'],
    'تخلفات و جرائم صنفی' => ['businessUnit', 'businessViolation', 'businessAddress'],
    'جرائم ملکی' => ['realEstateSubject', 'realEstateParties', 'realEstateClaim'],
    'اختلافات خانوادگی' => ['familyMembers', 'familyDispute', 'familyRisk'],
  ];
}

function allIncidentScenarioFieldKeys(): array {
  $keys = [];
  foreach (incidentScenarioRequiredFields() as $fields) {
    foreach ($fields as $field) $keys[$field] = true;
  }
  return array_keys($keys);
}

function normalizeRequiredSource(array &$form): void {
  if (array_key_exists('source', $form) && !is_scalar($form['source'])) {
    throw new InvalidArgumentException('نحوه اطلاع نامعتبر است.');
  }
  $source = formValue($form, 'source');
  if ($source === null) {
    throw new InvalidArgumentException('نحوه اطلاع را وارد کنید.');
  }
  $form['source'] = $source;
}

function normalizeIncidentScenarioFields(array &$form, string $category): void {
  if ($category !== 'افراد') return;

  // The former generic description was deliberately retired. A report must now
  // identify one approved scenario before its scenario-specific questions can be stored.
  unset($form['crimeType'], $form['crimeMethod'], $form['crimePlace'], $form['crimeDate']);
  $scenario = formValue($form, 'incidentScenario');
  $catalogue = incidentScenarioRequiredFields();
  if ($scenario === null || !array_key_exists($scenario, $catalogue)) {
    throw new InvalidArgumentException('عنوان سناریو را از فهرست انتخاب کنید.');
  }
  $form['incidentScenario'] = $scenario;

  $activeFields = array_flip($catalogue[$scenario]);
  foreach (allIncidentScenarioFieldKeys() as $field) {
    if (!array_key_exists($field, $activeFields)) unset($form[$field]);
  }
  foreach ($catalogue[$scenario] as $field) {
    if (!array_key_exists($field, $form) || !is_scalar($form[$field]) || trim((string)$form[$field]) === '') {
      throw new InvalidArgumentException('پرسش‌های الزامی سناریوی انتخاب‌شده را کامل کنید.');
    }
    $form[$field] = trim((string)$form[$field]);
  }

  if (array_key_exists('relatedPeople', $form)) {
    if (!is_scalar($form['relatedPeople'])) {
      throw new InvalidArgumentException('همکاران و افراد مرتبط نامعتبر است.');
    }
    $relatedPeople = trim((string)$form['relatedPeople']);
    if ($relatedPeople === '') unset($form['relatedPeople']);
    else $form['relatedPeople'] = $relatedPeople;
  }

  $allowedChoices = [
    'drugCultivatorProducer' => ['بله', 'خیر', 'نامشخص'],
    'drugStudentInvolvement' => ['بله', 'خیر', 'نامشخص'],
    'traffickingIntent' => ['قاچاق اعضای بدن', 'جنسی', 'اتباع']
  ];
  foreach ($allowedChoices as $field => $choices) {
    if (array_key_exists($field, $activeFields) && !in_array($form[$field], $choices, true)) {
      throw new InvalidArgumentException('گزینه انتخاب‌شده برای سناریو نامعتبر است.');
    }
  }
}

function validatePhenomenonRequiredFields(array $form, ?string $subtype): void {
  if ($subtype !== 'تجمع، تحصن یا اغتشاش') return;
  if (formValue($form, 'participantMotivation') === null) {
    throw new InvalidArgumentException('انگیزه شرکت‌کنندگان را وارد کنید.');
  }
}


function landlineAreaCodes(): array {
  // Every fixed-line number uses its provincial three-digit prefix followed by
  // an eight-digit subscriber number.
  return [
    'آذربایجان شرقی' => '041',
    'آذربایجان غربی' => '044',
    'اردبیل' => '045',
    'اصفهان' => '031',
    'البرز' => '026',
    'ایلام' => '084',
    'بوشهر' => '077',
    'تهران' => '021',
    'چهارمحال و بختیاری' => '038',
    'خراسان جنوبی' => '056',
    'خراسان رضوی' => '051',
    'خراسان شمالی' => '058',
    'خوزستان' => '061',
    'زنجان' => '024',
    'سمنان' => '023',
    'سیستان و بلوچستان' => '054',
    'فارس' => '071',
    'قزوین' => '028',
    'قم' => '025',
    'کردستان' => '087',
    'کرمان' => '034',
    'کرمانشاه' => '083',
    'کهگیلویه و بویراحمد' => '074',
    'گلستان' => '017',
    'گیلان' => '013',
    'لرستان' => '066',
    'مازندران' => '011',
    'مرکزی' => '086',
    'هرمزگان' => '076',
    'همدان' => '081',
    'یزد' => '035'
  ];
}

function normalizePeopleLandlineField(array &$form, string $field, string $provinceField, string $label): void {
  $areaCodes = landlineAreaCodes();
  if (array_key_exists($provinceField, $form) && !is_scalar($form[$provinceField])) {
    throw new InvalidArgumentException('استان ' . $label . ' نامعتبر است.');
  }
  $province = formValue($form, $provinceField);
  if ($province === null) unset($form[$provinceField]);
  elseif (!array_key_exists($province, $areaCodes)) {
    throw new InvalidArgumentException('استان ' . $label . ' نامعتبر است.');
  }

  if (array_key_exists($field, $form) && !is_scalar($form[$field])) {
    throw new InvalidArgumentException($label . ' نامعتبر است.');
  }
  $phone = formValue($form, $field);
  if ($phone === null) {
    unset($form[$field]);
    return;
  }

  $digits = englishDigits($phone);
  if (!preg_match('/^\d{8}$|^\d{11}$/', $digits)) {
    throw new InvalidArgumentException($label . ' باید شامل ۸ رقم شماره یا ۱۱ رقم کامل باشد.');
  }

  $inferredProvince = null;
  if (strlen($digits) === 11) {
    $prefix = substr($digits, 0, 3);
    foreach ($areaCodes as $candidateProvince => $candidatePrefix) {
      if ($candidatePrefix === $prefix) {
        $inferredProvince = $candidateProvince;
        break;
      }
    }
  }

  if ($province === null) $province = $inferredProvince;
  if ($province === null) {
    throw new InvalidArgumentException('برای ' . $label . ' استان را انتخاب کنید.');
  }

  // A province explicitly chosen in the UI always controls the persisted
  // prefix. This also upgrades old full numbers by inferring their province.
  $subscriber = strlen($digits) === 11 ? substr($digits, -8) : $digits;
  $form[$provinceField] = $province;
  $form[$field] = $areaCodes[$province] . $subscriber;
}

function normalizePeopleLandlines(array &$form, string $category): void {
  if ($category !== 'افراد') {
    unset($form['phoneFixedProvince'], $form['phoneWorkProvince']);
    return;
  }
  normalizePeopleLandlineField($form, 'phoneFixed', 'phoneFixedProvince', 'شماره ثابت محل سکونت');
  normalizePeopleLandlineField($form, 'phoneWork', 'phoneWorkProvince', 'شماره ثابت محل کار');
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

function propertyPeopleHaveMeaningfulValue(array $people): bool {
  foreach (['owner', 'resident', 'visitor'] as $role) {
    $entries = $people[$role] ?? [];
    if (!is_array($entries)) continue;
    foreach ($entries as $person) {
      if (!is_array($person)) continue;
      foreach ($person as $value) {
        if ($value === true || (is_scalar($value) && trim((string)$value) !== '')) return true;
      }
    }
  }
  return false;
}

function formHasMeaningfulValue(array $form): bool {
  foreach ($form as $key => $value) {
    // Province selection is auxiliary UI state. By itself it is not report data.
    if (in_array($key, ['phoneFixedProvince', 'phoneWorkProvince'], true)) continue;
    if (is_scalar($value) && trim((string)$value) !== '') return true;
    if ($key === 'socialLinks' && is_array($value) && count($value) > 0) return true;
    if ($key === 'vehiclePlate' && is_array($value) && !empty($value['template'])) return true;
    if ($key === 'vehicles' && is_array($value) && vehiclesHaveMeaningfulValue($value)) return true;
    if ($key === 'propertyPeople' && is_array($value) && propertyPeopleHaveMeaningfulValue($value)) return true;
  }
  return false;
}

function propertyPersonRoleLabels(): array {
  return [
    'owner' => 'مالک',
    'resident' => 'ساکن',
    'visitor' => 'ترددکننده'
  ];
}

function propertyPersonLegacyKeys(): array {
  $suffixes = ['FirstName', 'LastName', 'Nickname', 'Phone', 'Gender', 'Height', 'BodyBuild', 'Face', 'HairColor', 'HairStatus', 'Beard', 'Appearance'];
  $keys = [];
  foreach (array_keys(propertyPersonRoleLabels()) as $role) {
    foreach ($suffixes as $suffix) $keys[] = $role . $suffix;
  }
  $keys[] = 'ownerIsResident';
  $keys[] = 'ownerIsVisitor';
  return $keys;
}

function normalizePropertyPeople(array &$form): void {
  // Flat role fields belonged to the preceding property design. The browser
  // migrates a saved draft, but manual legacy payloads intentionally do not stay.
  foreach (propertyPersonLegacyKeys() as $key) unset($form[$key]);
  if (!array_key_exists('propertyPeople', $form)) return;
  if (!is_array($form['propertyPeople'])) {
    throw new InvalidArgumentException('بسته‌های مشخصات افراد مرتبط با ملک نامعتبر است.');
  }

  $allowedFields = ['firstName', 'lastName', 'nickname', 'phone', 'gender', 'height', 'bodyBuild', 'face', 'hairColor', 'hairStatus', 'beard', 'appearance'];
  $normalizedPeople = [];
  foreach (propertyPersonRoleLabels() as $role => $label) {
    $entries = $form['propertyPeople'][$role] ?? [];
    if (!is_array($entries)) {
      throw new InvalidArgumentException('بسته‌های مشخصات ' . $label . ' نامعتبر است.');
    }
    if (count($entries) > MAX_PROPERTY_PEOPLE) {
      throw new InvalidArgumentException('تعداد بسته‌های مشخصات ' . $label . ' بیش از حد مجاز است.');
    }

    $normalizedPeople[$role] = [];
    foreach ($entries as $person) {
      if (!is_array($person)) {
        throw new InvalidArgumentException('بسته مشخصات ' . $label . ' نامعتبر است.');
      }
      $normalized = [];
      foreach ($allowedFields as $field) {
        if (!array_key_exists($field, $person)) continue;
        if (!is_scalar($person[$field])) {
          throw new InvalidArgumentException('مقدار مشخصات ' . $label . ' نامعتبر است.');
        }
        $value = trim((string)$person[$field]);
        if ($value !== '') $normalized[$field] = $value;
      }
      if ($role === 'owner') {
        foreach (['isResident', 'isVisitor'] as $flag) {
          if (!array_key_exists($flag, $person)) continue;
          if ($person[$flag] !== true) {
            throw new InvalidArgumentException('وضعیت مالک نسبت به ملک نامعتبر است.');
          }
          $normalized[$flag] = true;
        }
      }
      $normalizedPeople[$role][] = $normalized;
    }
  }
  $form['propertyPeople'] = $normalizedPeople;
}

function validatePropertyPersonFields(array $form): void {
  $people = $form['propertyPeople'] ?? [];
  if (!is_array($people)) return;

  foreach (propertyPersonRoleLabels() as $role => $label) {
    $entries = $people[$role] ?? [];
    if (!is_array($entries)) continue;
    foreach ($entries as $person) {
      if (!is_array($person)) continue;
      $phone = formValue($person, 'phone');
      if ($phone !== null && !preg_match('/^\d{11}$/', englishDigits($phone))) {
        throw new InvalidArgumentException('شماره تماس ' . $label . ' باید دقیقاً ۱۱ رقم باشد.');
      }

      $height = formValue($person, 'height');
      if ($height !== null) {
        $digits = englishDigits($height);
        if (!preg_match('/^\d{1,3}$/', $digits) || (int)$digits < 1 || (int)$digits > 250) {
          throw new InvalidArgumentException('قد ' . $label . ' باید عددی تا ۳ رقم و حداکثر ۲۵۰ باشد.');
        }
      }

      $gender = formValue($person, 'gender');
      if ($gender !== null && !in_array($gender, ['مرد', 'زن', 'نامشخص'], true)) {
        throw new InvalidArgumentException('جنسیت ' . $label . ' باید مرد، زن یا نامشخص باشد.');
      }

      $bodyBuild = formValue($person, 'bodyBuild');
      if ($bodyBuild !== null && !in_array($bodyBuild, ['لاغر', 'معمولی', 'چاق'], true)) {
        throw new InvalidArgumentException('اندام ' . $label . ' نامعتبر است.');
      }

      foreach (['firstName' => 'نام', 'lastName' => 'نام خانوادگی', 'nickname' => 'شهرت', 'face' => 'رنگ پوست', 'hairStatus' => 'وضعیت موی سر', 'hairColor' => 'رنگ مو', 'beard' => 'محاسن'] as $field => $fieldLabel) {
        $value = formValue($person, $field);
        if ($value !== null && preg_match('/[0-9۰-۹٠-٩]/u', $value)) {
          throw new InvalidArgumentException($fieldLabel . ' ' . $label . ' فقط باید شامل متن باشد.');
        }
      }
    }
  }
}

function normalizePropertyFields(array &$form): void {
  // Fields from the retired, single-text property form must not survive drafts or
  // manual submissions. Structured vehicle and repeatable person packages remain.
  unset($form['propertyAddress'], $form['owners'], $form['activity']);
  normalizePropertyPeople($form);
  if (array_key_exists('vehicles', $form) && !is_array($form['vehicles'])) unset($form['vehicles']);
}

function normalizeLocationDetailFields(array &$location): void {
  // The one-box address field was replaced everywhere by four explicit fields.
  unset($location['address']);
  foreach (['postalCode', 'buildingPlaque', 'floor', 'unit'] as $key) {
    if (!array_key_exists($key, $location)) continue;
    if (!is_scalar($location[$key])) {
      throw new InvalidArgumentException('جزئیات مکان وقوع نامعتبر است.');
    }
    $value = trim((string)$location[$key]);
    if ($value === '') unset($location[$key]);
    else $location[$key] = $value;
  }

  $mode = isset($location['mode']) && is_scalar($location['mode']) ? trim((string)$location['mode']) : '';
  if ($mode === 'unknown') {
    unset($location['postalCode'], $location['buildingPlaque'], $location['floor'], $location['unit']);
  }
}

function normalizePropertyLocation(array &$location): void {
  $mode = isset($location['mode']) && is_scalar($location['mode']) ? trim((string)$location['mode']) : '';
  if ($mode === 'unknown') {
    throw new InvalidArgumentException('برای گزارش املاک، مکان وقوع را از طریق موقعیت فعلی یا نقشه تعیین کنید.');
  }
  // Province/county controls only belong to the unknown-location flow, which is
  // intentionally unavailable for property reports.
  unset($location['province'], $location['city']);
}

function validateFormFields(array $form, ?string $category = null): void {
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

  if ($category === 'املاک') validatePropertyPersonFields($form);
}

function normalize(array $input): array {
  $category = clean($input['category'] ?? null);
  if (!$category) throw new InvalidArgumentException('موضوع گزارش مشخص نشده است.');

  // نام‌های پیشین برای نسخه‌های ذخیره‌شده یا مرورگرهای دارای کش، به عنوان جدید یکپارچه می‌شوند.
  $categoryAliases = [
    'فرد' => 'افراد',
    'ملک' => 'املاک',
    'اماکن' => 'املاک',
    'شیء' => 'اشیاء',
    'پدیده اجتماعی' => 'رویداد'
  ];
  $category = $categoryAliases[$category] ?? $category;

  $allowedCategories = ['افراد', 'املاک', 'اشیاء', 'رویداد'];
  if (!in_array($category, $allowedCategories, true)) {
    throw new InvalidArgumentException('موضوع گزارش نامعتبر است.');
  }

  $subtype = clean($input['subtype'] ?? null);
  if ($subtype !== null && !is_string($subtype)) {
    throw new InvalidArgumentException('عنوان گزارش نامعتبر است.');
  }

  $form = is_array($input['form'] ?? null) ? $input['form'] : [];
  // فیلدهای حذف‌شده در نسخه‌های قدیمی یا ارسال دستی ذخیره نمی‌شوند.
  unset(
    $form['priority'],
    $form['weight'],
    $form['crimeType'],
    $form['crimeMethod'],
    $form['crimePlace'],
    $form['crimeDate']
  );
  if ($category === 'املاک') normalizePropertyFields($form);
  normalizePeopleLandlines($form, $category);
  normalizeSocialLinks($form);
  normalizeRequiredSource($form);
  normalizeIncidentScenarioFields($form, $category);
  validatePhenomenonRequiredFields($form, $subtype);
  if (!formHasMeaningfulValue($form)) {
    throw new InvalidArgumentException('اطلاعات گزارش وارد نشده است.');
  }
  validateFormFields($form, $category);

  $location = is_array($input['location'] ?? null) ? $input['location'] : [];
  normalizeLocationDetailFields($location);
  if ($category === 'املاک') normalizePropertyLocation($location);

  $report = [
    'reportType' => 'گزارش',
    'category' => $category,
    'subtype' => $subtype,
    'form' => $form,
    'location' => $location,
    'time' => is_array($input['time'] ?? null) ? $input['time'] : []
  ];

  if (isset($input['documents']) && is_array($input['documents'])) {
    if (count($input['documents']) > 10) {
      throw new InvalidArgumentException('حداکثر ۱۰ فایل قابل بارگذاری است.');
    }
    $documents = [];
    $documentTotalBytes = 0;
    foreach ($input['documents'] as $document) {
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
      if ($contents === false) {
        throw new InvalidArgumentException('محتوای فایل بارگذاری‌شده نامعتبر است.');
      }
      $decodedBytes = strlen($contents);
      $documentTotalBytes += $decodedBytes;
      if ($documentTotalBytes > MAX_DOCUMENT_TOTAL_BYTES) {
        throw new InvalidArgumentException('مجموع حجم مستندات نباید بیشتر از ۱۰۰ مگابایت باشد.');
      }
      $mime = strtolower($matches[1]);
      $documents[] = [
        'type' => str_starts_with($mime, 'image/') ? 'image' : 'file',
        'name' => $name,
        'mime' => $mime,
        'size' => $decodedBytes,
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
