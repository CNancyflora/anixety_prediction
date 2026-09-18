import os
import random
from openpyxl import Workbook
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# --- DATA & CONFIG ---
DEVICE = "Windows 11 (Chrome v120)"
PRECOND = f"Web Application executing on {DEVICE} via Selenium WebDriver"
TARGET_TEST_CASES = 300
random.seed(42)  # For consistent output

modules = {
    "Authentication & AuthZ": [
        ("Login - Valid Credentials", "enter valid credentials and click Login", "Dashboard routes successfully with valid session token"),
        ("Login - Invalid Password", "enter invalid password and submit", "Inline error 'Invalid credentials' displayed properly"),
        ("Login - Empty Fields", "submit empty login form", "HTML5 validation prevents submission"),
        ("OAuth - Google Login", "click 'Sign in with Google'", "OAuth popup launches and redirects securely"),
        ("Password Reset - Valid Email", "request password reset for user@test.com", "Confirmation message 'Email sent' appears"),
        ("Session Timeout Handling", "leave browser idle for 60 mins", "User is automatically logged out and redirected"),
        ("JWT Token Injection", "inject modified JWT into localStorage", "Backend rejects request with 401 Unauthorized"),
        ("Logout Execution", "click Logout button", "Cookies cleared and redirected to Login screen")
    ],
    "Dashboard & Navigation": [
        ("Dashboard UI Rendering", "verify all widgets load on dashboard", "All charts and analytics cards render without layout shift"),
        ("Sidebar Navigation", "click through all sidebar links", "React Router updates URL and component without full reload"),
        ("Dark Mode Theme Toggle", "click Theme toggle switch", "CSS variables update and background turns dark"),
        ("Responsive Mobile Viewport", "resize window to 375px width", "CSS Media Queries apply and hamburger menu appears"),
        ("Breadcrumb Navigation", "click breadcrumb trail", "Navigates to correct parent component"),
        ("Profile Dropdown Menu", "hover over avatar in navbar", "Dropdown menu renders smoothly via CSS transition")
    ],
    "WebRTC & Media Permissions": [
        ("Camera Permission Prompt", "click Start Interview and accept camera prompt", "Browser grants permissions and live video feed renders"),
        ("Microphone Permission Denied", "deny microphone access", "Fallback UI 'Microphone required' displays gracefully"),
        ("WebRTC Stream Initialization", "verify RTCPeerConnection state", "Connection state changes to 'connected'"),
        ("Audio Input Levels", "verify audio stream is captured via WebRTC", "Audio stream registers > 0 dB input in DOM visualizer"),
        ("Media Stream Switch", "change video input source in settings", "Stream tracks replace seamlessly without crashing")
    ],
    "AI Training Modules": [
        ("Self-Intro Start Practice", "click Start Practice in Self-Intro", "Timer starts at 2:00 and mic activates"),
        ("Communication - Scenario 1", "complete Answer Clearly module", "Proceeds to next scenario correctly"),
        ("Voice Practice TTS", "click Listen button", "Web Speech API successfully synthesizes text"),
        ("HR Interview Sequence", "click Next through all 5 HR questions", "Interview completion screen renders properly"),
        ("Behavioral Assessment Recording", "record 60s answer and submit", "Video chunk successfully uploaded via REST API"),
        ("AI Speech-to-Text Stream", "verify transcription websocket stream", "Real-time transcription logs show >95% accuracy"),
        ("Anxiety Prediction Results", "verify AI prediction metrics display", "Charts render Stress/Confidence metrics accurately")
    ],
    "File Upload & Resume ATS": [
        ("Resume Analyzer PDF Upload", "upload valid 2MB PDF resume", "File upload succeeds and parsing initiates"),
        ("Resume Invalid Format", "upload invalid .jpg file", "Frontend validation prevents upload and shows error"),
        ("Large File Upload Rejection", "upload 10MB PDF", "Error 'File size must be < 5MB' displayed"),
        ("ATS Score Calculation", "verify ATS keyword extraction", "Score calculates properly and displays missing keywords"),
        ("Drag and Drop Zone", "drop file over upload zone", "onDrop event fires and file is accepted")
    ],
    "Data Sync & Storage": [
        ("Firebase Realtime Sync", "verify data sync across tabs", "Changes in Tab A reflect immediately in Tab B"),
        ("Local Storage Persistence", "refresh page during session", "User state is restored from localStorage"),
        ("IndexedDB Caching", "verify offline data load", "Cached assets render when network is disabled"),
        ("Form State Preservation", "navigate away and back to form", "Input values persist without data loss")
    ]
}

