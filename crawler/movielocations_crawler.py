import json
import re
import time
from pathlib import Path
from typing import Dict, Optional, Set, Tuple

import requests
from bs4 import BeautifulSoup
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
from rich import print as rprint

# Initialize geocoder with a custom user agent (required by Nominatim)
_geocoder = Nominatim(user_agent="movie-locations-finder-crawler/1.0")

# Cache for geocoding results to avoid repeated API calls
_geocode_cache: Dict[str, Optional[Tuple[float, float, str]]] = {}


def geocode_location(location_name: str) -> Optional[Tuple[float, float, str]]:
    """Geocode a location name using OpenStreetMap Nominatim.
    
    Args:
        location_name: The name of the location to geocode.
        
    Returns:
        A tuple of (latitude, longitude, resolved_address) if found, None otherwise.
        The resolved_address is the full address returned by the geocoding service.
    """
    # Check cache first
    if location_name in _geocode_cache:
        return _geocode_cache[location_name]
    
    try:
        # Rate limit: 1 request per second (Nominatim policy)
        time.sleep(1.0)
        
        location = _geocoder.geocode(location_name, timeout=10)
        
        if location:
            result = (location.latitude, location.longitude, location.address)
            _geocode_cache[location_name] = result
            return result
        else:
            _geocode_cache[location_name] = None
            return None
            
    except (GeocoderTimedOut, GeocoderServiceError) as e:
        rprint(f"[yellow]Geocoding error for '{location_name}': {e}[/yellow]")
        _geocode_cache[location_name] = None
        return None

"""
This crawler is specifically adjusted to scrape the data from movie-locations.com.

What is important is the strucurte of the site.
It is hardcoded for now but we can extract it later on so it is more readable and easier to change but we probably won't care and need that.
Basically the site is divided by the first number/letter of the movie title.
It goes from 0-9 to Z.
Example: https://movie-locations.com/0/0-movies.php - This is the page for all movies starting with a number.
https://movie-locations.com/A/A-movies.php - This is the page for all movies starting with the letter A.
and it goes on like that until Z.

Then the movie pages are their own php pages with the movie title as the name in the category that they are in.
Example: Movie Tenet since it starts with T is in the T category so its page is:
https://movie-locations.com/movies/t/Tenet-film-locations.php
"""

# TODO: Could benefit from adding separate functions for different pages and better logging instead of just printing.


