import 'package:flutter/material.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          "السَّلَامُ عَلَيْكُمْ",
          style: TextStyle(fontFamily: 'Amiri', fontSize: 24, color: Color(0xFFE6C364)),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Progress Ring Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF1A1A22),
                borderRadius: BorderRadius.circular(15),
                border: Border.all(color: const Color(0xFFE6C364).withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  const SizedBox(
                    width: 70,
                    height: 70,
                    child: CircularProgressIndicator(
                      value: 0.65,
                      strokeWidth: 6,
                      backgroundColor: Colors.black26,
                      color: Color(0xFFE6C364),
                    ),
                  ),
                  const SizedBox(width: 20),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text("Hifdh Progress", style: TextStyle(color: Colors.grey)),
                      const SizedBox(height: 5),
                      const Text("Al-Baqarah", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      Text("65% Mastered", style: TextStyle(color: const Color(0xFFE6C364).withOpacity(0.8))),
                    ],
                  )
                ],
              ),
            ),
            
            const SizedBox(height: 30),
            
            // Ayah Card
            const Text("Ayat of the Day", style: TextStyle(color: Color(0xFFE6C364), letterSpacing: 2, fontSize: 12)),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: const Color(0xFF1A1A22),
                borderRadius: BorderRadius.circular(15),
                border: Border.all(color: const Color(0xFFE6C364).withOpacity(0.1)),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    "يَا أَيُّهَا الَّذِينَ آمَنُوَاْ كُتِبَ عَلَيْكُمُ الصِّيَامُ",
                    textAlign: TextAlign.right,
                    style: TextStyle(fontFamily: 'Amiri', fontSize: 26, height: 1.8),
                  ),
                  SizedBox(height: 15),
                  Text(
                    "O believers! Fasting is prescribed for you...",
                    style: TextStyle(color: Colors.grey, height: 1.5),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
