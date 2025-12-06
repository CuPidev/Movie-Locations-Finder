
import json
import urllib.request
from pathlib import Path
from typing import Dict, List, Any

# Simple print wrapper to avoid rich dependency if it's also missing, 
# though the original file had it. We'll use standard print for safety.
def rprint(msg):
    print(msg.replace("[blue]", "").replace("[/blue]", "")
             .replace("[green]", "").replace("[/green]", "")
             .replace("[yellow]", "").replace("[/yellow]", "")
             .replace("[red]", "").replace("[/red]", "")
             .replace("[bold green]", "").replace("[/bold green]", ""))

def crawlCinemapper(output_path: str = "./temp/cinemapper.json") -> bool:
    """
    Scraper for cinemapper.com using their public Firebase database.
    
    Args:
        output_path: Path to save the output JSON.
    
    Returns:
        True if successful, False otherwise.
    """
    firebase_url = "https://cinemapper-44cff-default-rtdb.europe-west1.firebasedatabase.app/.json"
    
    # Ensure output directory exists
    path = Path(output_path)
    if not path.parent.exists():
        rprint(f"[yellow]Creating directory {path.parent}[/yellow]")
        path.parent.mkdir(parents=True, exist_ok=True)

    rprint(f"[blue]Fetching data from {firebase_url}...[/blue]")
    try:
        with urllib.request.urlopen(firebase_url) as response:
            data = json.loads(response.read().decode())
    except Exception as e:
        rprint(f"[red]Failed to fetch data: {str(e)}[/red]")
        return False

    if 'app' not in data or 'filmingLocations' not in data['app']:
        rprint("[red]Invalid data structure: missing 'app' or 'filmingLocations'[/red]")
        return False

    raw_locations = data['app']['filmingLocations']
    raw_pages = data['app'].get('pages', {}) # Get pages data for URL lookups
    
    rprint(f"[green]Fetched {len(raw_locations)} locations and {len(raw_pages)} pages.[/green]")

    # Group by film
    films: Dict[str, Dict[str, Any]] = {}
    
    for loc_id, loc_data in raw_locations.items():
        film_name = loc_data.get('film', 'Unknown Film')
        # Handle case where film might be an ID or non-string (rare but possible)
        if not isinstance(film_name, str):
            film_name = str(film_name)

        film_id = str(loc_data.get('filmId')) if loc_data.get('filmId') else None
        
        if film_name not in films:
            # Construct deep link using slug from pages if available, else fallback to filmId
            movie_url = "https://cinemapper.com/browser"
            if film_id and film_id in raw_pages:
                slug = raw_pages[film_id].get('url')
                if slug:
                    movie_url = f"https://cinemapper.com/page/{slug}"
                else:
                    movie_url = f"https://cinemapper.com/page/id/{film_id}"
            elif film_id:
                 movie_url = f"https://cinemapper.com/page/id/{film_id}"
            
            films[film_name] = {
                "title": film_name,
                "url": movie_url,
                "text_content": "",
                "locations": []
            }
        
        # Format location text for text_content
        loc_name = loc_data.get('name', 'Unknown Location')
        loc_desc = loc_data.get('description', '')
        loc_lat = loc_data.get('position', {}).get('lat')
        loc_lng = loc_data.get('position', {}).get('lng')
        
        films[film_name]['locations'].append({
            "name": loc_name,
            "description": loc_desc,
            "latitude": loc_lat,
            "longitude": loc_lng,
            "address": loc_data.get('address'),
            "image": loc_data.get('picture')
        })
        
        # Append to text content for indexing potential
        films[film_name]['text_content'] += f"Location: {loc_name}\nDescription: {loc_desc}\nAddress: {loc_data.get('address', 'N/A')}\n\n"

    rprint(f"[green]Processed {len(films)} films.[/green]")

    # Write to file
    rprint(f"[blue]Writing results to {output_path}...[/blue]")
    try:
        with open(path, 'w', encoding='utf-8') as f:
            for film in films.values():
                f.write(json.dumps(film, ensure_ascii=False) + "\n")
        rprint(f"[bold green]Successfully saved data to {output_path}[/bold green]")
        return True
    except Exception as e:
        rprint(f"[red]Failed to write output file: {str(e)}[/red]")
        return False

if __name__ == "__main__":
    crawlCinemapper()
