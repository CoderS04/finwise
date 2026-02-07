"""
Interactive Terminal Chatbot Tester

Test Finwise AI chatbot without frontend.
Requires: Backend running, Ollama running, valid JWT token
"""

import requests
import json
from datetime import datetime, timedelta
from typing import Optional

# Configuration
BACKEND_URL = "http://localhost:8000"
OLLAMA_URL = "http://localhost:11434"

# Color codes for terminal output
class Colors:
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    END = '\033[0m'
    BOLD = '\033[1m'


def check_services() -> tuple[bool, bool]:
    """Check if backend and Ollama are running."""
    backend_ok = False
    ollama_ok = False

    try:
        resp = requests.get(f"{BACKEND_URL}/health", timeout=2)
        backend_ok = resp.status_code == 200
    except:
        pass

    try:
        resp = requests.get(f"{OLLAMA_URL}/api/tags", timeout=2)
        ollama_ok = resp.status_code == 200
    except:
        pass

    return backend_ok, ollama_ok


def login(username: str, password: str) -> Optional[str]:
    """Login and get JWT token."""
    try:
        response = requests.post(
            f"{BACKEND_URL}/auth/login",
            json={"email": username, "password": password},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        else:
            print(f"{Colors.RED}Login failed: {response.json()}{Colors.END}")
            return None
    except Exception as e:
        print(f"{Colors.RED}Login error: {e}{Colors.END}")
        return None


def send_message(token: str, message: str) -> Optional[dict]:
    """Send message to chatbot."""
    try:
        response = requests.post(
            f"{BACKEND_URL}/chat/",
            json={"user_message": message},
            headers={"Authorization": f"Bearer {token}"},
            timeout=15
        )
        if response.status_code == 200:
            return response.json()
        else:
            print(f"{Colors.RED}Error: {response.status_code} - {response.json()}{Colors.END}")
            return None
    except requests.exceptions.Timeout:
        print(f"{Colors.YELLOW}⏱️  Response timeout (Ollama may be processing){Colors.END}")
        return None
    except Exception as e:
        print(f"{Colors.RED}Error: {e}{Colors.END}")
        return None


def print_welcome():
    """Print welcome message."""
    print(f"\n{Colors.BOLD}{Colors.CYAN}")
    print("╔════════════════════════════════════════╗")
    print("║   Finwise AI Chatbot - Terminal Test   ║")
    print("╚════════════════════════════════════════╝")
    print(f"{Colors.END}\n")


def print_status(backend_ok: bool, ollama_ok: bool):
    """Print service status."""
    backend_status = f"{Colors.GREEN}✓ Running{Colors.END}" if backend_ok else f"{Colors.RED}✗ Offline{Colors.END}"
    ollama_status = f"{Colors.GREEN}✓ Running{Colors.END}" if ollama_ok else f"{Colors.RED}✗ Offline{Colors.END}"

    print(f"Backend: {backend_status}")
    print(f"Ollama:  {ollama_status}")

    if not backend_ok or not ollama_ok:
        print(f"\n{Colors.YELLOW}⚠️  Required services are not running!{Colors.END}")
        if not backend_ok:
            print(f"   Start backend: {Colors.CYAN}uvicorn app.main:app --reload{Colors.END}")
        if not ollama_ok:
            print(f"   Start Ollama:  {Colors.CYAN}ollama serve{Colors.END}")
        return False
    return True


def print_help():
    """Print help message."""
    print(f"\n{Colors.BOLD}Commands:{Colors.END}")
    print("  /help    - Show this help")
    print("  /clear   - Clear chat history")
    print("  /quit    - Exit chatbot")
    print("  /status  - Check service status")
    print("\n{Colors.BOLD}Tips:{Colors.END}")
    print("  • Ask about budgets, spending, savings, goals")
    print("  • Investment/crypto advice will be blocked")
    print("  • Response may take 5-10 seconds (Phi model)")
    print()


def interactive_chat(token: str):
    """Interactive chat loop."""
    print(f"{Colors.GREEN}Connected! Type /help for commands.{Colors.END}\n")

    message_count = 0
    start_time = datetime.now()

    while True:
        try:
            user_input = input(f"{Colors.BLUE}You: {Colors.END}").strip()

            if not user_input:
                continue

            # Handle commands
            if user_input.lower() == "/quit":
                print(f"{Colors.YELLOW}Goodbye!{Colors.END}")
                break

            if user_input.lower() == "/help":
                print_help()
                continue

            if user_input.lower() == "/clear":
                print(f"{Colors.YELLOW}Chat history cleared (client-side only){Colors.END}\n")
                continue

            if user_input.lower() == "/status":
                backend_ok, ollama_ok = check_services()
                print()
                print_status(backend_ok, ollama_ok)
                print()
                continue

            # Send message to chatbot
            print(f"{Colors.YELLOW}Finwise: {Colors.BOLD}thinking...{Colors.END}", end="", flush=True)

            response = send_message(token, user_input)

            if response:
                message_count += 1
                resp_text = response.get("response", "No response")
                is_safe = response.get("safe", True)

                # Clear "thinking..." line
                print("\r" + " " * 50 + "\r", end="")

                # Print response
                print(f"{Colors.GREEN}Finwise:{Colors.END} {resp_text}")

                if not is_safe:
                    print(f"{Colors.YELLOW}⚠️  Safety checked{Colors.END}")

                print()

        except KeyboardInterrupt:
            print(f"\n{Colors.YELLOW}Interrupted. Goodbye!{Colors.END}")
            break
        except Exception as e:
            print(f"\n{Colors.RED}Error: {e}{Colors.END}\n")

    # Print session summary
    elapsed = datetime.now() - start_time
    print(f"\n{Colors.CYAN}─ Session Summary ─{Colors.END}")
    print(f"Messages: {message_count}")
    print(f"Duration: {elapsed.total_seconds():.1f}s")
    print()


def main():
    """Main function."""
    print_welcome()

    # Check services
    backend_ok, ollama_ok = check_services()
    if not print_status(backend_ok, ollama_ok):
        return

    print()

    # Login
    print(f"{Colors.BOLD}Login{Colors.END}")
    email = input("Email: ").strip()
    password = input("Password: ").strip()

    token = login(email, password)
    if not token:
        print(f"{Colors.RED}Failed to login{Colors.END}")
        return

    print(f"{Colors.GREEN}✓ Logged in{Colors.END}")

    # Start chat
    interactive_chat(token)


if __name__ == "__main__":
    main()
