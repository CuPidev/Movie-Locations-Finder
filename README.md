# Movie Locations Finder Search Engine (MLFSE)

## Repository Structure

- `src/`: Backend source code and API logic.
- `frontend/`: Frontend React application.
- `crawler/`: Scripts for scraping movie location data.
- `data/`: JSON files containing scraped data ready for indexing.
- `deployment/`: Deployment configurations and documentation.
- `index_data.py`: Script to index JSON data into Solr.
- `run_api.py`: Entry point to start the Flask API server, which serves the application.
- `docker-compose.yml`: Docker configuration for running Solr.



## Installation

### 1. Python Environment Setup
Create virtual enviornment for python and install python dependencies (or be a gigachad and do it globally)

```bash
pip install -r requirements.txt
```

### 2. Frontend Compilation

Go into the frontend dir

```bash
cd ./frontend
```

Install frontend dependencies

```bash
yarn install
```

Build the frontend

```bash
yarn build
```

### 3. Apache Solr Setup

This project uses Apache Solr for search functionality. To install Solr and create the `movies` core, follow one of the options below. Java 11+ is required to be installed.

**Option 1: Using Docker (Recommended)**

```bash
docker-compose up -d
```

**Option 2: Manual Installation**

[Download Solr](https://solr.apache.org/downloads.html), extract it, and run the following from the `bin` directory:

```bash
# Windows
.\solr.cmd start
.\solr.cmd create -c movies

# Linux/MacOS
./solr start
./solr create -c movies
```

**Option 3: Using Homebrew (MacOS)**

```bash
brew install solr
solr start
solr create -c movies
```


The Solr admin UI should now be available at `http://localhost:8983/solr/`.

### 4. Indexing Data

The repository already contains data that is ready to be indexed in the `data` directory. This data has been scraped from the following sources:

1. movie-locations.com.
2. TO BE ADDED
3. TO BE ADDED

Before running the indexer, make sure Solr is running. Then run:

```bash
python index_data.py
```

### 5. Scraping for New Data (Optional)

To get updated data, run the crawler using 

```bash
python ./crawler/crawler.py
```

after which new data will be available in the `temp` directory. Move the files from `temp` to `data` and run the indexer again.

### 6. Run the App

```bash
python run_api.py
```

The app will be available at 127.0.0.1:5000 by default

## VPS Deployment

The GitHub Actions workflow automatically sets up Solr, creates the `movies` core, and indexes data. See `deployment/DEPLOYMENT.md` for details.

## Troubleshooting

**No search results?**
```bash
curl "http://localhost:8983/solr/movies/select?q=*:*&rows=0"
```

**Solr not starting?**
- Ensure Java 11+ is installed: `java -version`
- Check port 8983 is available
