import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import Sidebar from '@/components/Dashboard/Sidebar';
import MobileMenu from '@/components/Dashboard/MobileMenu';
import TaskManager from '@/components/Dashboard/TaskManager';
import StudyPlanner from '@/components/Dashboard/StudyPlanner';
import Calendar from '@/components/Dashboard/Calendar';
import Goals from '@/components/Dashboard/Goals';
import Progress from '@/components/Dashboard/Progress';
import { useToast } from '@/hooks/use-toast';
import { TaskService } from '@/services/TaskService';
import { ProgressService } from '@/services/ProgressService';
import { QuoteService } from '@/services/QuoteService';

type DashboardView = 'dashboard-home' | 'dashboard-tasks' | 'dashboard-planner' | 'dashboard-calendar' | 'dashboard-goals' | 'dashboard-progress';

function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<DashboardView>('dashboard-home');
  const [todaysTasks, setTodaysTasks] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>({
    physics: 0,
    chemistry: 0,
    mathematics: 0,
    overall: 0
  });
  const [currentQuote, setCurrentQuote] = useState<{text: string, author: string}>({ text: '', author: '' });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Load tasks
    const tasks = TaskService.getTodaysTasks();
    setTodaysTasks(tasks);

    // Load progress
    const progressData = ProgressService.getProgress();
    setProgress(progressData);

    // Set current quote
    setCurrentQuote(QuoteService.getCurrentQuote());
  }, [isAuthenticated, navigate]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const switchDashboardView = (view: DashboardView) => {
    setCurrentView(view);
  };

  const handleNextQuote = () => {
    const quote = QuoteService.getNextQuote();
    setCurrentQuote(quote);
  };

  const completeTask = (taskId: string, completed: boolean) => {
    TaskService.updateTaskStatus(taskId, completed);
    const updatedTasks = TaskService.getTodaysTasks();
    setTodaysTasks(updatedTasks);
    
    // Update progress as well
    const progressData = ProgressService.getProgress();
    setProgress(progressData);
    
    toast({
      title: completed ? "Task completed" : "Task marked as incomplete",
      description: "Your progress has been updated",
    });
  };

  return (
    <div id="dashboard-page" className="page active min-h-screen flex flex-col md:flex-row">
      {/* Sidebar Navigation (Desktop) */}
      <Sidebar 
        currentView={currentView} 
        switchView={switchDashboardView} 
        userName={user?.name || ""}
      />
      
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-[#3A3A3A]">
        <div className="flex items-center">
          <h1 className="text-xl font-orbitron font-bold">
            <span className="text-[#00EEFF]">Chad</span><span className="text-[#0FFF50]">jee</span>
          </h1>
        </div>
        <button className="text-gray-300 p-2" onClick={toggleMobileMenu}>
          <i className="fas fa-bars"></i>
        </button>
      </header>
      
      {/* Mobile Menu (off-canvas) */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={toggleMobileMenu} 
        currentView={currentView} 
        switchView={(view) => {
          switchDashboardView(view);
          toggleMobileMenu();
        }}
        userName={user?.name || ""}
      />
      
      {/* Dashboard Content */}
      <div className="flex-grow overflow-y-auto">
        {/* Dashboard Home View */}
        {currentView === 'dashboard-home' && (
          <div id="dashboard-home" className="dashboard-view active p-6 md:p-8">
            <div className="mb-8">
              <h2 className="text-xl md:text-2xl font-orbitron font-bold mb-2">
                Welcome back, <span id="user-name" className="text-[#00EEFF]">{user?.name}</span>
              </h2>
              <p className="text-gray-400">Here's your study overview for today</p>
            </div>
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-[#1A1A1A] p-6 rounded-xl border border-[#0FFF50]">
                <div className="text-sm text-gray-400 mb-2">Today's Tasks</div>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-rajdhani font-bold">
                    {TaskService.getCompletedTasksCount()}/{TaskService.getTodaysTasks().length}
                  </div>
                  <div className="text-[#0FFF50] text-xl"><i className="fas fa-tasks"></i></div>
                </div>
                <div className="mt-4 h-1 bg-[#252525] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#0FFF50] progress-bar-fill" 
                    style={{width: `${TaskService.getTodaysTasks().length ? 
                      (TaskService.getCompletedTasksCount() / TaskService.getTodaysTasks().length) * 100 : 0}%`}}
                  ></div>
                </div>
              </div>
              <div className="bg-[#1A1A1A] p-6 rounded-xl border border-[#00EEFF]">
                <div className="text-sm text-gray-400 mb-2">Study Hours</div>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-rajdhani font-bold">4.5/8</div>
                  <div className="text-[#00EEFF] text-xl"><i className="fas fa-clock"></i></div>
                </div>
                <div className="mt-4 h-1 bg-[#252525] rounded-full overflow-hidden">
                  <div className="h-full bg-[#00EEFF] progress-bar-fill" style={{width: '56%'}}></div>
                </div>
              </div>
              <div className="bg-[#1A1A1A] p-6 rounded-xl border border-[#5E17EB]">
                <div className="text-sm text-gray-400 mb-2">Weekly Goal Progress</div>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-rajdhani font-bold">{progress.overall}%</div>
                  <div className="text-[#5E17EB] text-xl"><i className="fas fa-bullseye"></i></div>
                </div>
                <div className="mt-4 h-1 bg-[#252525] rounded-full overflow-hidden">
                  <div className="h-full bg-[#5E17EB] progress-bar-fill" style={{width: `${progress.overall}%`}}></div>
                </div>
              </div>
            </div>
            
            {/* Countdown & Quote */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2 bg-[#1A1A1A] p-6 rounded-xl border border-[#BF40FF]">
                <h3 className="font-orbitron font-semibold mb-4">Exam Countdown</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#121212] border border-[#00EEFF] rounded-lg p-4">
                    <div className="text-xs text-gray-400 mb-2">JEE Mains 2024</div>
                    <div className="flex items-baseline">
                      <div className="text-3xl font-rajdhani font-bold text-[#00EEFF]">
                        {TaskService.getDaysUntilJEEMains()}
                      </div>
                      <div className="ml-2 text-gray-400">days remaining</div>
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <div className="flex-1 bg-[#3A3A3A] rounded-md p-2 text-center">
                        <div className="text-xs text-gray-400 mb-1">Hours</div>
                        <div className="font-rajdhani font-bold text-xl">
                          {TaskService.getHoursUntilJEEMains()}
                        </div>
                      </div>
                      <div className="flex-1 bg-[#3A3A3A] rounded-md p-2 text-center">
                        <div className="text-xs text-gray-400 mb-1">Minutes</div>
                        <div className="font-rajdhani font-bold text-xl">
                          {TaskService.getMinutesUntilJEEMains()}
                        </div>
                      </div>
                      <div className="flex-1 bg-[#3A3A3A] rounded-md p-2 text-center">
                        <div className="text-xs text-gray-400 mb-1">Seconds</div>
                        <div className="font-rajdhani font-bold text-xl" id="jee-mains-seconds">
                          {TaskService.getSecondsUntilJEEMains()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#121212] border border-[#BF40FF] rounded-lg p-4">
                    <div className="text-xs text-gray-400 mb-2">JEE Advanced 2024</div>
                    <div className="flex items-baseline">
                      <div className="text-3xl font-rajdhani font-bold text-[#BF40FF]">
                        {TaskService.getDaysUntilJEEAdvanced()}
                      </div>
                      <div className="ml-2 text-gray-400">days remaining</div>
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <div className="flex-1 bg-[#3A3A3A] rounded-md p-2 text-center">
                        <div className="text-xs text-gray-400 mb-1">Hours</div>
                        <div className="font-rajdhani font-bold text-xl">
                          {TaskService.getHoursUntilJEEAdvanced()}
                        </div>
                      </div>
                      <div className="flex-1 bg-[#3A3A3A] rounded-md p-2 text-center">
                        <div className="text-xs text-gray-400 mb-1">Minutes</div>
                        <div className="font-rajdhani font-bold text-xl">
                          {TaskService.getMinutesUntilJEEAdvanced()}
                        </div>
                      </div>
                      <div className="flex-1 bg-[#3A3A3A] rounded-md p-2 text-center">
                        <div className="text-xs text-gray-400 mb-1">Seconds</div>
                        <div className="font-rajdhani font-bold text-xl" id="jee-advanced-seconds">
                          {TaskService.getSecondsUntilJEEAdvanced()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-[#1A1A1A] p-6 rounded-xl border border-[#0FFF50] flex flex-col">
                <h3 className="font-orbitron font-semibold mb-4">Daily Motivation</h3>
                <div className="flex-grow flex items-center">
                  <div id="quote-container" className="text-center">
                    <p className="italic text-gray-300 mb-4">"{currentQuote.text}"</p>
                    <p className="text-sm text-[#0FFF50]">- {currentQuote.author}</p>
                  </div>
                </div>
                <button 
                  id="next-quote" 
                  className="mt-4 text-sm text-[#00EEFF] hover:underline self-end"
                  onClick={handleNextQuote}
                >
                  Next Quote <i className="fas fa-arrow-right ml-1"></i>
                </button>
              </div>
            </div>
            
            {/* Tasks & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#1A1A1A] p-6 rounded-xl border border-[#00EEFF]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-orbitron font-semibold">Today's Tasks</h3>
                  <button 
                    className="text-sm text-[#00EEFF] hover:underline" 
                    onClick={() => switchDashboardView('dashboard-tasks')}
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-3">
                  {todaysTasks.length > 0 ? todaysTasks.slice(0, 4).map((task) => (
                    <div key={task.id} className="task-item flex items-center p-3 bg-[#121212] rounded-lg border border-[#252525] hover:border-[#00EEFF] transition-all duration-300">
                      <input 
                        type="checkbox" 
                        checked={task.completed} 
                        onChange={(e) => completeTask(task.id, e.target.checked)}
                        className="form-checkbox h-5 w-5 text-[#0FFF50] rounded border-[#3A3A3A] bg-[#2A2A2A] mr-3"
                      />
                      <div className="flex-grow">
                        <div className={`text-sm ${task.completed ? 'line-through text-gray-400' : ''}`}>
                          {task.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {task.startTime} - {task.endTime}
                        </div>
                      </div>
                      <div className={`text-xs bg-opacity-20 px-2 py-1 rounded ${
                        task.subject === 'physics' ? 'bg-[#0FFF50] text-[#0FFF50]' : 
                        task.subject === 'chemistry' ? 'bg-[#00EEFF] text-[#00EEFF]' : 
                        task.subject === 'mathematics' ? 'bg-[#5E17EB] text-[#5E17EB]' : 
                        'bg-gray-500 text-gray-300'
                      }`}>
                        {task.subject.charAt(0).toUpperCase() + task.subject.slice(1)}
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-6 text-gray-400">
                      No tasks for today. Add some tasks to get started!
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-[#1A1A1A] p-6 rounded-xl border border-[#5E17EB]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-orbitron font-semibold">Subject Progress</h3>
                  <button 
                    className="text-sm text-[#00EEFF] hover:underline"
                    onClick={() => switchDashboardView('dashboard-progress')}
                  >
                    View Details
                  </button>
                </div>
                <div className="space-y-4">
                  {/* Always show the subject progress bars, even if no data is available */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm">Physics</div>
                      <div className="text-xs text-gray-400">{progress.physics}%</div>
                    </div>
                    <div className="h-2 bg-[#121212] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#0FFF50] progress-bar-fill" 
                        style={{width: `${progress.physics}%`}}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm">Chemistry</div>
                      <div className="text-xs text-gray-400">{progress.chemistry}%</div>
                    </div>
                    <div className="h-2 bg-[#121212] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#00EEFF] progress-bar-fill" 
                        style={{width: `${progress.chemistry}%`}}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm">Mathematics</div>
                      <div className="text-xs text-gray-400">{progress.mathematics}%</div>
                    </div>
                    <div className="h-2 bg-[#121212] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#5E17EB] progress-bar-fill" 
                        style={{width: `${progress.mathematics}%`}}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm">Overall Syllabus</div>
                      <div className="text-xs text-gray-400">{progress.overall}%</div>
                    </div>
                    <div className="h-2 bg-[#121212] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#0FFF50] via-[#00EEFF] to-[#5E17EB] progress-bar-fill" 
                        style={{width: `${progress.overall}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Task Manager View */}
        {currentView === 'dashboard-tasks' && (
          <TaskManager />
        )}
        
        {/* Study Planner View */}
        {currentView === 'dashboard-planner' && (
          <StudyPlanner />
        )}
        
        {/* Calendar View */}
        {currentView === 'dashboard-calendar' && (
          <Calendar />
        )}
        
        {/* Goals View */}
        {currentView === 'dashboard-goals' && (
          <Goals />
        )}
        
        {/* Progress View */}
        {currentView === 'dashboard-progress' && (
          <Progress />
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
