// static/script.js

document.addEventListener('DOMContentLoaded', () => {

    // --- AI Planner Form Logic ---
    const aiPlannerForm = document.getElementById('ai-planner-form');
    
    if (aiPlannerForm) {
        aiPlannerForm.addEventListener('submit', (event) => {
            // 1. Prevent the form from submitting normally
            event.preventDefault();

            // 2. Get the user's passion from the input field
            const aiPromptInput = document.getElementById('ai-prompt');
            const userPrompt = aiPromptInput.value.trim();

            if (userPrompt) {
                // 3. Redirect to the planner page, passing the prompt as a parameter
                // We encode the prompt to make it safe for a URL
                window.location.href = `/planner?prompt=${encodeURIComponent(userPrompt)}`;
            } else {
                alert("Please tell us what you're passionate about!");
            }
        });
    }

    // --- Craft My Journey Button Logic ---
    const craftJourneyBtn = document.getElementById('craft-journey-btn');
    if (craftJourneyBtn) {
        craftJourneyBtn.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default if it's a link or button in a form
            window.location.href = '/planner';
        });
    }

    // --- Mobile Menu Logic ---
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // --- Modal Logic for AR button etc. ---
    const customModal = document.getElementById('custom-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const arButton = document.getElementById('ar-button');

    if (arButton) {
        arButton.addEventListener('click', () => {
            customModal.classList.remove('hidden');
        });
    }
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            customModal.classList.add('hidden');
        });
    }

    // --- Dashboard Link Logic ---
    const dashboardLink = document.getElementById('dashboard-link');
    if (dashboardLink) {
        dashboardLink.addEventListener('click', function(event) {
            event.preventDefault();
            window.location.href = '/dash';
        });
    }
});