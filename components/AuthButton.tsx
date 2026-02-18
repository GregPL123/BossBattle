import React from 'react';
import { User } from 'firebase/auth';
import { loginWithGoogle, logoutUser, isFirebaseConfigured } from '../utils/firebase';
import { playSfx } from '../utils/sound';

interface AuthButtonProps {
  user: User | null;
  onLoginStart?: () => void;
  onError?: (msg: string) => void;
}

const AuthButton: React.FC<AuthButtonProps> = ({ user, onLoginStart, onError }) => {
  
  const handleLogin = async () => {
    if (!isFirebaseConfigured) {
      if (onError) onError("Firebase not configured. Check environment variables.");
      return;
    }
    
    playSfx('click');
    if (onLoginStart) onLoginStart();
    
    try {
      await loginWithGoogle();
      playSfx('success');
    } catch (e: any) {
      if (onError) onError(e.message || "Login failed");
      playSfx('failure');
    }
  };

  const handleLogout = async () => {
    playSfx('click');
    await logoutUser();
  };

  if (user) {
    return (
      <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-full pl-1 pr-4 py-1">
        <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-700">
           {user.photoURL ? (
             <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
           ) : (
             <div className="w-full h-full bg-blue-600 flex items-center justify-center font-bold text-xs">
               {user.displayName?.charAt(0) || 'U'}
             </div>
           )}
        </div>
        <div className="flex flex-col">
           <span className="text-[10px] font-bold text-gray-500 uppercase leading-none">Logged In</span>
           <span className="text-xs font-bold text-white leading-none max-w-[100px] truncate">{user.displayName}</span>
        </div>
        <button 
          onClick={handleLogout}
          className="ml-2 text-xs text-red-400 hover:text-red-300 font-bold"
        >
          LOGOUT
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-4 py-2 rounded-full text-sm font-bold transition-all shadow-lg hover:shadow-blue-900/20"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
      <span>Cloud Login</span>
    </button>
  );
};

export default AuthButton;