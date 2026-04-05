import 'package:flutter/material.dart';
// import 'package:flutter_riverpod/flutter_riverpod.dart';

// Setup Riverpod Global Scope
// void main() => runApp(const ProviderScope(child: TilawaApp()));

void main() => runApp(const TilawaApp());

class TilawaApp extends StatelessWidget {
  const TilawaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TILAWA ML',
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xFFE6C364),
        scaffoldBackgroundColor: const Color(0xFF0F0F13),
      ),
      home: const MushafScreen(),
    );
  }
}

class MushafScreen extends StatelessWidget {
  const MushafScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Al-Fatihah', style: TextStyle(color: Color(0xFFE6C364))),
        backgroundColor: const Color(0xFF1A1A22),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ',
              style: TextStyle(fontSize: 42, color: Colors.white),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: () {
                // Post to ML Tajweed service
              }, 
              icon: const Icon(Icons.mic), 
              label: const Text("Practice Tajweed")
            )
          ],
        ),
      ),
    );
  }
}
