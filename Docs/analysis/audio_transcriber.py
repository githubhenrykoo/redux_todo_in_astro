import os
import json
import hashlib
import datetime
from pathlib import Path
from tqdm import tqdm
import whisper
from pydub import AudioSegment

class AudioTranscriber:
    def __init__(self, audio_dir, transcript_dir):
        self.audio_dir = Path(audio_dir)
        self.transcript_dir = Path(transcript_dir)
        self.processed_files_json = self.transcript_dir / "processed_files.json"
        print("Loading Whisper model...")
        self.model = whisper.load_model("small")
        print("Model loaded!")
        self.processed_files = self._load_processed_files()

    def _load_processed_files(self):
        """Load the processed files record or create if doesn't exist."""
        if self.processed_files_json.exists():
            with open(self.processed_files_json, 'r') as f:
                return json.load(f)
        return {}

    def _save_processed_files(self):
        """Save the processed files record."""
        with open(self.processed_files_json, 'w') as f:
            json.dump(self.processed_files, f, indent=4)

    def _calculate_file_hash(self, file_path):
        """Calculate MD5 hash of a file."""
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()

    def _needs_processing(self, file_path, file_hash):
        """Check if file needs to be processed based on hash."""
        if str(file_path) not in self.processed_files:
            return True
        return self.processed_files[str(file_path)]["hash"] != file_hash

    def transcribe_audio(self):
        """Transcribe all audio files in the directory that need processing."""
        audio_files = list(self.audio_dir.glob("*.[mM][pP][3234]")) + \
                     list(self.audio_dir.glob("*.[wW][aA][vV]")) + \
                     list(self.audio_dir.glob("*.[fF][lL][aA][cC]"))

        for audio_file in tqdm(audio_files, desc="Processing audio files"):
            file_hash = self._calculate_file_hash(audio_file)
            
            if not self._needs_processing(audio_file, file_hash):
                print(f"Skipping {audio_file.name} - already processed")
                continue

            print(f"Transcribing {audio_file.name}...")
            try:
                # Show spinner during transcription
                with tqdm(total=0, desc="Transcribing", bar_format='{desc}: {elapsed}') as pbar:
                    result = self.model.transcribe(str(audio_file))
                    transcript = result["text"].strip()
                
                # Save transcription
                transcript_file = self.transcript_dir / f"{audio_file.stem}.txt"
                with open(transcript_file, "w", encoding="utf-8") as f:
                    f.write(transcript)

                # Update processed files record
                self.processed_files[str(audio_file)] = {
                    "hash": file_hash,
                    "timestamp": datetime.datetime.now().isoformat(),
                    "transcript_file": str(transcript_file)
                }
                
                # Save after each successful transcription
                self._save_processed_files()
                
            except Exception as e:
                print(f"Error processing {audio_file.name}: {str(e)}")

def main():
    # Define paths
    base_dir = Path(__file__).parent.parent
    audio_dir = base_dir / "data" / "raw" / "audio"
    transcript_dir = base_dir / "data" / "processed" / "transcript"

    # Create directories if they don't exist
    audio_dir.mkdir(parents=True, exist_ok=True)
    transcript_dir.mkdir(parents=True, exist_ok=True)

    # Initialize and run transcriber
    transcriber = AudioTranscriber(audio_dir, transcript_dir)
    transcriber.transcribe_audio()

if __name__ == "__main__":
    main()
