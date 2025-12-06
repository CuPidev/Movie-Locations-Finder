# Movie locations finder Search Engine - MLFSE

## Quick start

-   Create virtual enviornment for python (or be a gigachad and do it globally)
-   Install python dependencies

```bash
pip install -r requirements.txt
```

-   Go into the frontend dir

```bash
cd ./frontend
```

-   Install frontend dependencies

```bash
yarn install
```

-   Build the frontend

```bash
yarn build
```

-   Scrape the date
```bash
python ./crawler/crawler.py
```

## Apache Solr Setup

This project uses Apache Solr for search functionality. The Solr core is named `movies`.

### Running Solr Locally

**Option 1: Using Docker (Recommended)**

```bash
docker-compose up -d
```

**Option 2: Manual Installation (Windows)**

```bash
# Set JAVA_HOME (Windows PowerShell)
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.11.9-hotspot"

# Start Solr
cd solr-9.10.0\bin
.\solr.cmd start

# Create the movies core (first time only)
.\solr.cmd create -c movies
```

**Option 3: Using Homebrew (MacOS)**

```bash
brew install solr
solr start
solr create -c movies
```

### Indexing Data

After Solr is running:

```bash
python index_data.py
```

### Solr Admin UI

`http://localhost:8983/solr/`

### VPS Deployment

The GitHub Actions workflow automatically sets up Solr, creates the `movies` core, and indexes data. See `deployment/DEPLOYMENT.md` for details.

-   Run the API

```bash
cd ..
python run_api.py
```

The app will be available at 127.0.0.1:5000 by default

## Structure

Sample movie location data in movie_locations.json \
Crawler for movie locations com in ./crawler dir


### Troubleshooting

**No search results?**
```bash
curl "http://localhost:8983/solr/movies/select?q=*:*&rows=0"
```

**Solr not starting?**
- Ensure Java 11+ is installed: `java -version`
- Check port 8983 is available
