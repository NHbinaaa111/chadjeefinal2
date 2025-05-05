import { useState, FormEvent, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [targetJEEYear, setTargetJEEYear] = useState('2025'); // Default to 2025
  const { signup, validatePassword } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Validate password on change
  useEffect(() => {
    if (password) {
      const { valid, message } = validatePassword(password);
      setPasswordError(valid ? '' : message);
    } else {
      setPasswordError('');
    }
  }, [password, validatePassword]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    // Validate password
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      toast({
        title: "Error",
        description: passwordCheck.message,
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    try {
      // Save the JEE target year to localStorage - this will be used by the JEECountdown component
      localStorage.setItem("jee_target_year", targetJEEYear);
      
      // Create the user account with the target JEE year
      const user = await signup(name, email, password);
      
      toast({
        title: "Success",
        description: "Account created successfully!",
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: "Error",
        description: "This email is already registered or an error occurred",
        variant: "destructive"
      });
    }
  };

  return (
    <div id="signup-page" className="page active flex flex-col min-h-screen">
      <header className="py-6 px-6 md:px-16 flex justify-between items-center border-b border-[#3A3A3A]">
        <div className="flex items-center">
          <Link href="/">
            <h1 className="text-2xl md:text-3xl font-bold cursor-pointer">
              <span className="text-[#00EEFF]">Chad</span><span className="text-[#0FFF50]">jee</span>
            </h1>
          </Link>
        </div>
      </header>
      
      <main className="flex-grow flex items-center justify-center py-12 px-6">
        <div className="w-full max-w-md p-8 bg-[#1E1E1E] rounded-xl shadow-lg" data-aos="zoom-in">
          <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>
          <form id="signup-form" className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="signup-name" className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <input 
                type="text" 
                id="signup-name" 
                className="w-full px-4 py-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded-md focus:outline-none focus:ring-2 focus:ring-[#5E17EB]" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <input 
                type="email" 
                id="signup-email" 
                className="w-full px-4 py-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded-md focus:outline-none focus:ring-2 focus:ring-[#5E17EB]" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-gray-300 mb-2">
                Password <span className="text-xs text-gray-400">(minimum 6 characters)</span>
              </label>
              <input 
                type="password" 
                id="signup-password" 
                className={`w-full px-4 py-3 bg-[#2A2A2A] border ${passwordError ? 'border-red-500' : 'border-[#3A3A3A]'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#5E17EB]`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {passwordError && (
                <p className="text-red-500 text-xs mt-1">{passwordError}</p>
              )}
            </div>
            <div>
              <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
              <input 
                type="password" 
                id="signup-confirm-password" 
                className={`w-full px-4 py-3 bg-[#2A2A2A] border ${password !== confirmPassword && confirmPassword ? 'border-red-500' : 'border-[#3A3A3A]'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#5E17EB]`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {password !== confirmPassword && confirmPassword && (
                <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
              )}
            </div>
            
            <div>
              <label htmlFor="target-jee-year" className="block text-sm font-medium text-gray-300 mb-2">
                Target JEE Year
              </label>
              <Select 
                value={targetJEEYear} 
                onValueChange={setTargetJEEYear}
              >
                <SelectTrigger id="target-jee-year" className="w-full px-4 py-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded-md">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="bg-[#2A2A2A] border border-[#3A3A3A]">
                  <SelectItem value="2025">JEE 2025</SelectItem>
                  <SelectItem value="2026">JEE 2026</SelectItem>
                  <SelectItem value="2027">JEE 2027</SelectItem>
                  <SelectItem value="2028">JEE 2028</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400 mt-1">This helps customize your exam countdown</p>
            </div>
            <div>
              <button 
                type="submit" 
                className="w-full py-3 rounded-md bg-[#5E17EB] text-white font-medium hover:bg-opacity-90 transition duration-300"
                disabled={!!(passwordError || (password !== confirmPassword && confirmPassword))}
              >
                Sign Up
              </button>
            </div>
            <div className="text-sm text-center">
              <p className="text-gray-400">
                Already have an account? 
                <Link href="/login" className="text-[#00EEFF] hover:underline ml-1">Log In</Link>
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default SignupPage;
