import 'package:flutter/material.dart';
import 'dart:ui';
import 'colors.dart';

class TilawaTypography {
  // ---------------------------------------------------------------------------
  // ARABIC HIERARCHY
  // ---------------------------------------------------------------------------

  // Display Large: Bismillah, featured verses
  static const TextStyle arabicDisplayLarge = TextStyle(
    fontFamily: 'AmiriQuran',
    fontSize: 48,
    height: 2.5,
    color: TilawaColors.darkGoldAccent,
    fontFeatures: [FontFeature.enable('liga'), FontFeature.enable('calt')],
  );

  // Display Medium: Main Mushaf reading, verse cards
  static const TextStyle arabicDisplayMedium = TextStyle(
    fontFamily: 'AmiriQuran',
    fontSize: 32,
    height: 2.3,
    color: TilawaColors.darkArabicText,
    fontFeatures: [FontFeature.enable('liga'), FontFeature.enable('calt')],
  );

  // Display Small: Tajweed practice screen
  static const TextStyle arabicDisplaySmall = TextStyle(
    fontFamily: 'AmiriQuran',
    fontSize: 24,
    height: 2.2,
    color: TilawaColors.darkArabicText,
    fontFeatures: [FontFeature.enable('liga'), FontFeature.enable('calt')],
  );

  // Title: Surah names in list, headers
  static const TextStyle arabicTitle = TextStyle(
    fontFamily: 'NotoKufiArabic',
    fontSize: 20,
    height: 1.6,
    color: TilawaColors.darkGoldAccent,
  );

  // Subtitle: In-app Arabic labels, subheadings
  static const TextStyle arabicSubtitle = TextStyle(
    fontFamily: 'NotoNaskhArabic',
    fontSize: 16,
    height: 1.8,
    color: TilawaColors.darkArabicText,
  );

  // Body: Tafseer text, longer explanations
  static const TextStyle arabicBody = TextStyle(
    fontFamily: 'ScheherazadeNew',
    fontSize: 14,
    height: 2.0,
    color: TilawaColors.textBody,
  );

  // Caption: Word translations, footnotes
  static const TextStyle arabicCaption = TextStyle(
    fontFamily: 'NotoNaskhArabic',
    fontSize: 12,
    height: 1.6,
    color: TilawaColors.textCaption,
  );

  // ---------------------------------------------------------------------------
  // ENGLISH HIERARCHY
  // ---------------------------------------------------------------------------

  static const TextStyle heading1 = TextStyle(
    fontFamily: 'PlusJakartaSans',
    fontWeight: FontWeight.w700,
    fontSize: 24,
    color: TilawaColors.textHeading,
  );

  static const TextStyle heading2 = TextStyle(
    fontFamily: 'PlusJakartaSans',
    fontWeight: FontWeight.w600,
    fontSize: 18,
    color: TilawaColors.textHeading,
  );

  static const TextStyle heading3 = TextStyle(
    fontFamily: 'PlusJakartaSans',
    fontWeight: FontWeight.w600,
    fontSize: 16,
    color: TilawaColors.textHeading,
  );

  static const TextStyle body = TextStyle(
    fontFamily: 'PlusJakartaSans',
    fontWeight: FontWeight.w400,
    fontSize: 14,
    height: 1.6,
    color: TilawaColors.textBody,
  );

  static const TextStyle caption = TextStyle(
    fontFamily: 'PlusJakartaSans',
    fontWeight: FontWeight.w400,
    fontSize: 12,
    color: TilawaColors.textCaption,
  );

  static const TextStyle monoBadge = TextStyle(
    fontFamily: 'DMMono',
    fontWeight: FontWeight.w400,
    fontSize: 11,
  );

  static const TextStyle uppercaseLabel = TextStyle(
    fontFamily: 'PlusJakartaSans',
    fontWeight: FontWeight.w600,
    fontSize: 10,
    letterSpacing: 1.5,
  );
}
