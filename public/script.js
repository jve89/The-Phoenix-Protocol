(function() {
  const form = document.getElementById('signup-form');
  const submitBtn = form.querySelector('button[type="submit"]');

  // Utility: fetch with timeout
  async function fetchWithTimeout(url, options = {}, timeout = 10000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return response;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  // Basic email regex
  const emailRegex = /\S+@\S+\.\S+/;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitBtn.disabled) return;

    const formData = new FormData(form);
    const data = {
      email: formData.get('email')?.trim() || '',
      name: formData.get('name')?.trim() || '',
      gender: formData.get('gender')?.trim() || '',
      plan: formData.get('plan')?.trim() || '',
      goal_stage: formData.get('goal_stage')?.trim() || ''
    };

    // Client-side validation
    if (!emailRegex.test(data.email)) {
      alert('Please enter a valid email address.');
      return;
    }
    if (!data.gender || !data.plan || !data.goal_stage) {
      alert('Please select gender, plan, and goal stage.');
      return;
    }

    // Disable UI
    submitBtn.disabled = true;
    const originalText = submitBtn.innerText;
    submitBtn.innerText = 'Processing...';

    try {
      // Combined signup & checkout in one endpoint (future improvement)
      const res = await fetchWithTimeout('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Signup failed');
      }

      const { url } = await res.json();
      if (!url) {
        throw new Error('Checkout URL not returned.');
      }

      // Redirect to Stripe
      window.location.href = url;
    } catch (err) {
      console.error('[Signup Error]', err);
      alert(err.message || 'Something went wrong. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = originalText;
    }
  });
})();
