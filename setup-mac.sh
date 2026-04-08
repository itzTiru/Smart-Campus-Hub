#!/bin/bash
# ============================================================
#  Smart Campus Operations Hub — macOS Setup Script
#  Tested on: macOS Sequoia 15.6.1
#  Usage: bash setup-mac.sh
# ============================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# ──────────────────────────────────────────────────────────────
#  1. Install Homebrew (if missing)
# ──────────────────────────────────────────────────────────────
print_header "Step 1/6 — Checking Homebrew"

if command -v brew &> /dev/null; then
    print_success "Homebrew found: $(brew --version | head -1)"
else
    print_info "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Add Homebrew to PATH for Apple Silicon Macs
    if [[ $(uname -m) == "arm64" ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi

    if command -v brew &> /dev/null; then
        print_success "Homebrew installed"
    else
        print_error "Homebrew installation failed. Install manually: https://brew.sh"
        exit 1
    fi
fi

# ──────────────────────────────────────────────────────────────
#  2. Install Prerequisites
# ──────────────────────────────────────────────────────────────
print_header "Step 2/6 — Installing Prerequisites"

# Java 17
if command -v java &> /dev/null; then
    JAVA_VER=$(java -version 2>&1 | head -1 | sed 's/.*"\(.*\)".*/\1/' | cut -d. -f1)
    if [ "$JAVA_VER" -eq 17 ] 2>/dev/null; then
        print_success "Java 17 found"
    else
        print_warning "Java $JAVA_VER found — need Java 17 (not $JAVA_VER)"
        print_info "Installing OpenJDK 17..."
        brew install openjdk@17
        sudo ln -sfn $(brew --prefix openjdk@17)/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk
        print_success "OpenJDK 17 installed"
    fi
else
    print_info "Installing OpenJDK 17..."
    brew install openjdk@17
    sudo ln -sfn $(brew --prefix openjdk@17)/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk
    print_success "OpenJDK 17 installed"
fi

# Set JAVA_HOME
JAVA_17_HOME=$(/usr/libexec/java_home -v 17 2>/dev/null)
if [ -n "$JAVA_17_HOME" ]; then
    export JAVA_HOME="$JAVA_17_HOME"
    print_success "JAVA_HOME set to $JAVA_HOME"

    # Make it permanent
    SHELL_RC="$HOME/.zshrc"
    if ! grep -q "JAVA_HOME.*java_home.*17" "$SHELL_RC" 2>/dev/null; then
        echo '' >> "$SHELL_RC"
        echo '# Java 17 for Smart Campus Hub' >> "$SHELL_RC"
        echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> "$SHELL_RC"
        echo 'export PATH="$JAVA_HOME/bin:$PATH"' >> "$SHELL_RC"
        print_success "JAVA_HOME added to ~/.zshrc permanently"
    fi
else
    print_error "Could not find Java 17. Try: brew install openjdk@17"
    exit 1
fi

# Maven
if command -v mvn &> /dev/null; then
    MVN_VER=$(mvn -version 2>&1 | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
    print_success "Maven $MVN_VER found"
else
    print_info "Installing Maven..."
    brew install maven
    print_success "Maven installed"
fi

# Node.js
if command -v node &> /dev/null; then
    NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_VER" -ge 18 ] 2>/dev/null; then
        print_success "Node.js $(node -v) found"
    else
        print_warning "Node.js $NODE_VER found — need 18+"
        print_info "Installing Node.js LTS..."
        brew install node@20
        print_success "Node.js installed"
    fi
else
    print_info "Installing Node.js LTS..."
    brew install node@20
    print_success "Node.js installed"
fi

# npm
if command -v npm &> /dev/null; then
    print_success "npm $(npm -v) found"
else
    print_error "npm not found — should come with Node.js"
    exit 1
fi

# Git
if command -v git &> /dev/null; then
    print_success "Git $(git --version | cut -d' ' -f3) found"
else
    print_info "Installing Git..."
    brew install git
    print_success "Git installed"
fi

# ──────────────────────────────────────────────────────────────
#  3. Verify all tools
# ──────────────────────────────────────────────────────────────
print_header "Step 3/6 — Verifying Installation"

echo -e "  Java:  $(java -version 2>&1 | head -1)"
echo -e "  Maven: $(mvn -version 2>&1 | head -1)"
echo -e "  Node:  $(node -v)"
echo -e "  npm:   $(npm -v)"
echo -e "  Git:   $(git --version)"

# ──────────────────────────────────────────────────────────────
#  4. Backend Setup
# ──────────────────────────────────────────────────────────────
print_header "Step 4/6 — Setting Up Backend (Spring Boot)"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

if [ ! -d "$BACKEND_DIR" ]; then
    print_error "backend/ directory not found. Run this from the repo root."
    exit 1
fi

cd "$BACKEND_DIR"

mkdir -p uploads
print_success "Created uploads/ directory"

print_info "Downloading Maven dependencies (this may take a few minutes)..."
mvn clean install -DskipTests -q
MVN_EXIT=$?
if [ $MVN_EXIT -eq 0 ]; then
    print_success "Backend built successfully"
else
    print_error "Backend build failed (exit code $MVN_EXIT)"
    echo ""
    print_info "Common fixes:"
    print_info "  1. Make sure JAVA_HOME points to Java 17: echo \$JAVA_HOME"
    print_info "  2. Try: export JAVA_HOME=\$(/usr/libexec/java_home -v 17)"
    print_info "  3. Then re-run: bash setup-mac.sh"
    exit 1
fi

# ──────────────────────────────────────────────────────────────
#  5. Frontend Setup
# ──────────────────────────────────────────────────────────────
print_header "Step 5/6 — Setting Up Frontend (React + Vite)"

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
#  6. Done
# ──────────────────────────────────────────────────────────────
print_header "Step 6/6 — Setup Complete!"

echo -e "  ${GREEN}Everything is ready to go!${NC}"
echo ""
echo -e "  ${BLUE}To run the backend (Terminal 1):${NC}"
echo "    cd backend"
echo "    mvn spring-boot:run"
echo "    → API runs at: http://localhost:8080"
echo "    → Swagger UI:  http://localhost:8080/swagger-ui.html"
echo ""
echo -e "  ${BLUE}To run the frontend (Terminal 2):${NC}"
echo "    cd frontend"
echo "    npm run dev"
echo "    → App runs at: http://localhost:5173"
echo ""
echo -e "  ${BLUE}To run tests:${NC}"
echo "    cd backend"
echo "    mvn test"
echo ""
echo -e "  ${YELLOW}Note:${NC} Start backend first, then frontend in a separate terminal."
echo -e "  ${YELLOW}Note:${NC} Both must be running simultaneously."
echo ""
echo -e "  ${YELLOW}If JAVA_HOME issues persist, run:${NC}"
echo "    export JAVA_HOME=\$(/usr/libexec/java_home -v 17)"
echo ""
echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}  Smart Campus Operations Hub — Happy coding!${NC}"
echo -e "${BLUE}============================================================${NC}"
echo ""
