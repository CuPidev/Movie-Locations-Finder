# crawler for https://moviefilminglocations.ca
import json
import re
from pathlib import Path
from typing import Set

import requests
from bs4 import BeautifulSoup
from rich import print as rprint


def extract_titlemarkers(html):
    """
    Extracts the titlemarkers JS object from HTML as a Python dict.
    """
    pattern = r"const\s+titlemarkers\s*=\s*(\{.*?\});"
    match = re.search(pattern, html, re.DOTALL)
    if not match:
        return None
    js_object = match.group(1)
    # Convert JS object to JSON: add quotes to keys, fix trailing commas
    js_object_clean = re.sub(r"(\w+):", r'"\1":', js_object)
    js_object_clean = re.sub(r",\s*}", "}", js_object_clean)
    try:
        return json.loads(js_object_clean)
    except Exception:
        return None


def crawlMovieLocationsCA(
    output_path: str = "../data/moviefilminglocationsca.json",
) -> bool:
    base_url = "https://moviefilminglocations.ca"
    # menu works by appending the page number to all, like /all/2, /all/3, etc.
    menu_url = f"{base_url}/all"
    known_menu_pages = 135 + 1
    title_url = f"{base_url}/title/"
    rprint(f"[blue]Starting crawl for {title_url}[/blue]")
    # output_path = Path("movie_locations_ca.csv")
    # seen_urls: Set[str] = set()
    # data_rows: Dict[str, Dict[str, str]] = {}
    seen = load_seen_urls(output_path)
    for i in range(1, known_menu_pages):
        print(i)
        response = requests.get(menu_url + f"/{i}")
        if response.status_code != 200:
            rprint(f"[red]Failed to fetch menu page {i}: {menu_url}[/red]")
            return False

        menu_page_soup = BeautifulSoup(response.text, "html.parser")

        page_items = menu_page_soup.find_all("div", class_="fulltitle")

        movies = []

        for item in page_items:
            title_div = item.find("div", class_="titleright")
            img = item.find("img")
            item_title = (
                title_div.find("h2").get_text(strip=True) if title_div else None
            )
            img_src = img["src"] if img else None
            item_id_match = re.search(r"tt(\d+)", img_src)
            if item_id_match:
                item_id = item_id_match.group(1)

            item_absolute_link = title_url + item_id
            if item_absolute_link in seen:
                rprint(
                    f"[yellow]Skipping already seen URL: {item_absolute_link}[/yellow]"
                )
                continue
            rprint("[blue]----------------------------------------[/blue]")
            print(f"Title: {item_title}, Link: {item_absolute_link}")

            movie = {
                "title": item_title,
                "url": item_absolute_link,
                "text_content": "",
                "locations": [],
            }

            item_page_response = requests.get(item_absolute_link)
            if item_page_response.status_code != 200:
                rprint(f"[red]Failed to fetch item page: {item_absolute_link}[/red]")
                continue

            item_soup = BeautifulSoup(item_page_response.text, "html.parser")
            rprint(f"[green]Fetched item page for {item_title}[/green]")
            # rprint(item_soup.prettify())
            json_result = extract_titlemarkers(item_soup.prettify())
            # if item_id == "6436726":
            #     rprint(item_soup.prettify())
            #     rprint("[cyan]Tu powinna być soupka[/cyan]")

            try:
                locations = json_result[item_id]
                if not locations:
                    locations = json_result[item_title]
            except Exception:
                rprint(f"[red]No location data found for {item_title}. Skipping[/red]")
                continue
                locations = None
            for location in locations if locations else []:
                # location list: [title, adress, lat, lon, desc]
                # rprint(f"[cyan]Location data: {str(location)}[/cyan]")
                print(location[0], location[1], location[2], location[3])
                location_dict = {
                    "name": location[0],
                    "address": location[1],
                    "latitude": location[2],
                    "longitude": location[3],
                    "description": location[4],
                }
                movie["locations"].append(location_dict)
                movie["text_content"] += (
                    f"Location: {location_dict['name']}\nDescription: {location_dict['description']}\nAddress: {location_dict['address']}\n\n"
                )

            # location_divs = item_soup.find_all("div", class_="feature-item")
            # for loc_div in location_divs:
            #     loc_name = loc_div.find("h3").get_text(strip=True)
            #     loc_address = loc_div.find("p").get_text(strip=True)
            #     rprint(f"[green]Location: {loc_name}, Address: {loc_address}[/green]")
            #     if loc_name != loc_address:
            #         rprint(f"[yellow]Address differs from name: {loc_address}[/yellow]")
            #     movie["locations"].append(location_dict)
            #     movie["text_content"] += (
            #         f"Location: {loc_name}\nDescription: {location_dict['description']}\nAddress: {loc_address}\n\n"
            #     )

            rprint(f"[blue]Writing results to {output_path}...[/blue]")
            try:
                with open(output_path, "a", encoding="utf-8") as f:
                    f.write(json.dumps(movie, ensure_ascii=False) + "\n")
                    f.flush()
                rprint(
                    f"[bold green]Successfully saved data to {output_path}[/bold green]"
                )
            except Exception as e:
                rprint(f"[red]Failed to write output file: {str(e)}[/red]")

        # print(loc_div)

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


async def testCA() -> None:
    rprint("This is a test function in movielocationsca.py")
    this_file = Path(__file__).resolve()
    print(f"Current file path: {this_file}")


if __name__ == "__main__":
    crawlMovieLocationsCA()
    crawlMovieLocationsCA()
    crawlMovieLocationsCA()