def crawlMovieLocationsCom(
    save_to_db: bool = False, 
    output: str = "./temp/movie_locations.json",
    max_pages: Optional[int] = None
) -> bool:
    """Crawler for movie-locations.com.

    Args:
        save_to_db: If True, use a provided database connection to save results. For now we are doing it raw dog style with files.
        output: Path to a CSV file where results would be written. Default
            is ``movie_locations.csv``.
        max_pages: Maximum number of movie pages to crawl. If None, crawl all.

    Returns:
        True if the crawl completed successfully and the page parsed;
        False if the main page could not be fetched or parsed.
    """

    scrape_url_base: str = "https://movie-locations.com/"
    scrape_movies_url: str = "https://movie-locations.com/movies/"

    # Ensure output directory exists from the very start
    output_path = Path(output)
    if not output_path.parent.exists():
        rprint(f"[yellow]Creating directory {output_path.parent}[/yellow]")
        output_path.parent.mkdir(parents=True, exist_ok=True)

    rprint(f"[blue]Initializing crawl for {scrape_url_base}[/blue]")

    rprint("[yellow]Loading seen URLs...[/yellow]")
    seen = load_seen_urls(output)
    rprint(f"[green]Loaded {len(seen)} seen URLs.[/green]")

    response = requests.get(scrape_url_base)
    response.encoding = 'utf-8'
    soup = BeautifulSoup(response.text, "html.parser")

    content_container = soup.find("div", class_="content")
    if not content_container:
        rprint(f"[red]Failed to find content container in {scrape_url_base}[/red]")
        return False
    else:
        rprint(
            "[green]Fetched main page successfully. Commencing with the crawl...[/green]"
        )

    menu_container = content_container.find_all("p")[1]

    rprint(f"[blue]Menu container found: {menu_container is not None}[/blue]")

    category_links = [
        scrape_url_base + link.get("href") for link in menu_container.find_all("a")
    ]

    if category_links is None or len(category_links) == 0:
        rprint("[red]No category links found in menu container.[/red]")
        return False

    print(
        f"Found {len(category_links)} category links. Starting the crawl of each category..."
    )

    pages_crawled = []

    for category_link in category_links:
        # print(f"Crawing category page: {category_link}")
        category_name = category_link.split("/")[-1].split("-")[0]
        # print(category_name)

        category_response = requests.get(category_link)
        category_response.encoding = 'utf-8'
        category_soup = BeautifulSoup(category_response.text, "html.parser")

        category_menu = category_soup.find("div", id="multicolumn3")

        for category_item in category_menu.find_all("p"):  # type: ignore
            if category_item.find("a"):
                movie_link = (
                    scrape_movies_url
                    + f"{category_name}/"
                    + category_item.find("a").get("href")  # type: ignore
                )

                # Skip if we've already seen this movie URL
                if movie_link in seen:
                    rprint(
                        f"[yellow]Already crawled: {movie_link} - skipping.[/yellow]"
                    )
                    continue

                rprint(f"[bold green]Movie link found: {movie_link}[/bold green]")
                rprint(
                    f"[bold green]Starting to crawl {movie_link} page...[/bold green]"
                )
                movie_response = requests.get(movie_link)
                movie_response.encoding = 'utf-8'
                movie_soup = BeautifulSoup(movie_response.text, "html.parser")

                movie_content = movie_soup.find("div", class_="content")
                if not movie_content:
                    rprint(f"[red]Failed to find movie content in {movie_link}[/red]")
                    continue

                # Try to find the movie poster image (usually has 'poster' in alt text)
                movie_image = None
                for img in movie_content.find_all("img"):
                    alt_text = img.get("alt", "").lower()
                    if "poster" in alt_text:
                        img_src = img.get("src")
                        if img_src:
                            # Convert relative path to full URL
                            if img_src.startswith("http"):
                                movie_image = img_src
                            else:
                                # Build full URL from relative path
                                movie_image = f"{scrape_movies_url}{category_name}/{img_src}"
                        break

                page_object = {
                    "url": movie_link,
                    "title": "",
                    "image": movie_image,
                    "text_content": "",
                    "locations": [],
                }

                title_and_year_container = movie_content.find("h1")
                if not title_and_year_container:
                    rprint(
                        f"[red]Failed to find title and year container in {movie_link}[/red]"
                    )
                    continue

                # For now the title is both the title and the year together in "title | year" format
                title = title_and_year_container.get_text()
                # If we want to have the year we can extract it later
                # year = title_and_year_container.find("span").text
                page_object["title"] = title

                # Extract locations from the page
                # movie-locations.com marks location names with <span class="name"> tags
                # Use a dict to deduplicate locations by name and collect descriptions
                text_content_parts = []
                locations_dict: Dict[str, Dict] = {}
                
                for p in movie_content.find_all("p"):
                    p_text = p.get_text(strip=True)
                    text_content_parts.append(p_text)

                    # Look for location names in <span class="name"> tags
                    name_spans = p.find_all("span", class_="name")
                    if not name_spans:
                        continue

                    # Process each location name individually to avoid duplicates
                    for span in name_spans:
                        location_name = span.get_text(strip=True)
                        if not location_name:
                            continue
                        
                        if location_name in locations_dict:
                            # Add description to existing location if not already present
                            if p_text not in locations_dict[location_name]["descriptions"]:
                                locations_dict[location_name]["descriptions"].append(p_text)
                        else:
                            # Create new location entry
                            locations_dict[location_name] = {
                                "name": location_name,
                                "descriptions": [p_text],
                            }
                            rprint(f"[cyan]Found location: {location_name}[/cyan]")
                
                # Convert locations_dict to list, geocoding each to validate and get coordinates
                # Locations that fail geocoding (like person names) are filtered out

                # WARN: This takes a LONG time to run.
                # rprint(f"[cyan]Geocoding {len(locations_dict)} potential locations...[/cyan]")
                # for loc_data in locations_dict.values():
                #     coords = geocode_location(loc_data["name"])
                #     if coords:
                #         page_object["locations"].append({
                #             "name": loc_data["name"],
                #             "address": coords[2],  # Resolved address from geocoding
                #             "latitude": coords[0],
                #             "longitude": coords[1],
                #             "descriptions": loc_data["descriptions"],
                #         })
                #         rprint(f"[green]✓ Geocoded: {loc_data['name']} → {coords[2][:60]}...[/green]")
                #     else:
                #         rprint(f"[dim]✗ Filtered out (not a place): {loc_data['name']}[/dim]")

                page_object["text_content"] = "\n".join(text_content_parts)
                append_record(output, page_object)
                pages_crawled.append(page_object)
                rprint(f"[bold green]Crawled movie page: {title}[/bold green]")
                
                # Check if we've reached the max_pages limit
                if max_pages is not None and len(pages_crawled) >= max_pages:
                    rprint(f"[yellow]Reached max_pages limit ({max_pages}). Stopping crawl.[/yellow]")
                    break
            else:
                rprint("[red]No movie link sorry bud.[/red]")
                rprint(f"[red]No link movie title: {category_item.text}[/red]")
                rprint(
                    "[red]If we want to also have empty movie pages, we can change the code here[/red]"
                )
        
        # Also check at the category level to break out of outer loop
        if max_pages is not None and len(pages_crawled) >= max_pages:
            break

    return True


def load_seen_urls(output_path: str) -> Set[str]:
    """
    Load seen URLs from the existing output file to avoid re-crawling.
    Returns a set of URLs.
    Uses every line as a JSON object.
    """
    seen = set()
    p = Path(output_path)
    if not p.exists():
        return seen
    with p.open("r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                if "url" in obj:
                    seen.add(obj["url"])
            except json.JSONDecodeError:
                continue
    return seen


def append_record(output_path: str, record: Dict) -> None:
    """
    Append a single JSON object of the crawled page to the output file.
    Void function.
    """
    with open(output_path, "a", encoding="utf-8") as fh:
        fh.write(json.dumps(record, ensure_ascii=False) + "\n")
        fh.flush()


if __name__ == "__main__":
    crawlMovieLocationsCom()
