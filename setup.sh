#!/bin/bash
# ============================================================
#  Smart Campus Operations Hub — Environment Setup Script
#  Run this after cloning the repo to install all requirements
#  Usage: bash setup.sh
# ============================================================

# Don't use set -e — we handle errors manually for better messages

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo ""
    echo -e "${BLUE}============================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}============================================================${NC}"
    echo ""
}

print_success() { echo -e "  ${GREEN}✓${NC} $1"; }
print_warning() { echo -e "  ${YELLOW}!${NC} $1"; }
print_error()   { echo -e "  ${RED}✗${NC} $1"; }
print_info()    { echo -e "  ${BLUE}→${NC} $1"; }

MISSING_TOOLS=()

# ──────────────────────────────────────────────────────────────
#  1. Check Prerequisites
# ──────────────────────────────────────────────────────────────
print_header "Step 1/5 — Checking Prerequisites"

# Check Java 17+
if command -v java &> /dev/null; then
    JAVA_VER=$(java -version 2>&1 | head -1 | sed 's/.*"\(.*\)".*/\1/' | cut -d. -f1)
    if [ "$JAVA_VER" -ge 17 ] 2>/dev/null; then
        print_success "Java $JAVA_VER found"
    else
        print_error "Java 17+ required, found Java $JAVA_VER"
        MISSING_TOOLS+=("java")
    fi
else
    print_error "Java not found"
    MISSING_TOOLS+=("java")
fi

# Check Maven 3.9+
if command -v mvn &> /dev/null; then
    MVN_VER=$(mvn -version 2>&1 | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
    print_success "Maven $MVN_VER found"
else
    print_error "Maven not found"
    MISSING_TOOLS+=("maven")
fi

# Check Node.js 18+
if command -v node &> /dev/null; then
    NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_VER" -ge 18 ] 2>/dev/null; then
        print_success "Node.js $(node -v) found"
    else
        print_error "Node.js 18+ required, found Node $NODE_VER"
        MISSING_TOOLS+=("node")
    fi
else
    print_error "Node.js not found"
    MISSING_TOOLS+=("node")
fi

# Check npm
if command -v npm &> /dev/null; then
    print_success "npm $(npm -v) found"
else
    print_error "npm not found"
    MISSING_TOOLS+=("npm")
fi

# Check Git
if command -v git &> /dev/null; then
    print_success "Git $(git --version | cut -d' ' -f3) found"
else
    print_error "Git not found"
    MISSING_TOOLS+=("git")
fi

# If missing tools, show install instructions
if [ ${#MISSING_TOOLS[@]} -gt 0 ]; then
    echo ""
    print_header "Missing Tools — Install Instructions"

    for tool in "${MISSING_TOOLS[@]}"; do
        case $tool in
            java)
                echo -e "  ${YELLOW}Java 17 (OpenJDK):${NC}"
                echo "    Windows:  winget install Microsoft.OpenJDK.17"
                echo "    macOS:    brew install openjdk@17"
                echo "    Linux:    sudo apt install openjdk-17-jdk"
                echo "    Manual:   https://adoptium.net/temurin/releases/?version=17"
                echo ""
                ;;
            maven)
                echo -e "  ${YELLOW}Maven 3.9+:${NC}"
                echo "    Windows:  winget install Apache.Maven"
                echo "    macOS:    brew install maven"
                echo "    Linux:    sudo apt install maven"
                echo "    Manual:   https://maven.apache.org/download.cgi"
                echo ""
                ;;
            node)
                echo -e "  ${YELLOW}Node.js 18+ (LTS):${NC}"
                echo "    Windows:  winget install OpenJS.NodeJS.LTS"
                echo "    macOS:    brew install node@20"
                echo "    Linux:    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install nodejs"
                echo "    Manual:   https://nodejs.org/"
                echo ""
                ;;
            npm)
                echo "  npm comes with Node.js — install Node.js first"
                echo ""
                ;;
            git)
                echo -e "  ${YELLOW}Git:${NC}"
                echo "    Windows:  winget install Git.Git"
                echo "    macOS:    brew install git"
                echo "    Linux:    sudo apt install git"
                echo ""
                ;;
        esac
    done

    print_error "Please install the missing tools above, then re-run this script."
    echo ""
    exit 1
fi

print_success "All prerequisites installed!"

# ──────────────────────────────────────────────────────────────
#  2. Backend Setup
# ──────────────────────────────────────────────────────────────
print_header "Step 2/5 — Setting Up Backend (Spring Boot)"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

if [ ! -d "$BACKEND_DIR" ]; then
    print_error "backend/ directory not found. Make sure you're running from the repo root."
    exit 1
fi

cd "$BACKEND_DIR"

# Create uploads directory for file storage
mkdir -p uploads
print_success "Created uploads/ directory"

# Download all Maven dependencies and build
print_info "Downloading Maven dependencies (this may take a few minutes on first run)..."
mvn clean install -DskipTests -q
MVN_EXIT=$?
if [ $MVN_EXIT -eq 0 ]; then
    print_success "Backend built successfully"
else
    print_error "Backend build failed (exit code $MVN_EXIT)"
    exit 1
fi

# ──────────────────────────────────────────────────────────────
#  3. Frontend Setup
# ──────────────────────────────────────────────────────────────
print_header "Step 3/5 — Setting Up Frontend (React + Vite)"

if [ ! -d "$FRONTEND_DIR" ]; then
    print_error "frontend/ directory not found."
    exit 1
fi

cd "$FRONTEND_DIR"

print_info "Installing npm packages..."
npm install
NPM_EXIT=$?
if [ $NPM_EXIT -eq 0 ]; then
    print_success "Frontend dependencies installed"
else
    print_error "npm install failed (exit code $NPM_EXIT)"
    exit 1
fi

# ──────────────────────────────────────────────────────────────
#  4. Environment Configuration
# ──────────────────────────────────────────────────────────────
print_header "Step 4/5 — Environment Configuration"

print_success "MongoDB Atlas — pre-configured in application.yml (cloud database, no local install needed)"
print_success "JWT Secret — default dev key configured"
print_warning "Google OAuth — optional, requires Google Cloud credentials"
print_info "  To set up Google OAuth:"
print_info "  1. Go to https://console.cloud.google.com/"
print_info "  2. Create OAuth 2.0 Client ID"
print_info "  3. Set redirect URI: http://localhost:8080/login/oauth2/code/google"
print_info "  4. Set env vars: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
print_info "  (App works without OAuth — dev login available for testing)"

# ──────────────────────────────────────────────────────────────
#  5. Summary & Run Instructions
# ──────────────────────────────────────────────────────────────
print_header "Step 5/5 — Setup Complete!"

echo -e "  ${GREEN}Everything is ready to go!${NC}"
echo ""
echo -e "  ${BLUE}To run the backend:${NC}"
echo "    cd backend"
echo "    mvn spring-boot:run"
echo "    → API runs at: http://localhost:8080"
echo "    → Swagger UI:  http://localhost:8080/swagger-ui.html"
echo ""
echo -e "  ${BLUE}To run the frontend:${NC}"
echo "    cd frontend"
echo "    npm run dev"
echo "    → App runs at: http://localhost:5173"
echo ""
echo -e "  ${BLUE}To run tests:${NC}"
echo "    cd backend"
echo "    mvn test"
echo ""
echo -e "  ${YELLOW}Note:${NC} Start the backend first, then the frontend."
echo -e "  ${YELLOW}Note:${NC} Both must be running simultaneously for full functionality."
echo ""
echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}  Smart Campus Operations Hub — Happy coding!${NC}"
echo -e "${BLUE}============================================================${NC}"
echo ""
