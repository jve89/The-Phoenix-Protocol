const form = document.getElementById('signup-form');
const submitBtn = form.querySelector('button[type="submit"]');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const data = {
    email: formData.get('email')?.trim(),
    name: formData.get('name')?.trim(),
    gender: formData.get('gender')?.trim(),
    plan: formData.get('plan')?.trim(),
    goal_stage: formData.get('goal_stage')?.trim(),
  };

  // ✅ Basic client-side validation
  if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
    alert('Please enter a valid email address.');
    return;
  }
  if (!data.gender || !data.plan) {
    alert('Please select both gender and plan.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerText = 'Processing...';

  try {
    // 1️⃣ Signup
    const signupRes = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const signupJson = await signupRes.json();
    if (!signupRes.ok) throw new Error(signupJson.error || 'Signup failed');

    // 2️⃣ Stripe Checkout
    const checkoutRes = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const { url } = await checkoutRes.json();
    if (!url) throw new Error('Checkout URL not returned');
    window.location.href = url;

  } catch (err) {
    console.error('[Signup Error]', err.message);
    alert(err.message || 'Something went wrong. Please try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = 'Continue';
  }
});
