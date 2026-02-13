import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/input';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);
    
    // Get form data directly from the form element
    const formData = new FormData(e.target as HTMLFormElement);
    const emailValue = formData.get('email') as string;
    const passwordValue = formData.get('password') as string;
    
    console.log('Form submission - email:', emailValue, 'password length:', passwordValue?.length);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailValue, password: passwordValue }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store JWT token
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        // Keep session storage for compatibility
        sessionStorage.setItem('dashboard_auth', 'true');
        navigate('/dashboard');
      } else {
        const error = await response.json();
        setMessage(error.error || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - bright.blue branded animated gradient */}
      <div className="hidden lg:flex lg:w-3/4 animated-gradient items-center justify-center p-12">
        <div className="text-center">
          <img 
            src="/bb-cloud-logo.svg" 
            alt="bright.blue cloud" 
            className="h-32 w-auto"
          />
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/4 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 heading">Log in</h1>
          </div>
          
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 heading">
                Email
              </label>
              <Input 
                id="email" 
                name="email"
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                className="w-full h-12 text-base"
                placeholder="Enter email"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 heading">
                Password
              </label>
              <Input 
                id="password" 
                name="password"
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                className="w-full h-12 text-base"
                placeholder="Enter password"
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#183EF6] text-white rounded-md font-medium hover:bg-[#0D0D21] transition-colors heading disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          {message && (
            <p className="text-sm text-red-600 mt-4 text-center">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
