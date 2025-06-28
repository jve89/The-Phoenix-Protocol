document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = {
    email: formData.get('email'),
    name: formData.get('name'),
    focus: formData.get('focus'),
  };
  try {
    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (response.ok) {
      window.location.href = 'success.html';
    } else {
      alert('Sign-up failed');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred');
  }
});