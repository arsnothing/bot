<?php
function buttonIcon(string $name, string $class = 'button-icon'): string {
  $safeName = preg_replace('/[^a-z0-9-]/', '', $name);
  $safeClass = htmlspecialchars($class, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
  return '<svg xmlns="http://www.w3.org/2000/svg" class="' . $safeClass . '" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#icon-' . $safeName . '"></use></svg>';
}
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
  <title>سامانه ثبت گزارش</title>
  <link rel="stylesheet" href="assets/leaflet/leaflet.css">
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
  <svg xmlns="http://www.w3.org/2000/svg" class="icon-sprite" aria-hidden="true" focusable="false">
    <symbol id="icon-report" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M7 3.75h6.5L18.5 8.7v11.55H7a2 2 0 0 1-2-2V5.75a2 2 0 0 1 2-2Z"/>
      <path d="M13.5 3.75V8.7h5M9 13h6M9 16.5h4.25"/>
    </symbol>
    <symbol id="icon-person" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="7.25" r="3.25"/>
      <path d="M5.25 20.25c.6-3.65 3.1-5.75 6.75-5.75s6.15 2.1 6.75 5.75"/>
    </symbol>
    <symbol id="icon-community" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="6.75" r="2.75"/><circle cx="5.75" cy="9" r="2.25"/><circle cx="18.25" cy="9" r="2.25"/>
      <path d="M7.25 20c.4-3.25 2.1-5.25 4.75-5.25s4.35 2 4.75 5.25M1.75 19.75c.3-2.45 1.6-3.9 4-3.9 1.45 0 2.5.55 3.2 1.55M22.25 19.75c-.3-2.45-1.6-3.9-4-3.9-1.45 0-2.5.55-3.2 1.55"/>
    </symbol>
    <symbol id="icon-property" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="m3.5 10.5 8.5-6.75 8.5 6.75v9.75H3.5V10.5Z"/>
      <path d="M8.25 20.25v-5.5h7.5v5.5M8.25 10.25h.01M15.75 10.25h.01"/>
    </symbol>
    <symbol id="icon-object" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M7 3.75h7l3.5 3.5v10.5a2.5 2.5 0 0 1-2.5 2.5H7a2.5 2.5 0 0 1-2.5-2.5v-11A3 3 0 0 1 7 3.75Z"/>
      <path d="M14 3.75v4h3.5M8.25 12h7.5M8.25 15.5h5"/>
    </symbol>
    <symbol id="icon-package" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="m4 7.5 8-4 8 4-8 4-8-4Z"/><path d="M4 7.5v9l8 4 8-4v-9M12 11.5v9"/>
    </symbol>
    <symbol id="icon-car" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="m5.25 14.5 1.8-5.1a2 2 0 0 1 1.9-1.35h6.1a2 2 0 0 1 1.9 1.35l1.8 5.1v4.25H5.25V14.5Z"/>
      <path d="M5.25 14.5h13.5M7.25 18.75v1.5M16.75 18.75v1.5"/><circle cx="8" cy="15.5" r=".75"/><circle cx="16" cy="15.5" r=".75"/>
    </symbol>
    <symbol id="icon-drone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 12h8M12 9.5v5M9.5 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM19.5 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"/>
      <path d="m9.5 9.5-2.25-2.25M14.5 9.5l2.25-2.25M9.5 14.5l-2.25 2.25M14.5 14.5l2.25 2.25"/>
    </symbol>
    <symbol id="icon-satellite" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 13.25a6.75 6.75 0 0 0 7.25 4.75L17 14.25A6.75 6.75 0 0 0 6 13.25Z"/>
      <path d="m10.75 16.75-2.25 3.5M14.25 18.25l1.25 2M17.5 5.25a5.25 5.25 0 0 1 1.25 4.25M19.75 3a8.5 8.5 0 0 1 1.5 7M14.75 7.5l1.75 1.75"/>
    </symbol>
    <symbol id="icon-crowd" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="6.5" r="2.5"/><circle cx="6.25" cy="8.5" r="2"/><circle cx="17.75" cy="8.5" r="2"/>
      <path d="M7.5 20.25c.45-3.1 2.05-5 4.5-5s4.05 1.9 4.5 5M2.25 20c.3-2.4 1.55-3.85 4-3.85M21.75 20c-.3-2.4-1.55-3.85-4-3.85"/>
    </symbol>
    <symbol id="icon-fire" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M13.25 3.5c.75 3.5-2.5 4.75-1.25 7.5.7-1.1 1.7-1.8 2-3.75 3 2.6 4.5 5.2 3.75 8.1-.75 3.05-3.35 5.15-6.75 5.15-4.1 0-7.25-2.9-7.25-6.95 0-2.8 1.5-5.05 4.2-7.2-.1 2.3.8 3.55 2.35 4.6.75-1.8 1.75-3.6 2.95-7.45Z"/>
    </symbol>
    <symbol id="icon-arrow-previous" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="m10 5.25 6.75 6.75L10 18.75M16.25 12H4.5"/>
    </symbol>
    <symbol id="icon-arrow-next" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="m14 5.25-6.75 6.75L14 18.75M7.75 12H19.5"/>
    </symbol>
    <symbol id="icon-clock-now" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="7.5"/><path d="M12 7.5V12l3 1.75M12 2v2M12 20v2M2 12h2M20 12h2"/>
    </symbol>
    <symbol id="icon-calendar-clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3.75" y="5.5" width="16.5" height="14.75" rx="2.25"/><path d="M7.5 3.5v4M16.5 3.5v4M3.75 9.5h16.5"/>
      <circle cx="15.75" cy="15.5" r="2.5"/><path d="M15.75 14v1.75l1.1.65"/>
    </symbol>
    <symbol id="icon-clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="8.25"/><path d="M12 7.5V12l3.25 2"/>
    </symbol>
    <symbol id="icon-clock-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="8.25"/><path d="m4 4 16 16M12 7.5V12l3.25 2"/>
    </symbol>
    <symbol id="icon-target" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="6.25"/><circle cx="12" cy="12" r="1.75"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/>
    </symbol>
    <symbol id="icon-map" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="m3.75 6.25 5-2.5 6.5 2.5 5-2.5v14.5l-5 2.5-6.5-2.5-5 2.5V6.25Z"/><path d="M8.75 3.75v14.5M15.25 6.25v14.5"/>
    </symbol>
    <symbol id="icon-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17.75 10.25c0 4.65-5.75 9.9-5.75 9.9s-5.75-5.25-5.75-9.9a5.75 5.75 0 1 1 11.5 0Z"/><circle cx="12" cy="10.25" r="2"/>
    </symbol>
    <symbol id="icon-pin-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17.5 10.25c0 4.35-5.5 9.5-5.5 9.5s-5.5-5.15-5.5-9.5a5.5 5.5 0 1 1 11 0Z"/><circle cx="12" cy="10.25" r="1.75"/><path d="m4 4 16 16"/>
    </symbol>
    <symbol id="icon-gear" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9.47 4.20 9.83 1.78h4.34l.36 2.42 1.19.49 1.97-1.45 3.07 3.07-1.45 1.97.49 1.19 2.42.36v4.34l-2.42.36-.49 1.19 1.45 1.97-3.07 3.07-1.97-1.45-1.19.49-.36 2.42H9.83l-.36-2.42-1.19-.49-1.97 1.45-3.07-3.07 1.45-1.97-.49-1.19-2.42-.36V9.83l2.42-.36.49-1.19-1.45-1.97 3.07-3.07 1.97 1.45 1.19-.49Z"/>
      <circle cx="12" cy="12" r="3.15"/>
      <path d="M12 8.85V5.2M15.15 12h3.65M12 15.15v3.65M8.85 12H5.2"/>
    </symbol>
    <symbol id="icon-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m5 12.5 4.25 4.25L19 7.25"/>
    </symbol>
    <symbol id="icon-image-upload" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3.5" y="5.25" width="17" height="13.5" rx="2.25"/><circle cx="8.5" cy="9.5" r="1.25"/><path d="m5.75 16.75 4.5-4.25 3.25 3 2.25-2.25 2.5 3.5M12 2.5v6M9.5 5l2.5-2.5L14.5 5"/>
    </symbol>
    <symbol id="icon-send" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="m20.25 3.75-7.2 16.5-3.4-6.45-6.4-3.1 17-6.95Z"/><path d="m9.65 13.8 4.55-4.55"/>
    </symbol>
    <symbol id="icon-trash" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4.75 7.25h14.5M9.5 7.25V4.5h5v2.75M6.75 7.25l.75 12.25h9l.75-12.25M10 11v4.75M14 11v4.75"/>
    </symbol>
  </svg>
