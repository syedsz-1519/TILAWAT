import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:image_picker/image_picker.dart';

// ── Config ────────────────────────────────────────────────────────────────────
// Change to your FastAPI base URL (use 10.0.2.2 for Android emulator)
const String _kApiBase = 'http://10.0.2.2:8000/api/v1/snap/verse';

// ── Design tokens ─────────────────────────────────────────────────────────────
const _kGreen       = Color(0xFF1D9E75);
const _kGreenDark   = Color(0xFF085041);
const _kGreenLight  = Color(0xFFE1F5EE);
const _kGold        = Color(0xFFC9A84C);
const _kGoldLight   = Color(0xFFFAEEDA);
const _kBg          = Color(0xFF0D1117);
const _kSurface     = Color(0xFF161B22);
const _kSurface2    = Color(0xFF21262D);
const _kTextPrimary = Color(0xFFF0F6FC);
const _kTextMuted   = Color(0xFF8B949E);
const _kBorder      = Color(0xFF30363D);

// ── Data model ────────────────────────────────────────────────────────────────
class _SnapResult {
  final int    surahNumber;
  final String surahName;
  final String surahNameArabic;
  final String surahRevelation;
  final int    totalAyahs;
  final int    ayahNumber;
  final String verseKey;
  final String arabicText;
  final String translation;
  final String tafsirText;
  final List<_Word> words;
  final String confidence;

  const _SnapResult({
    required this.surahNumber,
    required this.surahName,
    required this.surahNameArabic,
    required this.surahRevelation,
    required this.totalAyahs,
    required this.ayahNumber,
    required this.verseKey,
    required this.arabicText,
    required this.translation,
    required this.tafsirText,
    required this.words,
    required this.confidence,
  });

  factory _SnapResult.fromJson(Map<String, dynamic> j) => _SnapResult(
        surahNumber      : j['surah_number']       as int,
        surahName        : j['surah_name']          as String,
        surahNameArabic  : j['surah_name_arabic']   as String,
        surahRevelation  : j['surah_revelation']    as String,
        totalAyahs       : j['total_ayahs']         as int,
        ayahNumber       : j['ayah_number']         as int,
        verseKey         : j['verse_key']            as String,
        arabicText       : j['arabic_text']          as String,
        translation      : j['translation']          as String,
        tafsirText       : j['tafsir_text']          as String,
        confidence       : j['confidence']           as String,
        words            : (j['words'] as List)
            .map((w) => _Word.fromJson(w as Map<String, dynamic>))
            .toList(),
      );
}

class _Word {
  final int    position;
  final String arabic;
  final String transliteration;
  final String translation;

  const _Word({
    required this.position,
    required this.arabic,
    required this.transliteration,
    required this.translation,
  });

  factory _Word.fromJson(Map<String, dynamic> j) => _Word(
        position        : j['position']        as int,
        arabic          : j['arabic']           as String,
        transliteration : j['transliteration'] as String,
        translation     : j['translation']      as String,
      );
}

// ════════════════════════════════════════════════════════════════════════════
// Screen
// ════════════════════════════════════════════════════════════════════════════

class SnapUnderstandScreen extends StatefulWidget {
  const SnapUnderstandScreen({super.key});

  @override
  State<SnapUnderstandScreen> createState() => _SnapUnderstandScreenState();
}

