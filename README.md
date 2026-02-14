# Japanese Text Analyzer

A fully offline Japanese text analysis tool with furigana display, word definitions, kanji breakdown, and machine translation. Runs entirely on your local machine with zero internet dependency.

## Features

- **Furigana Display**: Automatic hiragana readings above kanji characters
- **Word Definitions**: Click any word for English meanings, part of speech, and JLPT level (215k+ words from JMdict)
- **Kanji Breakdown**: Individual kanji information including readings, meanings, stroke count, and grade (13k+ kanji from KANJIDIC2)
- **Offline Translation**: Fully local Japanese-English translation using LiquidAI LFM2-350M model (no API keys required)
- **Text Formatting**: Preserves spaces and newlines in analyzed text
- **100% Offline**: All analysis, dictionaries, and translation run locally with zero latency
- **Cross-platform**: Works on Mac, Linux, and anywhere Docker runs

## Tech Stack

- **Backend**: FastAPI + SQLite + fugashi (MeCab wrapper)
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Dictionaries**: JMdict (215k+ words), KANJIDIC2 (13k+ kanji)
- **Translation**: llama.cpp with LFM2-350M-ENJP-MT model (GGUF, 219MB)
- **Deployment**: Docker Compose (3 services: backend, frontend, llamacpp)

## Quick Start

### Prerequisites

- Docker (with compose plugin)
- 2.5GB free disk space (dictionaries + database + translation model)
- 4GB RAM recommended (for translation model)
- Internet connection (only for initial setup)

### Installation

1. **Clone the repository and navigate to it**
   ```bash
   git clone <your-repo-url>
   cd japanese-text-analyzer
   ```

2. **Copy the environment file**
   ```bash
   cp .env.example .env
   ```

   Optional: Edit `.env` to configure translation method (defaults to offline llamacpp)

3. **Initialize the database** (one-time setup, ~5-10 minutes)
   ```bash
   docker compose run --rm backend python scripts/init_database.py
   ```

   This will:
   - Download JMdict and KANJIDIC2 dictionaries
   - Create and populate the SQLite database
   - Import ~215k words and ~13k kanji

4. **Download the translation model** (one-time setup, ~1 minute)
   ```bash
   python3 backend/scripts/download_translation_model.py
   ```

   This will download the LFM2-350M GGUF model (219MB) to `data/models/`.

   Alternatively, manually download from:
   https://huggingface.co/LiquidAI/LFM2-350M-ENJP-MT-GGUF/resolve/main/LFM2-350M-ENJP-MT-Q4_K_M.gguf

   And place it in: `data/models/LFM2-350M-ENJP-MT-Q4_K_M.gguf`

5. **Start the application**
   ```bash
   docker compose up -d
   ```

   This starts 3 services:
   - `backend`: FastAPI server (port 8000)
   - `frontend`: Nginx web server (port 3000)
   - `llamacpp`: Translation model server (port 8080)

6. **Access the application**
   - Frontend: http://localhost:3000
   - API Documentation: http://localhost:8000/docs

### First-Time Setup

The initialization scripts only need to be run once. All data is stored in the `data/` directory and persists between restarts.

### Stopping the Application

```bash
docker compose down
```

## Usage

1. Enter Japanese text in the input area
2. Click **Analyze** to see the text with furigana
3. Click any word to view definitions and meanings
4. Click any kanji in the definition popup to see detailed kanji information
5. Click **Translate** for full sentence translation (if configured)

## Configuration

### Translation Methods

Edit the `.env` file to configure your preferred translation method:

**Option 1: Offline Translation (default)** - Fully local, no API required
```
TRANSLATION_METHOD=llamacpp
```
Uses the LFM2-350M model running locally via llama.cpp. Requires model download (see Installation step 3).

**Option 2: DeepL API** - Online, high quality
```
TRANSLATION_METHOD=deepl
DEEPL_API_KEY=your-api-key-here
```
Get a free DeepL API key at: https://www.deepl.com/pro-api

**Option 3: No translation**
```
TRANSLATION_METHOD=none
```

After changing `.env`, restart the services:
```bash
docker compose down
docker compose up -d
```

### Performance Notes

- **Analysis**: Near-instant (MeCab tokenization)
- **Dictionary lookup**: < 50ms (SQLite indexed queries)
- **Translation (llamacpp)**: 2-5 seconds (CPU-based, depends on text length)
- **Translation (DeepL)**: 1-2 seconds (API call)

## Development

### Running Without Docker

#### Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python scripts/init_database.py

# Run server
uvicorn app.main:app --reload
```

Backend will be available at http://localhost:8000

#### Frontend

```bash
cd frontend

