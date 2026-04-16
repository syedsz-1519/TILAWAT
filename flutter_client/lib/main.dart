import 'dart:ui';
import 'package:flutter/material.dart';
import 'screens/home_screen.dart';
import 'screens/surah_list_screen.dart';

void main() => runApp(const TilawaApp());

class TilawaApp extends StatelessWidget {
  const TilawaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TILAWA AI',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xFFC8943F), // Premium Gold Accent
        scaffoldBackgroundColor: const Color(0xFF0C1118), // Deep Void Black
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.transparent,
          elevation: 0,
        ),
      ),
      home: const MainNavigation(),
    );
  }
}

class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const HomeScreen(),
    const SurahListScreen(),
    // Temporary Stubs until we completely port over the React components
    _buildStubScreen("Tajweed AI Studio", Icons.mic_rounded),
    _buildStubScreen("Verse Creator AI", Icons.auto_awesome),
    _buildStubScreen("User Settings", Icons.person_rounded),
  ];

  static Widget _buildStubScreen(String title, IconData icon) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 80, color: const Color(0xFFC8943F).withOpacity(0.4)),
          const SizedBox(height: 24),
          Text(title, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white70)),
          const SizedBox(height: 12),
          const Text("Flutter Parity Engine Initializing...", style: TextStyle(color: Color(0xFF506070))),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true, // Ensures the background renders underneath the floating nav bar
      body: _screens[_currentIndex],
      bottomNavigationBar: Container(
        margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(30),
          color: const Color(0xFF141C28).withOpacity(0.6),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0C1118).withOpacity(0.5),
              blurRadius: 20,
              offset: const Offset(0, 10),
            )
          ],
          border: Border.all(color: Colors.white.withOpacity(0.08), width: 1.5),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(30),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
            child: BottomNavigationBar(
              currentIndex: _currentIndex,
              onTap: (index) => setState(() => _currentIndex = index),
              backgroundColor: Colors.transparent,
              elevation: 0,
              selectedItemColor: const Color(0xFFC8943F),
              unselectedItemColor: const Color(0xFF506070),
              showSelectedLabels: true,
              showUnselectedLabels: false,
              type: BottomNavigationBarType.fixed,
              items: const [
                BottomNavigationBarItem(icon: Icon(Icons.dashboard_rounded), label: 'Hub'),
                BottomNavigationBarItem(icon: Icon(Icons.menu_book_rounded), label: 'Mushaf'),
                BottomNavigationBarItem(icon: Icon(Icons.mic_rounded), label: 'Tajweed'),
                BottomNavigationBarItem(icon: Icon(Icons.auto_awesome), label: 'AI Studio'),
                BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Profile'),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