class _SnapUnderstandScreenState extends State<SnapUnderstandScreen>
    with TickerProviderStateMixin {
  // ── State ──────────────────────────────────────────────────────────────────
  File?         _image;
  bool          _isLoading = false;
  _SnapResult?  _result;
  String?       _error;
  bool          _tafsirExpanded = false;

  final _picker = ImagePicker();

  // ── Animations ─────────────────────────────────────────────────────────────
  late final AnimationController _pulseCtrl = AnimationController(
    vsync    : this,
    duration : const Duration(milliseconds: 1400),
  )..repeat(reverse: true);

  late final Animation<double> _pulseAnim =
      Tween<double>(begin: 0.4, end: 1.0).animate(
    CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut),
  );

  late final AnimationController _slideCtrl = AnimationController(
    vsync    : this,
    duration : const Duration(milliseconds: 480),
  );

  late final Animation<Offset> _slideAnim = Tween<Offset>(
    begin : const Offset(0, 0.12),
    end   : Offset.zero,
  ).animate(CurvedAnimation(parent: _slideCtrl, curve: Curves.easeOutCubic));

  late final Animation<double> _fadeAnim =
      CurvedAnimation(parent: _slideCtrl, curve: Curves.easeOut);

  @override
  void dispose() {
    _pulseCtrl.dispose();
    _slideCtrl.dispose();
    super.dispose();
  }

  // ── Image picking ───────────────────────────────────────────────────────────
  Future<void> _pickImage(ImageSource source) async {
    final picked = await _picker.pickImage(
      source       : source,
      imageQuality : 90,
      maxWidth     : 1920,
    );
    if (picked == null) return;

    setState(() {
      _image   = File(picked.path);
      _result  = null;
      _error   = null;
      _tafsirExpanded = false;
    });

    _slideCtrl.reset();
    await _sendToApi();
  }

  // ── API call ────────────────────────────────────────────────────────────────
  Future<void> _sendToApi() async {
    if (_image == null) return;

    setState(() {
      _isLoading = true;
      _error     = null;
    });

    try {
      final ext         = _image!.path.split('.').last.toLowerCase();
      final mimeSubtype = ext == 'png' ? 'png' : 'jpeg';

      final request = http.MultipartRequest('POST', Uri.parse(_kApiBase))
        ..files.add(await http.MultipartFile.fromPath(
          'image',
          _image!.path,
          contentType: MediaType('image', mimeSubtype),
        ));

      final streamedResponse = await request.send().timeout(
        const Duration(seconds: 45),
      );
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        setState(() {
          _result    = _SnapResult.fromJson(data);
          _isLoading = false;
        });
        _slideCtrl.forward();
      } else {
        final msg = _tryExtractDetail(response.body);
        setState(() {
          _error     = msg;
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error     = 'Connection failed. Is the TILAWA backend running?';
        _isLoading = false;
      });
    }
  }

  String _tryExtractDetail(String body) {
    try {
      return (jsonDecode(body) as Map)['detail'] as String;
    } catch (_) {
      return 'Something went wrong. Please try again.';
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Build
  // ════════════════════════════════════════════════════════════════════════════

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor : _kBg,
      appBar          : _buildAppBar(),
      body            : _buildBody(),
    );
  }

  // ── AppBar ──────────────────────────────────────────────────────────────────
  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor  : _kBg,
      elevation        : 0,
      surfaceTintColor : Colors.transparent,
      leading          : IconButton(
        icon    : const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
        color   : _kTextPrimary,
        onPressed: () => Navigator.of(context).pop(),
      ),
      title : Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Snap & Understand',
            style: TextStyle(
              color      : _kTextPrimary,
              fontSize   : 17,
              fontWeight : FontWeight.w600,
            ),
          ),
          Text(
            'Point · Snap · Learn',
            style: TextStyle(color: _kTextMuted, fontSize: 12),
          ),
        ],
      ),
    );
  }

  // ── Body ────────────────────────────────────────────────────────────────────
  Widget _buildBody() {
    return SafeArea(
      child: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding : const EdgeInsets.all(16),
              child   : Column(
                children: [
                  _buildImageSection(),
                  const SizedBox(height: 16),
                  if (_isLoading) _buildLoadingCard(),
                  if (_error != null) _buildErrorCard(),
                  if (_result != null) _buildResultSection(),
                ],
              ),
            ),
          ),
          _buildActionBar(),
        ],
      ),
    );
  }

  // ── Image preview ────────────────────────────────────────────────────────────
  Widget _buildImageSection() {
    return GestureDetector(
      onTap: () => _pickImage(ImageSource.camera),
      child: Container(
        height    : 220,
        width     : double.infinity,
        decoration: BoxDecoration(
          color         : _kSurface,
          borderRadius  : BorderRadius.circular(16),
          border        : Border.all(
            color: _image != null ? _kGreen.withOpacity(0.5) : _kBorder,
            width: 1.5,
          ),
        ),
        child: _image == null ? _buildPlaceholder() : _buildImagePreview(),
      ),
    );
  }

  Widget _buildPlaceholder() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width : 64,
          height: 64,
          decoration: BoxDecoration(
            color        : _kGreen.withOpacity(0.12),
            shape        : BoxShape.circle,
          ),
          child: const Icon(Icons.camera_alt_rounded, color: _kGreen, size: 32),
        ),
        const SizedBox(height: 16),
        const Text(
          'Tap to photograph a Quran verse',
          style: TextStyle(color: _kTextMuted, fontSize: 14),
        ),
        const SizedBox(height: 6),
        Text(
          'or use the buttons below',
          style: TextStyle(color: _kTextMuted.withOpacity(0.6), fontSize: 12),
        ),
      ],
    );
  }

  Widget _buildImagePreview() {
    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: Stack(
        fit: StackFit.expand,
        children: [
          Image.file(_image!, fit: BoxFit.cover),
          // Dim overlay if loading
          if (_isLoading)
            Container(color: _kBg.withOpacity(0.55)),
        ],
      ),
    );
  }

  // ── Loading card ─────────────────────────────────────────────────────────────
  Widget _buildLoadingCard() {
    return Container(
      margin    : const EdgeInsets.only(bottom: 12),
      padding   : const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color        : _kSurface,
        borderRadius : BorderRadius.circular(14),
        border       : Border.all(color: _kGreen.withOpacity(0.35)),
      ),
      child: Row(
        children: [
          FadeTransition(
            opacity: _pulseAnim,
            child   : Container(
              width : 42,
              height: 42,
              decoration: BoxDecoration(
                color : _kGreen.withOpacity(0.15),
                shape : BoxShape.circle,
              ),
              child: const Icon(Icons.auto_awesome_rounded, color: _kGreen, size: 22),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Identifying verse...',
                  style: TextStyle(
                    color      : _kTextPrimary,
                    fontSize   : 15,
                    fontWeight : FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Consulting Claude Vision + Quran.com',
                  style: TextStyle(color: _kTextMuted, fontSize: 12),
                ),
                const SizedBox(height: 10),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child       : LinearProgressIndicator(
                    backgroundColor : _kGreen.withOpacity(0.12),
                    color           : _kGreen,
                    minHeight       : 3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Error card ───────────────────────────────────────────────────────────────
  Widget _buildErrorCard() {
    return Container(
      margin    : const EdgeInsets.only(bottom: 12),
      padding   : const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color        : const Color(0xFF3D1A1A),
        borderRadius : BorderRadius.circular(14),
        border       : Border.all(color: Colors.red.withOpacity(0.4)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline_rounded, color: Colors.redAccent, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              _error ?? 'Unknown error',
              style: const TextStyle(color: Colors.redAccent, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }

  // ── Result section ────────────────────────────────────────────────────────────
  Widget _buildResultSection() {
    final r = _result!;
    return FadeTransition(
      opacity : _fadeAnim,
      child   : SlideTransition(
        position : _slideAnim,
        child    : Column(
          children: [
            _buildSurahBadge(r),
            const SizedBox(height: 12),
            _buildArabicCard(r),
            const SizedBox(height: 12),
            _buildTranslationCard(r),
            const SizedBox(height: 12),
            _buildWordByWord(r),
            const SizedBox(height: 12),
            _buildTafsirCard(r),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  // ── Surah badge ──────────────────────────────────────────────────────────────
  Widget _buildSurahBadge(_SnapResult r) {
    final isHigh = r.confidence == 'high';
    return Row(
      children: [
        Container(
          padding   : const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color        : _kGreen.withOpacity(0.12),
            borderRadius : BorderRadius.circular(20),
            border       : Border.all(color: _kGreen.withOpacity(0.35)),
          ),
          child: Text(
            'Surah ${r.surahName}  ·  Ayah ${r.ayahNumber}  ·  ${r.verseKey}',
            style: const TextStyle(
              color      : _kGreen,
              fontSize   : 12,
              fontWeight : FontWeight.w600,
              letterSpacing: 0.3,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Container(
          padding   : const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color        : isHigh ? _kGold.withOpacity(0.12) : _kTextMuted.withOpacity(0.1),
            borderRadius : BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                isHigh ? Icons.verified_rounded : Icons.info_outline_rounded,
                size  : 12,
                color : isHigh ? _kGold : _kTextMuted,
              ),
              const SizedBox(width: 4),
              Text(
                '${r.confidence} confidence',
                style: TextStyle(
                  color    : isHigh ? _kGold : _kTextMuted,
                  fontSize : 11,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ── Arabic card ───────────────────────────────────────────────────────────────
  Widget _buildArabicCard(_SnapResult r) {
    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Bismillah hint
          if (r.ayahNumber == 1)
            Padding(
              padding : const EdgeInsets.only(bottom: 16),
              child   : Text(
                'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
                textAlign : TextAlign.center,
                style     : TextStyle(
                  color      : _kGold,
                  fontSize   : 18,
                  fontFamily : 'AmiriQuran',
                ),
              ),
            ),
          Text(
            r.arabicText,
            textAlign : TextAlign.right,
            textDirection: TextDirection.rtl,
            style     : const TextStyle(
              color      : _kTextPrimary,
              fontSize   : 26,
              fontFamily : 'AmiriQuran',
              height     : 2.0,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Text(
                r.surahNameArabic,
                style: TextStyle(
                  color      : _kGold.withOpacity(0.8),
                  fontSize   : 14,
                  fontFamily : 'AmiriQuran',
                ),
              ),
              const Spacer(),
              _revealPill(r.surahRevelation),
              const SizedBox(width: 8),
              Text(
                '${r.totalAyahs} verses',
                style: TextStyle(color: _kTextMuted, fontSize: 11),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _revealPill(String place) {
    final isMeccan = place.toLowerCase() == 'meccan';
    return Container(
      padding   : const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color        : isMeccan
            ? _kGold.withOpacity(0.12)
            : _kGreen.withOpacity(0.12),
        borderRadius : BorderRadius.circular(6),
      ),
      child: Text(
        isMeccan ? 'Meccan' : 'Medinan',
        style: TextStyle(
          color    : isMeccan ? _kGold : _kGreen,
          fontSize : 10,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  // ── Translation card ──────────────────────────────────────────────────────────
  Widget _buildTranslationCard(_SnapResult r) {
    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionHeader(Icons.translate_rounded, 'Translation'),
          const SizedBox(height: 10),
          Text(
            '"${r.translation}"',
            style: const TextStyle(
              color      : _kTextPrimary,
              fontSize   : 15,
              height     : 1.65,
              fontStyle  : FontStyle.italic,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '— Dr. Mustafa Khattab',
            style: TextStyle(color: _kTextMuted, fontSize: 11),
          ),
        ],
      ),
    );
  }

  // ── Word-by-word ──────────────────────────────────────────────────────────────
  Widget _buildWordByWord(_SnapResult r) {
    if (r.words.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding : const EdgeInsets.only(left: 4, bottom: 8),
          child   : _sectionHeader(Icons.spellcheck_rounded, 'Word by Word'),
        ),
        SizedBox(
          height: 110,
          child : ListView.separated(
            scrollDirection  : Axis.horizontal,
            padding          : const EdgeInsets.symmetric(horizontal: 2),
            itemCount        : r.words.length,
            separatorBuilder : (_, __) => const SizedBox(width: 8),
            itemBuilder      : (_, i) => _wordCard(r.words[i]),
          ),
        ),
      ],
    );
  }

  Widget _wordCard(_Word w) {
    return Container(
      width     : 100,
      padding   : const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color        : _kSurface2,
        borderRadius : BorderRadius.circular(12),
        border       : Border.all(color: _kBorder),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          Text(
            w.arabic,
            textAlign : TextAlign.center,
            style     : const TextStyle(
              color      : _kTextPrimary,
              fontSize   : 20,
              fontFamily : 'AmiriQuran',
              height     : 1.4,
            ),
          ),
          Text(
            w.transliteration,
            textAlign : TextAlign.center,
            style     : const TextStyle(
              color      : _kGreen,
              fontSize   : 10,
              fontStyle  : FontStyle.italic,
            ),
            maxLines  : 1,
            overflow  : TextOverflow.ellipsis,
          ),
          Text(
            w.translation,
            textAlign : TextAlign.center,
            style     : TextStyle(color: _kTextMuted, fontSize: 10),
            maxLines  : 2,
            overflow  : TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  // ── Tafsir card ───────────────────────────────────────────────────────────────
  Widget _buildTafsirCard(_SnapResult r) {
    if (r.tafsirText.isEmpty) return const SizedBox.shrink();

    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _sectionHeader(Icons.menu_book_rounded, 'Tafsir Ibn Kathir'),
              const Spacer(),
              GestureDetector(
                onTap  : () => setState(() => _tafsirExpanded = !_tafsirExpanded),
                child  : Row(
                  children: [
                    Text(
                      _tafsirExpanded ? 'Collapse' : 'Expand',
                      style: const TextStyle(color: _kGreen, fontSize: 12),
                    ),
                    Icon(
                      _tafsirExpanded
                          ? Icons.keyboard_arrow_up_rounded
                          : Icons.keyboard_arrow_down_rounded,
                      color : _kGreen,
                      size  : 18,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          AnimatedCrossFade(
            duration        : const Duration(milliseconds: 260),
            crossFadeState  : _tafsirExpanded
                ? CrossFadeState.showSecond
                : CrossFadeState.showFirst,
            firstChild  : Text(
              r.tafsirText.length > 220
                  ? '${r.tafsirText.substring(0, 220)}…'
                  : r.tafsirText,
              style  : const TextStyle(
                color  : _kTextPrimary,
                fontSize: 13,
                height : 1.7,
              ),
            ),
            secondChild : Text(
              r.tafsirText,
              style: const TextStyle(
                color   : _kTextPrimary,
                fontSize: 13,
                height  : 1.7,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Action bar (bottom buttons) ────────────────────────────────────────────
  Widget _buildActionBar() {
    return Container(
      padding   : const EdgeInsets.fromLTRB(16, 12, 16, 20),
      decoration: BoxDecoration(
        color : _kBg,
        border: Border(top: BorderSide(color: _kBorder, width: 0.5)),
      ),
      child: Row(
        children: [
          Expanded(
            child: _actionButton(
              icon    : Icons.photo_library_rounded,
              label   : 'Gallery',
              onTap   : () => _pickImage(ImageSource.gallery),
              isPrimary: false,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            flex    : 2,
            child   : _actionButton(
              icon    : Icons.camera_alt_rounded,
              label   : 'Take Photo',
              onTap   : () => _pickImage(ImageSource.camera),
              isPrimary: true,
            ),
          ),
        ],
      ),
    );
  }

  Widget _actionButton({
    required IconData icon,
    required String   label,
    required VoidCallback onTap,
    required bool     isPrimary,
  }) {
    return GestureDetector(
      onTap  : _isLoading ? null : onTap,
      child  : AnimatedOpacity(
        opacity  : _isLoading ? 0.45 : 1.0,
        duration : const Duration(milliseconds: 200),
        child    : Container(
          padding   : const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color        : isPrimary ? _kGreen : _kSurface2,
            borderRadius : BorderRadius.circular(14),
            border       : isPrimary
                ? null
                : Border.all(color: _kBorder),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 18, color: isPrimary ? Colors.white : _kTextMuted),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  color      : isPrimary ? Colors.white : _kTextMuted,
                  fontSize   : 14,
                  fontWeight : FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  Widget _card({required Widget child}) {
    return Container(
      width     : double.infinity,
      padding   : const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color        : _kSurface,
        borderRadius : BorderRadius.circular(14),
        border       : Border.all(color: _kBorder),
      ),
      child: child,
    );
  }

  Widget _sectionHeader(IconData icon, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 15, color: _kGreen),
        const SizedBox(width: 6),
        Text(
          label,
          style: const TextStyle(
            color      : _kTextMuted,
            fontSize   : 12,
            fontWeight : FontWeight.w600,
            letterSpacing: 0.4,
          ),
        ),
      ],
    );
  }
}