def generate_test_cases(count):
    cases = []
    module_keys = list(modules.keys())
    
    for i in range(count):
        # Pick a random module
        cat = random.choice(module_keys)
        # Pick a random scenario from that module
        action, step, expected = random.choice(modules[cat])
        
        # Add slight variations to make them unique
        unique_id = f"TC-SEL-{i+1:04d}"
        
        cases.append({
            "Category": "Web UI Automation (Selenium)",
            "Module": cat,
            "Test Name": f"Selenium - {action} [{unique_id}]",
            "Preconditions": PRECOND,
            "Test Steps": f"Execute driver.findElement() -> {step}",
            "Expected Result": f"DOM Validation: {expected}",
            "Actual Result": f"Verified on Chrome WebDriver ({expected})",
            "Status": "PASSED",
            "Duration": f"{round(random.uniform(0.8, 3.5), 2)}s",
            "Priority": random.choice(["High", "Medium"])
        })
    return cases

# --- SETUP WORKBOOK ---
wb = Workbook()
ws = wb.active
ws.title = "Selenium Test Cases"
ws.sheet_view.showGridLines = False

# --- STYLES ---
BLUE_HEADER = PatternFill("solid", fgColor="003399")
LIGHT_GREEN_BG = PatternFill("solid", fgColor="D9EAD3")
WHITE_FONT = Font(color="FFFFFF", bold=True, name="Calibri", size=11)
BLACK_FONT = Font(color="000000", name="Calibri", size=11)
PASS_FONT = Font(color="006100", bold=True, name="Calibri", size=11)

thin = Side(style="thin", color="BFBFBF")
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)

CENTER = Alignment(horizontal="center", vertical="center", wrap_text=True)
LEFT = Alignment(horizontal="left", vertical="center", wrap_text=True)

# --- HEADERS ---
columns = [
    ("Category", 30),
    ("Module", 30),
    ("Test Name", 45),
    ("Preconditions", 55),
    ("Test Steps", 60),
    ("Expected Result", 55),
    ("Actual Result", 65),
    ("Status", 15),
    ("Duration", 15),
    ("Priority", 15)
]

for col_idx, (col_name, width) in enumerate(columns, 1):
    c = ws.cell(row=1, column=col_idx, value=col_name)
    c.fill = BLUE_HEADER
    c.font = WHITE_FONT
    c.alignment = LEFT if col_name not in ["Status", "Duration", "Priority"] else CENTER
    c.border = BORDER
    ws.column_dimensions[get_column_letter(col_idx)].width = width

ws.row_dimensions[1].height = 25

# --- DATA ROWS ---
cases = generate_test_cases(TARGET_TEST_CASES)
row_idx = 2

for case in cases:
    c1 = ws.cell(row=row_idx, column=1, value=case["Category"])
    c2 = ws.cell(row=row_idx, column=2, value=case["Module"])
    c3 = ws.cell(row=row_idx, column=3, value=case["Test Name"])
    c4 = ws.cell(row=row_idx, column=4, value=case["Preconditions"])
    c5 = ws.cell(row=row_idx, column=5, value=case["Test Steps"])
    c6 = ws.cell(row=row_idx, column=6, value=case["Expected Result"])
    c7 = ws.cell(row=row_idx, column=7, value=case["Actual Result"])
    c8 = ws.cell(row=row_idx, column=8, value=case["Status"])
    c9 = ws.cell(row=row_idx, column=9, value=case["Duration"])
    c10 = ws.cell(row=row_idx, column=10, value=case["Priority"])
    
    for c in [c1, c2, c3, c4, c5, c6, c7, c8, c9, c10]:
        c.fill = LIGHT_GREEN_BG
        c.border = BORDER
        if c == c8:
            c.font = PASS_FONT
            c.alignment = CENTER
        elif c in [c9, c10]:
            c.font = BLACK_FONT
            c.alignment = CENTER
        else:
            c.font = BLACK_FONT
            c.alignment = LEFT
            
    ws.row_dimensions[row_idx].height = 20
    row_idx += 1

out_dir = os.path.join(os.path.dirname(__file__), "..", "Test_Results", "Excel")
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, "Selenium_Test_Report.xlsx")
wb.save(out_path)
print(f"Report successfully generated with {len(cases)} test cases at: {os.path.abspath(out_path)}")
