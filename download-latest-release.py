#!/usr/bin/env python3
"""Download the latest release binaries from GitHub."""

import urllib.request
import json
import os
import sys

REPO = "cms000123456/penpal"
API_URL = f"https://api.github.com/repos/{REPO}/releases/latest"

def get_latest_release():
    """Get latest release info from GitHub API."""
    try:
        with urllib.request.urlopen(API_URL) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"Error fetching release info: {e}")
        return None

def download_asset(url, filename, output_dir="downloads"):
    """Download a release asset."""
    os.makedirs(output_dir, exist_ok=True)
    filepath = os.path.join(output_dir, filename)
    
    print(f"Downloading {filename}...")
    try:
        urllib.request.urlretrieve(url, filepath)
        print(f"  ✓ Saved to {filepath}")
        return filepath
    except Exception as e:
        print(f"  ✗ Failed: {e}")
        return None

def main():
    print("=" * 50)
    print("  PenPal Draw - Release Downloader")
    print("=" * 50)
    print()
    
    release = get_latest_release()
    if not release:
        print("Failed to get release info. Make sure you have internet connection.")
        print()
        print("Or download manually from:")
        print(f"  https://github.com/{REPO}/releases")
        input("\nPress Enter to exit...")
        return
    
    tag = release['tag_name']
    print(f"Latest release: {tag}")
    print(f"Published: {release['published_at']}")
    print()
    
    assets = release.get('assets', [])
    if not assets:
        print("No assets found in this release yet.")
        print("The build might still be in progress.")
        print()
        print("Check build status at:")
        print(f"  https://github.com/{REPO}/actions")
        input("\nPress Enter to exit...")
        return
    
    # Group assets by platform
    platforms = {
        'Windows': [],
        'macOS': [],
        'Linux': [],
        'Web': []
    }
    
    for asset in assets:
        name = asset['name']
        url = asset['browser_download_url']
        
        if '.exe' in name or '.msi' in name:
            platforms['Windows'].append((name, url))
        elif '.dmg' in name:
            platforms['macOS'].append((name, url))
        elif '.deb' in name or '.AppImage' in name:
            platforms['Linux'].append((name, url))
        elif 'web' in name.lower():
            platforms['Web'].append((name, url))
    
    # Show available platforms
    print("Available downloads:")
    print()
    
    available = []
    for platform, files in platforms.items():
        if files:
            print(f"\n{platform}:")
            for i, (name, url) in enumerate(files, 1):
                print(f"  {len(available) + i}. {name}")
            available.extend(files)
    
    if not available:
        print("No downloadable assets found.")
        input("\nPress Enter to exit...")
        return
    
    print()
    print("Options:")
    print("  a - Download all")
    print("  q - Quit")
    print()
    
    choice = input("Enter number to download (or 'a' for all): ").strip().lower()
    
    if choice == 'q':
        return
    
    if choice == 'a':
        to_download = available
    else:
        try:
            idx = int(choice) - 1
            if 0 <= idx < len(available):
                to_download = [available[idx]]
            else:
                print("Invalid selection.")
                return
        except ValueError:
            print("Invalid input.")
            return
    
    print()
    print("=" * 50)
    print("Downloading...")
    print("=" * 50)
    print()
    
    downloaded = []
    for name, url in to_download:
        path = download_asset(url, name)
        if path:
            downloaded.append(path)
    
    print()
    print("=" * 50)
    if downloaded:
        print(f"Downloaded {len(downloaded)} file(s) to 'downloads/' folder")
        print()
        print("Files:")
        for path in downloaded:
            print(f"  - {path}")
    else:
        print("No files were downloaded.")
    print("=" * 50)
    
    input("\nPress Enter to exit...")

if __name__ == '__main__':
    main()
