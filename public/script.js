document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = {
    email: formData.get('email'),
    name: formData.get('name'),
    focus: formData.get('focus'),
    gender: formData.get('gender'),
    plan: formData.get('plan'),
  };
  console.log('Form data:', data);
  try {
    const signupResponse = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, focus, gender }),
    });
    if (!signupResponse.ok) throw new Error('Signup failed');
    const checkoutResponse = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, plan: data.plan }),
    });
    const { url } = await checkoutResponse.json();
    window.location.href = url;
  } catch (error) {
    console.error('Error:', error);
    alert('Sign-up failed');
  }
});