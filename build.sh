#!/bin/bash

# Web Vibes Chrome Extension Build Script
# This script packages the extension for distribution

set -e  # Exit on any error

# Configuration
BUILD_DIR="dist"
EXTENSION_NAME="web-vibes-extension"

# Files and directories to include
INCLUDE_DIRS=(
    "manifest.json"
    "icons"
    "content"
    "lib"
    "service-worker"
    "sidepanel"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}$1${NC}"
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

log_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Get version from release notes or manifest
get_version() {
    if [ -d "release" ]; then
        # Look for latest release file
        latest_release=$(ls release/release-v*.md 2>/dev/null | sort -V | tail -1)
        if [ -n "$latest_release" ]; then
            version=$(echo "$latest_release" | sed 's/.*release-v\([0-9.]*\)\.md/\1/')
            if [ -n "$version" ]; then
                echo "$version"
                return
            fi
        fi
    fi
    
    # Fallback to manifest.json
    if [ -f "manifest.json" ]; then
        version=$(grep '"version"' manifest.json | sed 's/.*"version": *"\([^"]*\)".*/\1/')
        echo "$version"
    else
        echo "1.0.0"
    fi
}

# Clean build directory
clean_build() {
    log_info "Cleaning build directory..."
    rm -rf "$BUILD_DIR"
    mkdir -p "$BUILD_DIR"
    log_success "Build directory cleaned"
}

# Copy files to build directory
copy_files() {
    log_info "Copying extension files..."
    
    for item in "${INCLUDE_DIRS[@]}"; do
        if [ -e "$item" ]; then
            cp -r "$item" "$BUILD_DIR/"
            log_success "Copied $item"
        else
            log_warning "$item not found, skipping"
        fi
    done
}

# Update version in manifest
update_version() {
    local version=$(get_version)
    local manifest_path="$BUILD_DIR/manifest.json"
    
    if [ -f "$manifest_path" ]; then
        # Use sed to update version in manifest.json
        sed -i.bak "s/\"version\": *\"[^\"]*\"/\"version\": \"$version\"/" "$manifest_path"
        rm "$manifest_path.bak"
        log_success "Updated version to $version"
    else
        log_warning "manifest.json not found in build directory"
    fi
}

# Create ZIP package
create_zip() {
    local version=$(get_version)
    local zip_name="${EXTENSION_NAME}-v${version}.zip"
    local final_zip_path="bin/$zip_name"

    log_info "Creating ZIP package..."

    # Ensure bin directory exists
    mkdir -p bin

    # Remove existing zip if it exists
    [ -f "$final_zip_path" ] && rm "$final_zip_path"

    # Create zip from build directory
    cd "$BUILD_DIR"
    zip -r "$zip_name" . > /dev/null 2>&1

    # Move zip to bin directory
    mv "$zip_name" "../bin/"
    cd ..

    log_success "Created $final_zip_path"
    echo "$final_zip_path"
}

# Show completion message
show_completion() {
    local zip_name="$1"
    
    echo
    log_info "📋 Installation instructions are now in README.md"
    log_info "📦 Share $zip_name with users"
    log_info "🔗 Upload to GitHub Releases for easy distribution"
    echo
}

# Main build function
main() {
    log_info "🚀 Building Web Vibes Chrome Extension..."
    echo
    
    # Check if we're in the right directory
    if [ ! -f "manifest.json" ]; then
        log_error "manifest.json not found. Please run this script from the project root."
        exit 1
    fi
    
    # Check if zip is available
    if ! command -v zip &> /dev/null; then
        log_error "zip command not found. Please install zip utility."
        exit 1
    fi
    
    # Build process
    clean_build
    copy_files
    update_version
    zip_name=$(create_zip)
    show_completion "$zip_name"
    
    echo
    log_success "✅ Build complete!"
    log_info "📦 Package: $zip_name"
    echo
    log_info "Ready for distribution! 🎉"
}

# Run main function
main "$@"