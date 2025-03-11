import os
import json
import hashlib
import datetime
from pathlib import Path
from tqdm import tqdm
import whisper
import ffmpeg
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import ChatPromptTemplate
from dotenv import load_dotenv
import time
from tenacity import retry, stop_after_attempt, wait_exponential

class AudioToJSONL:
    def __init__(self, audio_dir, output_dir):
        self.audio_dir = Path(audio_dir)
        self.output_dir = Path(output_dir)
        self.transcript_dir = self.output_dir / "transcript"
        self.jsonl_file = self.output_dir / "math_qa.jsonl"
        self.processed_files_json = self.output_dir / "processed_files.json"
        
        # Create directories
        self.transcript_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize models
        print("Loading Whisper model...")
        self.whisper_model = whisper.load_model("large")
        print("Loading Gemini model...")
        self.llm = self._setup_gemini()
        print("Models loaded!")
        
        self.processed_files = self._load_processed_files()
        self.prompt_template = self._create_prompt_template()
        
        # File extensions
        self.audio_extensions = {'.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'}
        self.video_extensions = {'.mp4', '.avi', '.mov', '.mkv', '.wmv'}

    def _setup_gemini(self):
        """Setup Gemini model"""
        load_dotenv()
        return ChatGoogleGenerativeAI(
            model="gemini-2.0-pro-exp-02-05",
            temperature=0.7,
            google_api_key=os.getenv("GOOGLE_API_KEY")
        )

    def _create_prompt_template(self):
        """Create prompt template for JSONL conversion"""
        template = """You are an AI assistant that helps convert math teaching transcripts into JSONL format.
        Given the following transcript of a math teaching video:
        1. Correct any typos and unclear explanations in Indonesian
        2. Use proper Indonesian mathematical terms
        3. Make sure the explanation is clear and step-by-step
        4. Keep the mathematical method (Gasing) intact
        5. Format numbers clearly (avoid using hyphens like 10-2, instead use "10 ditambah 2")
        
        Transcript:
        {transcript}
        
        First, correct the transcript to proper Indonesian, then generate the content in this exact format:
        {{"text": "You are a math teacher using the Gasing method\\n\\nHuman: [generated question in Indonesian]\\n\\nAssistant: [corrected explanation with proper Indonesian]"}}
        """
        return ChatPromptTemplate.from_template(template)

    def _load_processed_files(self):
        """Load processed files record"""
        if self.processed_files_json.exists():
            with open(self.processed_files_json, 'r') as f:
                return json.load(f)
        return {}

    def _save_processed_files(self):
        """Save processed files record"""
        with open(self.processed_files_json, 'w') as f:
            json.dump(self.processed_files, f, indent=4)

    def _calculate_file_hash(self, file_path):
        """Calculate MD5 hash of file"""
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()

    def _extract_audio(self, video_path):
        """Extract audio from video"""
        audio_path = video_path.with_suffix('.mp3')
        try:
            (
                ffmpeg
                .input(str(video_path))
                .output(str(audio_path), acodec='libmp3lame', q=4)
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
            return audio_path
        except ffmpeg.Error as e:
            print(f"Error extracting audio: {e.stderr.decode()}")
            raise

    def _validate_jsonl(self, content):
        """Validate JSONL format"""
        try:
            parsed = json.loads(content)
            if not isinstance(parsed, dict) or 'text' not in parsed:
                return False
            text = parsed['text']
            return all(x in text for x in ['You are a math teacher using the Gasing method', 'Human:', 'Assistant:'])
        except json.JSONDecodeError:
            return False

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=5, min=10, max=300))
    def _transcribe_and_convert(self, audio_file):
        """Transcribe audio and convert to JSONL"""
        # Transcribe
        print(f"Transcribing {audio_file.name}...")
        result = self.whisper_model.transcribe(str(audio_file))
        transcript = result["text"].strip()
        
        # Save transcript
        transcript_file = self.transcript_dir / f"{audio_file.stem}.txt"
        with open(transcript_file, "w", encoding="utf-8") as f:
            f.write(transcript)
        
        # Convert to JSONL
        print(f"Converting to JSONL format...")
        chain = self.prompt_template | self.llm
        result = chain.invoke({"transcript": transcript})
        content = result.content.replace('```jsonl', '').replace('```', '').replace('json', '').strip()
        
        if not self._validate_jsonl(content):
            raise ValueError(f"Invalid JSONL format for {audio_file.name}")
        
        return content, transcript_file

    def process_files(self):
        """Process all audio/video files"""
        # Find media files
        audio_files = []
        video_files = []
        for file in self.audio_dir.iterdir():
            if file.name.startswith('.') or file.name == '.gitkeep':
                continue
            if file.suffix.lower() in self.audio_extensions:
                audio_files.append(file)
            elif file.suffix.lower() in self.video_extensions:
                video_files.append(file)

        # Extract audio from videos
        for video in video_files:
            try:
                audio_file = self._extract_audio(video)
                audio_files.append(audio_file)
            except Exception as e:
                print(f"Failed to extract audio from {video.name}: {e}")

        # Process audio files
        valid_entries = []
        failed_files = []
        
        for audio_file in tqdm(audio_files, desc="Processing files"):
            try:
                file_hash = self._calculate_file_hash(audio_file)
                if str(audio_file) in self.processed_files and self.processed_files[str(audio_file)]["hash"] == file_hash:
                    print(f"Skipping {audio_file.name} - already processed")
                    continue

                jsonl_content, transcript_file = self._transcribe_and_convert(audio_file)
                valid_entries.append(jsonl_content)
                
                self.processed_files[str(audio_file)] = {
                    "hash": file_hash,
                    "timestamp": datetime.datetime.now().isoformat(),
                    "transcript_file": str(transcript_file),
                }
                self._save_processed_files()
                
                print(f"Successfully processed: {audio_file.name}")
                time.sleep(5)  # Rate limiting
                
            except Exception as e:
                failed_files.append(audio_file.name)
                print(f"Failed to process {audio_file.name}: {e}")

        # Write JSONL file
        with open(self.jsonl_file, 'w', encoding='utf-8') as f:
            for entry in valid_entries:
                f.write(entry + '\n')

        # Report results
        print(f"\nProcessing complete:")
        print(f"Successfully processed: {len(valid_entries)} files")
        if failed_files:
            print(f"Failed to process: {len(failed_files)} files")
            print("Failed files:", ', '.join(failed_files))

def main():
    project_root = Path("/Users/dewanekonominasional/Documents/GitHub/redux_todo_in_astro")
    audio_dir = Path("/Users/dewanekonominasional/Downloads/video_exp")
    output_dir = project_root / "Docs/to-do-plan/data/processed"
    
    # Create output directory if it doesn't exist
    output_dir.mkdir(parents=True, exist_ok=True)
    
    processor = AudioToJSONL(audio_dir, output_dir)
    processor.process_files()

if __name__ == "__main__":
    main()