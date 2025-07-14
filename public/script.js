document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = {
    email: formData.get('email'),
    name: formData.get('name'),
    gender: formData.get('gender'),
    plan: formData.get('plan'),
    goal_stage: formData.get('goal_stage'),
  };
  console.log('Form data:', data);
  try {
    const signupResponse = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        name: data.name,
        gender: data.gender,
        plan: data.plan,
        goal_stage: data.goal_stage,
      }),
    });
    const responseData = await signupResponse.json();
    console.log('Signup response:', responseData); // Specific data
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
    alert('Sign-up failed');
  }
});