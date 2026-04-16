import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Download, Share2, Palette, Type, CheckCircle, Sparkles, Loader2 } from 'lucide-react';
import { Input } from '../ui/input';
import html2canvas from 'html2canvas';

// API key loaded securely from environment variable (REACT_APP_ prefix required by CRA)
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || "";

export default function VerseCreator() {
  const [theme, setTheme] = useState("dark");
  const [fontSize, setFontSize] = useState([36]); // Increased default size
  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const cardRef = useRef(null);
  
  const [verse, setVerse] = useState({
    arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    translation: "Indeed, with hardship [will be] ease.",
    reference: "Surah Ash-Sharh 94:6"
  });

  const themes = {
    dark: "bg-slate-900 text-white border-slate-700",
    light: "bg-white text-slate-800 border-slate-200",
    emerald: "bg-emerald-900 text-emerald-50 border-emerald-700",
    royal: "bg-indigo-950 text-indigo-50 border-indigo-800"
  };

  const generateVerseWithAI = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an expert in the Quran. The user wants a Quranic verse based on this prompt: "${prompt}". 
              Please provide exactly ONE highly relevant verse. 
              Output strictly valid JSON with three keys: "arabic" (the Arabic text with tashkeel), "translation" (fluent English translation), and "reference" (e.g. "Surah Al-Baqarah 2:286"). Do not output markdown code blocks, ONLY pure JSON.`
            }]
          }]
        })
      });

      const data = await response.json();
      let rawText = data.candidates[0].content.parts[0].text;
      
      // Clean up markdown markers if Gemini ignores the instruction
      if (rawText.startsWith('```json')) {
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      }

      const generatedVerse = JSON.parse(rawText);
      if (generatedVerse.arabic && generatedVerse.translation) {
        setVerse(generatedVerse);
        setPrompt(""); // Clear the input on success
      }
    } catch (error) {
      console.error("AI Generation Error", error);
      // Fallback or alert mechanism could be placed here
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-8 min-h-[85vh] bg-[#0A0A0F]/50">
      {/* Settings / Controls Section */}
      <Card className="flex-1 bg-[#111116]/80 backdrop-blur-xl border border-white/5 shadow-2xl rounded-3xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#E6C364]/5 to-transparent pointer-events-none"></div>
        <CardHeader className="border-b border-white/5 pb-6">
          <CardTitle className="flex items-center gap-3 text-[#E6C364] font-['Noto_Serif'] tracking-wider text-xl">
            <Palette className="w-5 h-5" /> 
            Studio Canvas Settings
          </CardTitle>
          <p className="text-xs text-[#9a9a9a] tracking-wide uppercase mt-2">Design extraordinary Quranic assets</p>
        </CardHeader>
        <CardContent className="space-y-8 pt-8">
          
          {/* AI Search Mechanics */}
          <div className="space-y-4 bg-white/5 p-4 rounded-2xl border border-[#E6C364]/20 shadow-[0_0_15px_rgba(230,195,100,0.05)]">
            <Label className="uppercase text-[10px] tracking-widest text-[#E6C364] flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" /> AI Verse Fetcher
            </Label>
            <div className="flex gap-2">
              <Input 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && generateVerseWithAI()}
                placeholder="e.g. A verse about gratitude..."
                className="bg-black/40 border-white/10 text-white placeholder:text-slate-500 rounded-xl"
              />
              <Button 
                onClick={generateVerseWithAI} 
                disabled={isGenerating || !prompt.trim()} 
                className="bg-[#E6C364] text-black hover:bg-[#c9a74a] rounded-xl px-3"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-[9px] text-[#9a9a9a] text-right">Powered by Gemini Pro</p>
          </div>

          <div className="space-y-4">
            <Label className="uppercase text-[10px] tracking-widest text-[#9a9a9a]">Color Atmosphere</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="h-12 bg-black/40 border-white/10 text-[#E5E2E1] focus:ring-[#E6C364]/50 rounded-xl">
                <SelectValue placeholder="Select atmospheric theme" />
              </SelectTrigger>
              <SelectContent className="bg-[#0F0F16] border-white/10 text-[#E5E2E1]">
                <SelectItem value="dark">Midnight Void (Default)</SelectItem>
                <SelectItem value="light">Pristine Ivory</SelectItem>
                <SelectItem value="emerald">Emerald Oasis (Traditional)</SelectItem>
                <SelectItem value="royal">Royal Indigo (Premium)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="flex items-center gap-2 uppercase text-[10px] tracking-widest text-[#9a9a9a]">
                <Type className="w-3.5 h-3.5" /> Calligraphy Scale
              </Label>
              <span className="text-xs font-mono text-[#E6C364] bg-[#E6C364]/10 px-2 py-1 rounded-md">{fontSize[0]}px</span>
            </div>
            <Slider 
              value={fontSize} 
              onValueChange={setFontSize} 
              max={80} 
              min={24} 
              step={1}
              className="py-4"
            />
          </div>

          {/* New Input Logic For Future Customization */}
          <div className="space-y-4">
             <Label className="uppercase text-[10px] tracking-widest text-[#9a9a9a]">Canvas Opacity Check</Label>
             <div className="h-2 w-full bg-gradient-to-r from-transparent via-[#E6C364]/50 to-transparent rounded-full opacity-30"></div>
          </div>
        </CardContent>

        {/* Action Buttons */}
        <CardFooter className="flex gap-4 p-6 border-t border-white/5 bg-black/20">
          <Button 
            onClick={async () => {
              if(!cardRef.current) return;
              setIsExporting(true);
              try {
                // Ensure high-resolution scaling
                const canvas = await html2canvas(cardRef.current, { 
                  backgroundColor: null,
                  scale: 3, // Boosted rendering scale
                  logging: false,
                  useCORS: true
                });
                const link = document.createElement("a");
                link.download = "tilawa-verse-render.png";
                link.href = canvas.toDataURL("image/png", 1.0);
                link.click();
              } catch (err) { console.error("Export Failed", err); } 
              finally { setTimeout(() => setIsExporting(false), 2000); }
            }}
            className="flex-1 bg-[#E6C364] text-black hover:bg-[#c9a74a] font-semibold h-12 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_-5px_rgba(230,195,100,0.5)] flex gap-2"
          >
            {isExporting ? <CheckCircle className="w-4 h-4 text-green-700"/> : <Download className="w-4 h-4"/>} 
            {isExporting ? "Success!" : "Render Image"}
          </Button>
          <Button variant="outline" onClick={async () => {
            const text = `${verse.arabic}\n\n"${verse.translation}"\n\n— ${verse.reference}`;
            if (navigator.share) {
              try { await navigator.share({ title: verse.reference, text, url: window.location.href }); } catch(e) {}
            } else {
              try { await navigator.clipboard.writeText(text); alert("Verse copied to clipboard!"); } catch(e) {}
            }
          }} className="flex-1 border-white/10 text-[#E5E2E1] hover:bg-white/5 h-12 rounded-xl transition-all hover:scale-[1.02] flex gap-2">
            <Share2 className="w-4 h-4"/> Share
          </Button>
        </CardFooter>
      </Card>

      {/* Extraordinary 3D Preview Glass Canvas */}
      <div className="flex-[1.8] flex items-center justify-center p-4 lg:p-12 relative group perspective-[2000px]">
        {/* Glow behind the canvas */}
        <div className="absolute inset-0 bg-[#E6C364]/5 blur-[120px] rounded-full scale-75 group-hover:scale-100 transition-transform duration-1000"></div>
        
        <div ref={cardRef}>
          <Card 
            className={`w-full max-w-2xl min-h-[400px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.7)] transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] rounded-[2rem] overflow-hidden border-2 hover:rotate-y-2 hover:-rotate-x-2 relative z-10 flex flex-col justify-center ${themes[theme].split(' ').join(' ')}`}
          >
          {/* Internal gradient lighting overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/40 pointer-events-none"></div>
          
          <CardContent className="p-12 md:p-16 space-y-10 relative z-10 flex flex-col items-center text-center">
            {/* Calligraphic Arabic */}
            <div 
              className="font-arabic leading-[1.8] tracking-wide w-full" 
              style={{ 
                fontSize: `${fontSize[0]}px`,
                textShadow: theme === "dark" || theme === "royal" ? "0 4px 20px rgba(255,255,255,0.1)" : "none"
              }}
              dir="rtl"
            >
              {verse.arabic}
            </div>
            
            {/* Minimalist Divider */}
            <div className="w-12 h-1 bg-current opacity-20 rounded-full"></div>
            
            {/* English & Ref */}
            <div className="space-y-4">
              <p className="text-xl md:text-2xl font-light opacity-90 leading-relaxed font-serif max-w-lg mx-auto">
                "{verse.translation}"
              </p>
              <div className="inline-block mt-4">
                <p className="text-xs opacity-60 font-medium uppercase tracking-[0.2em] border border-current/20 px-4 py-1.5 rounded-full">
                  {verse.reference}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
