const form = document.getElementById('signup-form');
const submitBtn = form.querySelector('button[type="submit"]');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const data = {
    email: formData.get('email')?.trim(),
    name: formData.get('name')?.trim(),
    gender: formData.get('gender'),
    plan: formData.get('plan'),
    goal_stage: formData.get('goal_stage'),
  };

  // Basic validation
  if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
    alert('Please enter a valid email address.');
    return;
  }
  if (!data.gender || !data.plan) {
    alert('Please select gender and plan.');
    return;
  }

  submitBtn.disabled = true;

  try {
    const signupResponse = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const responseData = await signupResponse.json();

    if (!signupResponse.ok) throw new Error(responseData.error || 'Signup failed');

    const checkoutResponse = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        plan: data.plan,
        gender: data.gender,
        goal_stage: data.goal_stage,
      }),
    });

    const { url } = await checkoutResponse.json();
    window.location.href = url;

  } catch (error) {
    console.error('Error:', error.message);
    alert(error.message || 'Sign-up failed');
  } finally {
    submitBtn.disabled = false;
  }
});