# Serve with Python
python3 -m http.server 3000
```

Frontend will be available at http://localhost:3000

## Deployment on Other Devices

This project is designed to be fully portable. To run on a different machine:

### Method 1: Transfer Everything (Recommended)

1. **Copy the entire project folder** to the new machine
2. **Ensure Docker and Docker Compose are installed**
3. **Start the application**:
   ```bash
   cd japanese-text-analyzer
   docker compose up -d
   ```

If you've already downloaded the dictionaries and model, they're in the `data/` directory and will work immediately on the new machine.

### Method 2: Fresh Installation

1. **Copy only the source code** (exclude `data/` directory)
2. **Run the initialization steps** on the new machine (see Quick Start)

### Docker Volumes

All data is stored in the `data/` directory and mounted as Docker volumes:
- `data/database/` - SQLite database (10MB)
- `data/dictionaries/` - Dictionary source files (35MB compressed)
- `data/models/` - Translation model (219MB)

You can backup or transfer just the `data/` folder to preserve all imported data across machines.

## Project Structure

```
japanese-text-analyzer/
├── backend/
│   ├── app/
│   │   ├── main.py                      # FastAPI application
│   │   ├── config.py                    # Configuration
│   │   ├── database.py                  # Database setup
│   │   ├── models.py                    # SQLAlchemy models
│   │   ├── schemas.py                   # Pydantic schemas
│   │   ├── api/
│   │   │   └── routes.py                # API endpoints
│   │   └── services/
│   │       ├── analyzer.py              # Text analysis (MeCab)
│   │       ├── dictionary.py            # Word lookup
│   │       ├── kanji.py                 # Kanji lookup
│   │       └── translator.py            # Translation (llamacpp/DeepL)
│   ├── scripts/
│   │   ├── init_database.py             # Database initialization
│   │   ├── import_jmdict.py             # JMdict import
│   │   ├── import_kanjidic.py           # KANJIDIC import
│   │   └── download_translation_model.py # Model download
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── index.html
│   ├── css/styles.css
│   ├── images/
│   │   └── logo.svg                     # Favicon
│   └── js/
│       ├── app.js                       # Main application
│       ├── api.js                       # API client
│       └── components/                  # UI components
│           ├── text-display.js          # Furigana rendering
│           ├── definition-popup.js      # Word definitions
│           └── kanji-details.js         # Kanji info modal
├── llamacpp/
│   └── Dockerfile                       # llama.cpp server config
├── data/
│   ├── dictionaries/                    # Downloaded dictionary files
│   ├── database/                        # SQLite database
│   └── models/                          # Translation model (GGUF)
├── docker-compose.yml                   # Multi-container orchestration
├── .env                                 # Configuration (translation method, API keys)
└── README.md
```

## API Endpoints

- `POST /api/analyze` - Analyze Japanese text
- `GET /api/word/{word}` - Get word definition
- `GET /api/kanji/{character}` - Get kanji information
- `POST /api/translate` - Translate text
- `GET /api/health` - Health check with database stats

Full API documentation: http://localhost:8000/docs

## Troubleshooting

### Database not initialized
```bash
docker compose run --rm backend python scripts/init_database.py
```

### Translation not working

**If using llamacpp**:
1. Verify model is downloaded:
   ```bash
   ls -lh data/models/LFM2-350M-ENJP-MT-Q4_K_M.gguf
   ```

2. Check llamacpp service is healthy:
   ```bash
   docker compose ps
   ```

3. Test llamacpp directly:
   ```bash
   curl http://localhost:8080/health
   ```

4. Check logs:
   ```bash
   docker compose logs llamacpp
   ```

**If using DeepL**:
- Verify API key is set in `.env`
- Check for API quota limits

### Backend cannot connect to database
Ensure the `data/database/` directory exists and has proper permissions:
```bash
mkdir -p data/database
chmod 755 data/database
```

### Frontend cannot connect to backend
1. Check all services are running: `docker compose ps`
2. Check backend health: `curl http://localhost:8000/api/health`
3. Check browser console for CORS errors

### Port already in use
Change ports in `docker-compose.yml`:
```yaml
ports:
  - "8001:8000"  # Backend
  - "3001:80"    # Frontend
  - "8081:8080"  # llamacpp
```

### Container won't start
Check logs for specific service:
```bash
docker compose logs backend
docker compose logs llamacpp
docker compose logs frontend
```

## Data Sources & Models

- **JMdict**: Japanese-English dictionary (215k+ entries) - [EDRDG](http://www.edrdg.org/jmdict/j_jmdict.html)
- **KANJIDIC2**: Kanji information (13k+ characters) - [EDRDG](http://www.edrdg.org/wiki/index.php/KANJIDIC_Project)
- **MeCab/UniDic**: Morphological analysis - [UniDic](https://unidic.ninjal.ac.jp/)
- **LFM2-350M**: Japanese-English translation model - [Liquid AI](https://huggingface.co/LiquidAI/LFM2-350M-ENJP-MT)
- **llama.cpp**: Efficient LLM inference - [ggml-org](https://github.com/ggml-org/llama.cpp)

## License

This project uses open-source components:
- Dictionary data (JMdict, KANJIDIC) is provided by the Electronic Dictionary Research and Development Group under CC BY-SA 4.0
- LFM2-350M model follows its respective license from Liquid AI
- Code is provided as-is for educational and personal use

## Credits

- Electronic Dictionary Research and Development Group (EDRDG) - JMdict and KANJIDIC2 dictionaries
- Liquid AI - LFM2-350M translation model
- ggml-org - llama.cpp inference engine
- MeCab Project - morphological analyzer
- fugashi - Python MeCab wrapper
- FastAPI - backend framework
