# Release Guide

This project uses GitHub Actions to automatically build and release the app for Windows, macOS, and Linux.

## Creating a Release

### Option 1: Automatic Release (Recommended)

Simply push a tag starting with `v`:

```bash
# Update version in package.json and Cargo.toml first
# Then tag and push
git tag v0.2.0
git push origin v0.2.0
```

GitHub Actions will automatically:
1. Build for all platforms (Windows, macOS Intel, macOS Apple Silicon, Linux)
2. Create a draft release
3. Upload all installer files
4. Include release notes

### Option 2: Manual Release Trigger

Go to **Actions** → **Release** → **Run workflow** in the GitHub UI.

## Release Artifacts

After the build completes, the following files will be attached to the release:

### Windows
- `PenPal Draw_<version>_x64-setup.exe` - NSIS installer
- `PenPal Draw_<version>_x64_en-US.msi` - MSI installer

### macOS
- `PenPal Draw_<version>_x64.dmg` - Intel Macs
- `PenPal Draw_<version>_aarch64.dmg` - Apple Silicon Macs (M1/M2/M3)

### Linux
- `penpal-draw_<version>_amd64.deb` - Debian/Ubuntu package
- `PenPal Draw_<version>_amd64.AppImage` - Universal portable

### Web
- `penpal-draw-web.zip` - Web version for browser testing

## Publishing the Release

1. Go to **Releases** in your GitHub repository
2. Find the draft release created by the workflow
3. Review the release notes and assets
4. Click **Publish release**

## Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- `v0.2.0` - Major.Minor.Patch
- Major: Breaking changes
- Minor: New features
- Patch: Bug fixes

## Pre-release Versions

For beta/alpha releases, use a suffix:
```bash
git tag v0.3.0-beta.1
git push origin v0.3.0-beta.1
```

Then mark the release as "Pre-release" in GitHub.

## Troubleshooting Failed Builds

### Windows Build Fails
- Usually due to missing Visual Studio Build Tools
- GitHub Actions runners have these pre-installed

### macOS Build Fails  
- May need to update macOS SDK settings
- Apple Silicon builds require macOS 11+

### Linux Build Fails
- Usually missing system dependencies
- The workflow installs: `libgtk-3-dev`, `libwebkit2gtk-4.0-dev`, etc.

## Code Signing (Optional)

For production releases, you should set up code signing:

### Windows
Add to repository secrets:
- `WINDOWS_CERTIFICATE` - Base64 encoded PFX certificate
- `WINDOWS_CERTIFICATE_PASSWORD` - Certificate password

### macOS
Add to repository secrets:
- `APPLE_CERTIFICATE` - Base64 encoded certificate
- `APPLE_CERTIFICATE_PASSWORD` - Certificate password  
- `APPLE_SIGNING_IDENTITY` - Signing identity
- `APPLE_ID` - Apple ID for notarization
- `APPLE_PASSWORD` - App-specific password

See [Tauri Code Signing](https://tauri.app/v1/guides/distribution/sign-windows/) for details.
