import os
import re
from playwright.sync_api import sync_playwright, expect

def solve_problem(page):
    """
    This is the core logic to solve a randomly generated problem on the page.
    """
    instruction_text = page.locator("#instruction-text").inner_text()
    print(f"Instruction: {instruction_text}")

    # Case 1: Counting problem
    if "Count the blocks" in instruction_text:
        count = page.locator("#visual-problem .block").count()
        print(f"Problem Type: Counting. Correct answer is {count}")
        page.get_by_role("button", name=str(count), exact=True).click()
        return

    # Case 2: Shape identification problem
    if "Click on the" in instruction_text:
        match = re.search(r"Click on the (\w+):", instruction_text)
        if match:
            correct_shape = match.group(1)
            print(f"Problem Type: Shape Identification. Correct answer is {correct_shape}")
            # With the 'data-shape' attribute added to the app, we can now use a reliable selector.
            page.locator(f'#answer-options [data-shape="{correct_shape}"]').click()
            return
        else:
            raise Exception("Could not parse shape name from instruction.")
    else:
        raise Exception(f"Unknown problem type for instruction: {instruction_text}")

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    file_path = os.path.abspath("index.html")
    page.goto(f"file://{file_path}")

    # 1. Start Game
    # With the animation disabled, a standard click should now work.
    page.get_by_role("button", name="Click to Start").click()
    expect(page.locator("#character-select-screen")).to_be_visible()
    print("Game started.")

    # 2. Select Character
    first_character_option = page.locator(".character-option").first
    expect(first_character_option).to_be_visible()
    first_character_option.click()
    page.get_by_role("button", name="Let's Go!").click()
    expect(page.locator("#level-select-screen")).to_be_visible()
    print("Character selected.")

    # 3. Select Difficulty
    page.get_by_role("button", name="Easy Peasy").click()
    expect(page.locator("#game-screen")).to_be_visible()
    print("Difficulty selected.")

    # 4. Wait for problem and solve it
    page.wait_for_selector("#instruction-text")
    solve_problem(page)

    # 5. Assert Correct Feedback
    feedback_locator = page.locator("#feedback-message")
    expect(feedback_locator).to_have_text(re.compile("Correct!"))
    print("Problem solved correctly.")

    # 6. Take Screenshot
    screenshot_path = "jules-scratch/verification/verification.png"
    page.screenshot(path=screenshot_path)
    print(f"Screenshot saved to {screenshot_path}")

    context.close()
    browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run_verification(playwright)
