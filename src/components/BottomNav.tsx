import { Link, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-[100] md:hidden">
      <div className="backdrop-blur-xl bg-[#1a1a1a]/85 border border-[#262626] rounded-[2.5rem] py-3 px-8 flex items-center justify-between shadow-2xl">
        {/* Home */}
        <Link to="/" className={`transition-colors ${isActive('/') ? 'text-white' : 'text-zinc-500 hover:text-white'}`}>
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
          </svg>
        </Link>
        {/* Offers */}
        <Link to="/offers" className={`transition-colors ${isActive('/offers') ? 'text-white' : 'text-zinc-500 hover:text-white'}`}>
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
          </svg>
        </Link>
        {/* Central Search FAB */}
        <Link to="/food" className="flex flex-col items-center -mt-8">
          <div className="bg-[#facc15] p-4 rounded-full shadow-lg shadow-[#facc15]/30 border-4 border-[#0a0a0a] transition-transform active:scale-95">
            <svg className="h-7 w-7 text-black" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </div>
          <span className="text-[#facc15] text-[10px] font-black uppercase mt-1 tracking-widest">Search</span>
        </Link>
        {/* Favorites -> Cart/Checkout */}
        <Link to="/checkout" className={`transition-colors ${isActive('/checkout') ? 'text-white' : 'text-zinc-500 hover:text-white'}`}>
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            {/* Using a shopping bag icon instead of favorite heart for cart */}
            <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
          </svg>
        </Link>
      </div>
    </nav>
  );
}
