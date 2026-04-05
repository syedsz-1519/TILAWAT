import 'package:flutter/material.dart';

class SurahListScreen extends StatelessWidget {
  const SurahListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Surahs", style: TextStyle(color: Colors.white)),
        actions: [
          IconButton(icon: const Icon(Icons.search, color: Color(0xFFE6C364)), onPressed: () {})
        ],
      ),
      body: ListView.separated(
        itemCount: 114,
        separatorBuilder: (context, index) => Divider(color: const Color(0xFFE6C364).withOpacity(0.2)),
        itemBuilder: (context, index) {
          int surahNumber = index + 1;
          return ListTile(
            leading: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                border: Border.all(color: const Color(0xFFE6C364)),
                borderRadius: BorderRadius.circular(5),
              ),
              child: Center(
                child: Text(
                  surahNumber.toString(),
                  style: const TextStyle(color: Color(0xFFE6C364)),
                ),
              ),
            ),
            title: Text("Surah $surahNumber", style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: const Text("Meccan • Ayahs", style: TextStyle(color: Colors.grey, fontSize: 12)),
            trailing: const Text(
              "سورة",
              style: TextStyle(fontFamily: 'Amiri', fontSize: 22, color: Color(0xFFE6C364)),
            ),
            onTap: () {
              // Navigate to Mushaf Reader
            },
          );
        },
      ),
    );
  }
}
