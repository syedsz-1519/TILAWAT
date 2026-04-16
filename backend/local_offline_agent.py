import os
import io
import wave
import json
import asyncio
from fastapi import APIRouter, File, UploadFile, BackgroundTasks
from fastapi.responses import FileResponse
import tempfile

# 1. Initialize API Router for the 100% Offline Agent
router = APIRouter()

# Global placeholders for the massive AI models (Lazy loaded to save RAM)
whisper_model = None
tts_model = None

def load_ai_models():
    """Lazily load the heavy machine learning models into memory."""
    global whisper_model, tts_model
    
    try:
        # Load Whisper (Speech-to-Text)
        if whisper_model is None:
            print("🧠 Loading Whisper AI (Speech Recognition)...")
            import whisper
            # Using base model for speed - completely offline!
            whisper_model = whisper.load_model("base")
            
        # Load Coqui TTS (Text-to-Speech)
        if tts_model is None:
            print("🗣️ Loading Coqui TTS (Voice Synthesis)...")
            from TTS.api import TTS
            # Fast, high-quality offline voice synthesis
            tts_model = TTS("tts_models/en/vctk/vits", gpu=False)
    except ImportError as e:
        print(f"⚠️ Local Offline Agent disabled on this node (Dependencies missing): {e}")
        
# Models are loaded lazily on first /speak_to_omar request, NOT at import time
# This prevents the server from freezing on startup
# load_ai_models()  # DISABLED: was downloading 1GB+ at import


@router.post("/speak_to_omar")
async def process_offline_voice(audio_file: UploadFile = File(...)):
    """
    The Ultimate 100% Local Voice Pipeline
    Input: Raw Audio bytes from Frontend
    Output: Raw Audio bytes (Response)
    """
    
    # ==========================================
    # STEP 1: WHISPER STT (Listen Offline)
    # ==========================================
    # Save the incoming voice temporarily
    temp_in = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
    temp_in.write(await audio_file.read())
    temp_in.close()
    
    print("🎤 Whisper is transcribing...")
    transcription = whisper_model.transcribe(temp_in.name)
    user_text = transcription["text"]
    print(f"User said: {user_text}")
    
    
    # ==========================================
    # STEP 2: OLLAMA LLM (Think Offline)
    # ==========================================
    # We use the python Ollama library to query the local llama3 model
    import ollama
    print("🧠 Ollama is generating a response natively...")
    
    prompt = f"You are Omar, an Islamic Voice Assistant. The user just said: '{user_text}'. Respond strictly in 2-3 short sentences, keeping it highly conversational."
    
    try:
        response = ollama.chat(model='llama3', messages=[
            {
                'role': 'user',
                'content': prompt
            }
        ])
        omar_reply = response['message']['content']
    except Exception as e:
        # Fallback if the user hasn't downloaded the llama3 model natively yet
        omar_reply = "I heard you locally, but Ollama is either not running, or you haven't pulled the llama3 model yet!"
        print("Ollama Error:", e)
        
    print(f"Omar replied: {omar_reply}")

    # ==========================================
    # STEP 2.5: PUSH TO DATABASE (Conversation History)
    # ==========================================
    try:
        from server import db
        import datetime
        import uuid
        
        # Save query and response payload to chat_history collection
        asyncio.create_task(db.chat_history.insert_one({
            "interaction_id": str(uuid.uuid4()),
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "user_query": user_text,
            "agent_response": omar_reply,
            "engine": "Ollama_Llama3_Local"
        }))
        print("💾 [DATABASE] Conversation successfully pushed to Conversation History DB.")
    except Exception as db_err:
        print("⚠️ Database push failed:", db_err)

    # ==========================================
    # STEP 3: COQUI TTS (Speak Offline)
    # ==========================================
    print("🗣️ Coqui TTS is generating the voice natively...")
    temp_out = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
    temp_out.close()
    
    # Generate the wav file entirely offline
    tts_model.tts_to_file(text=omar_reply, speaker="p227", file_path=temp_out.name)
    
    # Clean up input temp file
    os.unlink(temp_in.name)
    
    # Return the generated audio file natively to the frontend!
    return FileResponse(temp_out.name, media_type="audio/wav")

# Note: In server.py, you simply add:
# from local_offline_agent import router as offline_router
# app.include_router(offline_router, prefix="/api/offline")
