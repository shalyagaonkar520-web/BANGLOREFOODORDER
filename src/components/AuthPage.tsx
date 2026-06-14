import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, UserCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [needsPhone, setNeedsPhone] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      if (user.displayName) {
        localStorage.setItem('moms_magic_user_name', user.displayName);
        setName(user.displayName);
      }
      
      // If we don't have a phone number in localStorage or state, prompt them
      const existingPhone = localStorage.getItem('moms_magic_user_phone');
      if (!existingPhone) {
        setNeedsPhone(true);
        toast.success(`Welcome, ${user.displayName || 'Guest'}! Please provide your phone number to continue.`);
      } else {
        toast.success('Successfully logged in with Google!');
        navigate(-1);
      }
    } catch (error: any) {
      console.error(error);
      toast.error('Google sign-in failed: ' + error.message);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    if (!needsPhone && !isLogin && !name) {
      toast.error('Please enter your name');
      return;
    }

    if (name) {
      localStorage.setItem('moms_magic_user_name', name.trim());
    }
    localStorage.setItem('moms_magic_user_phone', phone.trim());
    
    toast.success(isLogin || needsPhone ? 'Successfully logged in!' : 'Account created successfully!');
    navigate(-1); // Go back
  };

  return (
    <div className="min-h-screen bg-[#050505] p-6 flex flex-col items-center justify-center relative">
      <motion.button 
        whileHover={{ x: -5 }}
        onClick={() => navigate(-1)}
        className="absolute top-8 left-6 flex items-center gap-2 text-white/50 font-black uppercase tracking-widest text-[10px] hover:text-[#4CD964] transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back
      </motion.button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/[0.02] border border-white/10 p-10 rounded-[40px] shadow-2xl backdrop-blur-md space-y-8"
      >
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-[#4CD964]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserCircle className="w-10 h-10 text-[#4CD964]" />
          </div>
          <h1 className="text-4xl font-black italic uppercase text-white tracking-tighter">
            {needsPhone ? 'Almost There' : (isLogin ? 'Welcome Back' : 'Create Account')}
          </h1>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-[4px]">
            {needsPhone ? 'We need your phone number for delivery updates' : (isLogin ? 'Login to continue' : 'Sign up for faster checkout')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {needsPhone ? (
            <>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-[#4CD964] uppercase tracking-[4px] ml-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91..."
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:border-[#4CD964]/50 outline-none font-bold transition-colors"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-[#4CD964] text-black font-black uppercase tracking-[4px] text-sm py-5 rounded-2xl hover:bg-[#3bc252] transition-colors mt-8 shadow-[0_0_20px_rgba(76,217,100,0.2)] hover:shadow-[0_0_30px_rgba(76,217,100,0.4)]"
              >
                Complete Login
              </button>
            </>
          ) : (
            <>
              {!isLogin && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-[#4CD964] uppercase tracking-[4px] ml-1">Full Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:border-[#4CD964]/50 outline-none font-bold transition-colors"
                  />
                </div>
              )}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-[#4CD964] uppercase tracking-[4px] ml-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91..."
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:border-[#4CD964]/50 outline-none font-bold transition-colors"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-[#4CD964] text-black font-black uppercase tracking-[4px] text-sm py-5 rounded-2xl hover:bg-[#3bc252] transition-colors mt-8 shadow-[0_0_20px_rgba(76,217,100,0.2)] hover:shadow-[0_0_30px_rgba(76,217,100,0.4)]"
              >
                {isLogin ? 'Secure Login' : 'Register Now'}
              </button>

              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-white/30 text-[10px] font-black uppercase tracking-widest">Or continue with</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <button 
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-white text-black font-black uppercase tracking-[2px] text-sm py-4 rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-3 hover:scale-[1.02]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google Sign-In
              </button>
            </>
          )}
        </form>

        {!needsPhone && (
          <div className="text-center pt-6 border-t border-white/5">
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-white/60 text-[10px] font-black uppercase tracking-widest hover:text-[#4CD964] transition-colors"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
