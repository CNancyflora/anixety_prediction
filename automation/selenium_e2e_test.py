import unittest
import time
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
        
        # NOTE: Update this URL to your new Vercel URL once the deployment is finished!
        # For now, we will test against the local development server.
        cls.base_url = "http://localhost:3000"
        cls.driver.implicitly_wait(10)

    @classmethod
    def tearDownClass(cls):
        # Close the browser when tests finish
        cls.driver.quit()

    def test_01_verify_landing_page(self):
        """Test Case 1: Verify the new CalmHire landing page loads correctly"""
        self.driver.get(self.base_url)
        self.assertIn("CalmHire", self.driver.title, "Title does not contain CalmHire")
        
        try:
            # Look for the new hero title we created
            hero = WebDriverWait(self.driver, 5).until(
                EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Prepare Better. Speak Confidently.')]"))
            )
            self.assertTrue(hero.is_displayed())
            print("✅ PASS: Landing Page Verified")
        except TimeoutException:
            self.fail("❌ FAIL: Landing Page text not found")

    def test_02_navigate_to_login(self):
        """Test Case 2: Verify navigation to the new Login screen"""
        self.driver.get(self.base_url)
        
        try:
            # Click the 'Sign In' button on the landing page
            buttons = self.driver.find_elements(By.TAG_NAME, "a")
            signin_btn = next(btn for btn in buttons if "Sign In" in btn.text)
            signin_btn.click()
            
            # Wait for the Auth card to load
            auth_card = WebDriverWait(self.driver, 5).until(
                EC.presence_of_element_located((By.CLASS_NAME, "auth-card"))
            )
            self.assertTrue(auth_card.is_displayed())
            print("✅ PASS: Navigated to Login Successfully")
        except Exception as e:
            self.fail(f"❌ FAIL: Could not navigate to login - {str(e)}")

    def test_03_test_failed_login(self):
        """Test Case 3: Test that invalid login credentials show the correct error alert"""
        self.driver.get(self.base_url + "/login")
        
        try:
            # Find the email and password inputs
            inputs = self.driver.find_elements(By.TAG_NAME, "input")
            email_input = inputs[0]
            password_input = inputs[1]
            
            email_input.send_keys("fake_test_user@example.com")
            password_input.send_keys("wrongpassword123")
            
            # Submit the form
            submit_btn = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
            submit_btn.click()
            
            # Wait for the Firebase error alert to appear
            alert = WebDriverWait(self.driver, 5).until(
                EC.presence_of_element_located((By.CLASS_NAME, "alert-danger"))
            )
            self.assertTrue("Incorrect email or password" in alert.text or "Login failed" in alert.text)
            print("✅ PASS: Invalid Login Handled Correctly")
        except Exception as e:
            self.fail(f"❌ FAIL: Login test failed - {str(e)}")

if __name__ == "__main__":
    print("🚀 Starting Selenium Web Automation Tests for CalmHire V2...")
    unittest.main(verbosity=2)
