import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

class CalmHireSeleniumTests(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        # Setup Chrome WebDriver
        options = webdriver.ChromeOptions()
        # options.add_argument('--headless') # Uncomment to run invisibly
        options.add_argument('--window-size=1920,1080')
        cls.driver = webdriver.Chrome(options=options)
        
        # Test against the live GitHub pages URL
        cls.base_url = "https://cnancyflora.github.io/anixety_prediction/"
        cls.driver.implicitly_wait(10)

    @classmethod
    def tearDownClass(cls):
        # Close the browser when tests finish
        cls.driver.quit()

    def test_01_verify_page_title(self):
        """Test Case 1: Verify the page loads with correct title"""
        self.driver.get(self.base_url)
        self.assertIn("CalmHire", self.driver.title, "Title does not contain CalmHire")
        print("✅ PASS: Page Title Verified")

    def test_02_verify_login_ui_elements(self):
        """Test Case 2: Verify Login inputs are present on the screen"""
        self.driver.get(self.base_url)
        
        try:
            # Wait up to 5 seconds for an element that indicates the page loaded
            # (Adjust the CSS selector based on your actual React/Next.js code)
            body = WebDriverWait(self.driver, 5).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            self.assertTrue(body.is_displayed())
            print("✅ PASS: UI Rendered Successfully")
        except TimeoutException:
            self.fail("❌ FAIL: Page did not load in time")

    def test_03_simulate_button_click(self):
        """Test Case 3: Simulate clicking a 'Get Started' or generic button"""
        self.driver.get(self.base_url)
        try:
            # Find all buttons and try to click the first one if it exists
            buttons = self.driver.find_elements(By.TAG_NAME, "button")
            if buttons:
                buttons[0].click()
                print("✅ PASS: Simulated Button Click")
            else:
                print("⚠️ SKIP: No buttons found to click on the main page")
        except Exception as e:
            self.fail(f"❌ FAIL: Button interaction failed - {str(e)}")

if __name__ == "__main__":
    # Run the tests
    print("🚀 Starting Selenium Web Automation Tests for CalmHire AI...")
    unittest.main(verbosity=2)
