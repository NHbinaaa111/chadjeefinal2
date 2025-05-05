import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { TaskService } from '@/services/TaskService';

type SidebarProps = {
  currentView: string;
  switchView: (view: any) => void;
  userName: string;
};

const Sidebar = ({ currentView, switchView, userName }: SidebarProps) => {
  const [, navigate] = useLocation();
  const [daysUntilJEEMains, setDaysUntilJEEMains] = useState(0);
  
  useEffect(() => {
    const updateCountdown = () => {
      setDaysUntilJEEMains(TaskService.getDaysUntilJEEMains());
    };
    
    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  const logout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (confirmed) {
      // Perform logout
      navigate('/login');
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#1E1E1E] border-r border-[#3A3A3A] p-6">
      <div className="flex items-center mb-8">
        <Link href="/dashboard">
          <h1 className="text-2xl font-orbitron font-bold cursor-pointer">
            <span className="text-[#00EEFF]">Chad</span><span className="text-[#0FFF50]">jee</span>
          </h1>
        </Link>
      </div>
      <nav className="flex-grow space-y-1">
        <a 
          href="#" 
          className={`dashboard-nav-item flex items-center px-4 py-3 rounded-md ${
            currentView === 'dashboard-home' 
              ? 'text-[#00EEFF] bg-[#00EEFF] bg-opacity-10' 
              : 'text-gray-300 hover:bg-[#121212]'
          }`}
          onClick={(e) => {
            e.preventDefault();
            switchView('dashboard-home');
          }}
        >
          <i className="fas fa-home w-5 h-5 mr-3"></i>
          <span>Dashboard</span>
        </a>
        
        <a 
          href="#" 
          className={`dashboard-nav-item flex items-center px-4 py-3 rounded-md ${
            currentView === 'dashboard-tasks' 
              ? 'text-[#00EEFF] bg-[#00EEFF] bg-opacity-10' 
              : 'text-gray-300 hover:bg-[#121212]'
          }`}
          onClick={(e) => {
            e.preventDefault();
            switchView('dashboard-tasks');
          }}
        >
          <i className="fas fa-tasks w-5 h-5 mr-3"></i>
          <span>Tasks</span>
        </a>
        
        <a 
          href="#" 
          className={`dashboard-nav-item flex items-center px-4 py-3 rounded-md ${
            currentView === 'dashboard-planner' 
              ? 'text-[#00EEFF] bg-[#00EEFF] bg-opacity-10' 
              : 'text-gray-300 hover:bg-[#121212]'
          }`}
          onClick={(e) => {
            e.preventDefault();
            switchView('dashboard-planner');
          }}
        >
          <i className="fas fa-book w-5 h-5 mr-3"></i>
          <span>Study Planner</span>
        </a>
        
        <a 
          href="#" 
          className={`dashboard-nav-item flex items-center px-4 py-3 rounded-md ${
            currentView === 'dashboard-calendar' 
              ? 'text-[#00EEFF] bg-[#00EEFF] bg-opacity-10' 
              : 'text-gray-300 hover:bg-[#121212]'
          }`}
          onClick={(e) => {
            e.preventDefault();
            switchView('dashboard-calendar');
          }}
        >
          <i className="fas fa-calendar-alt w-5 h-5 mr-3"></i>
          <span>Calendar</span>
        </a>
        
        <a 
          href="#" 
          className={`dashboard-nav-item flex items-center px-4 py-3 rounded-md ${
            currentView === 'dashboard-goals' 
              ? 'text-[#00EEFF] bg-[#00EEFF] bg-opacity-10' 
              : 'text-gray-300 hover:bg-[#121212]'
          }`}
          onClick={(e) => {
            e.preventDefault();
            switchView('dashboard-goals');
          }}
        >
          <i className="fas fa-bullseye w-5 h-5 mr-3"></i>
          <span>Goals</span>
        </a>
        
        <a 
          href="#" 
          className={`dashboard-nav-item flex items-center px-4 py-3 rounded-md ${
            currentView === 'dashboard-progress' 
              ? 'text-[#00EEFF] bg-[#00EEFF] bg-opacity-10' 
              : 'text-gray-300 hover:bg-[#121212]'
          }`}
          onClick={(e) => {
            e.preventDefault();
            switchView('dashboard-progress');
          }}
        >
          <i className="fas fa-chart-line w-5 h-5 mr-3"></i>
          <span>Progress</span>
        </a>
      </nav>
      
      <div className="pt-6 border-t border-[#3A3A3A]">
        <div className="mb-4">
          <div className="text-xs text-gray-500 uppercase font-medium mb-2">JEE Mains Countdown</div>
          <div className="font-rajdhani font-bold text-2xl text-[#00EEFF]">
            {daysUntilJEEMains} Days
          </div>
        </div>
        <div className="flex flex-col">
          <Link href="/settings">
            <a className="flex items-center px-4 py-3 text-gray-300 hover:bg-[#121212] rounded-md">
              <i className="fas fa-cog w-5 h-5 mr-3"></i>
              <span>Settings</span>
            </a>
          </Link>
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              logout();
            }}
            className="flex items-center px-4 py-3 text-gray-300 hover:bg-[#121212] rounded-md"
          >
            <i className="fas fa-sign-out-alt w-5 h-5 mr-3"></i>
            <span>Logout</span>
          </a>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
