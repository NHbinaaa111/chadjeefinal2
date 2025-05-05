import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { getApiUrl, getDefaultFetchOptions } from '@/lib/api-config';
import {
  getUserSubjects,
  getTodayTasks,
  getOverallProgress,
  getCompletedTasksRatio,
  getUserProfile,
  getUserCalendarTasks,
  updateTask,
  addTask
} from '@/lib/storage';
import { 
  getTodayString 
} from '@/lib/utils';
import { Task, CalendarTask, Subject, UserProfile } from '@/lib/types';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import QuoteCard from '@/components/QuoteCard';
import TaskList from '@/components/TaskList';
import Calendar from '@/components/Calendar';
import SubjectProgress from '@/components/SubjectProgress';
import PomodoroTimer from '@/components/PomodoroTimer';
import JEECountdown from '@/components/JEECountdown';
import SimplifiedStudyTracker from '@/components/SimplifiedStudyTracker';
import StudyStreakBadge from '@/components/StudyStreakBadge';
import StudyRecommendations from '@/components/StudyRecommendations';
import SyllabusProgressTracker from '@/components/SyllabusProgressTracker';
import NotesSection from '@/components/NotesSection';
import TestRecordSection from '@/components/TestRecordSection';
import PageTransition from '@/components/PageTransition';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // User data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [tasksRatio, setTasksRatio] = useState({ completed: 0, total: 0 });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [calendarTasks, setCalendarTasks] = useState<CalendarTask[]>([]);
  
  // Dialog states
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    subject: '',
    subjectColor: 'blue'
  });
  
  // Load user data from API using React Query
  const { data: subjectsData, isLoading: loadingSubjects } = useQuery({
    queryKey: ['/api/users', user?.id, 'subjects'],
    queryFn: async () => {
      if (!user) return [];
      try {
        const userId = String(user.id);
        const response = await fetch(
          getApiUrl(`/api/users/${userId}/subjects`), 
          getDefaultFetchOptions()
        );
        if (!response.ok) return [];
        return await response.json();
      } catch (error) {
        console.error("Error fetching subjects:", error);
        return [];
      }
    },
    enabled: !!user,
  });

  const { data: tasksData, isLoading: loadingTasks } = useQuery({
    queryKey: ['/api/users', user?.id, 'tasks'],
    queryFn: async () => {
      if (!user) return [];
      try {
        const userId = String(user.id);
        const response = await fetch(
          getApiUrl(`/api/users/${userId}/tasks`), 
          getDefaultFetchOptions()
        );
        if (!response.ok) return [];
        return await response.json();
      } catch (error) {
        console.error("Error fetching tasks:", error);
        return [];
      }
    },
    enabled: !!user,
  });

  const { data: settingsData, isLoading: loadingSettings } = useQuery({
    queryKey: ['/api/users', user?.id, 'settings'],
    queryFn: async () => {
      if (!user) return null;
      try {
        const userId = String(user.id);
        const response = await fetch(
          getApiUrl(`/api/users/${userId}/settings`), 
          getDefaultFetchOptions()
        );
        if (!response.ok) return null;
        return await response.json();
      } catch (error) {
        console.error("Error fetching settings:", error);
        return null;
      }
    },
    enabled: !!user,
  });

  const { data: calendarData, isLoading: loadingCalendar } = useQuery({
    queryKey: ['/api/users', user?.id, 'calendar-tasks'],
    queryFn: async () => {
      if (!user) return [];
      try {
        const userId = String(user.id);
        const response = await fetch(
          getApiUrl(`/api/users/${userId}/calendar-tasks`),
          getDefaultFetchOptions()
        );
        if (!response.ok) return [];
        return await response.json();
      } catch (error) {
        console.error("Error fetching calendar tasks:", error);
        return [];
      }
    },
    enabled: !!user,
  });

  // Update state with fetched data or fallbacks
  useEffect(() => {
    if (!user) {
      setLocation('/login');
      return;
    }

    if (subjectsData) setSubjects(subjectsData);
    if (tasksData) {
      // Filter for today's tasks
      const today = getTodayString();
      const todaysTasks = tasksData.filter((task: any) => task.date === today);
      setTodayTasks(todaysTasks);
      
      // Calculate task completion ratio
      const completed = todaysTasks.filter((task: any) => task.completed).length;
      const total = todaysTasks.length;
      setTasksRatio({ completed, total });
    }
    
    // Calculate overall progress based on completed topics and tasks
    const calculateProgress = () => {
      // Get total topics completed
      const totalTopics = subjects.reduce((sum, subj) => sum + (subj.totalTopics || 0), 0);
      const completedTopics = subjects.reduce((sum, subj) => sum + (subj.completedTopics || 0), 0);
      
      // Get tasks completed
      const totalTasks = tasksData?.length || 0;
      const completedTasks = tasksData?.filter((task: any) => task.completed).length || 0;
      
      // Calculate weighted average (topics are 70%, tasks are 30%)
      let topicsProgress = totalTopics > 0 ? (completedTopics / totalTopics) * 70 : 0;
      let tasksProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 30 : 0;
      
      // Overall progress is the sum, capped at 100%
      return Math.min(Math.round(topicsProgress + tasksProgress), 100);
    };
    
    const calculatedProgress = calculateProgress();
    setOverallProgress(calculatedProgress || 0);
    
    // Set calendar tasks
    if (calendarData) setCalendarTasks(calendarData);
    
    // Set user profile from settings
    if (settingsData) {
      setProfile({
        studyHours: settingsData.studyHours || 0,
        studyHoursGoal: settingsData.studyHoursGoal || 35,
        theme: settingsData.theme || 'dark',
        accentColor: settingsData.accentColor || 'blue'
      });
    }
  }, [user, setLocation, subjectsData, tasksData, settingsData, calendarData]);
  
  // Handle task completion toggle
  const handleTaskToggle = (taskId: string, completed: boolean) => {
    if (!user) return;
    
    try {
      // Convert user.id to string
      const userId = String(user.id);
      
      updateTask(userId, taskId, { completed });
      
      // Update local state
      setTodayTasks(prev => 
        prev.map(task => 
          task.id === taskId ? { ...task, completed } : task
        )
      );
      
      // Update tasks ratio
      const newRatio = getCompletedTasksRatio(userId);
      setTasksRatio(newRatio || { completed: 0, total: 0 });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Could not update task. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Handle add task dialog
  const openAddTaskDialog = () => {
    setNewTask({
      title: '',
      subject: 'Physics',
      subjectColor: 'blue'
    });
    setIsAddTaskDialogOpen(true);
  };
  
  const handleAddTask = () => {
    if (!user) return;
    
    if (!newTask.title.trim()) {
      toast({
        title: "Error",
        description: "Task title cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Convert user.id to string
      const userId = String(user.id);
      
      // Make sure the title is always a string
      const taskTitle = newTask.title.trim();
      
      const task: Omit<Task, 'id'> = {
        title: taskTitle,
        completed: false,
        date: getTodayString(),
        subject: newTask.subject,
        subjectColor: newTask.subject === 'Physics' ? 'blue' : 
                     newTask.subject === 'Chemistry' ? 'green' : 'purple'
      };
      
      // Add task
      const addedTask = addTask(userId, task);
      
      // Update local state
      setTodayTasks(prev => [...prev, addedTask]);
      
      // Update tasks ratio
      const newRatio = getCompletedTasksRatio(userId);
      setTasksRatio(newRatio || { completed: 0, total: 0 });
      
      // Close dialog
      setIsAddTaskDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Task added successfully",
      });
    } catch (error) {
      console.error("Error adding task:", error);
      toast({
        title: "Error",
        description: "Could not add task. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow flex">
        <Sidebar />
        
        <div className="flex-grow overflow-auto p-6 pb-20 md:pb-6">
          <div className="container mx-auto">
            {/* Dashboard Header */}
            <PageTransition className="w-full">
              <div className="mb-8">
                <h2 className="text-2xl font-poppins font-semibold">
                  Welcome back, <span className="neon-text-blue">{user?.name.split(' ')[0]}</span>!
                </h2>
                <p className="text-[#E0E0E0] opacity-80">Here's an overview of your JEE preparation journey.</p>
              </div>
            </PageTransition>
            
            {/* Stats Overview Cards */}
            <PageTransition className="w-full">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[var(--card)] p-6 rounded-lg border border-[var(--border)] hover:border-[var(--neon-green)] transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-[var(--card-foreground)] opacity-80">Overall Progress</p>
                      <h3 className="text-2xl font-semibold mt-1 text-[var(--neon-green)]" id="overall-progress">{overallProgress}%</h3>
                    </div>
                    <div className="bg-[var(--secondary)] p-2 rounded-md">
                      <i className="fas fa-chart-pie text-[var(--neon-green)]"></i>
                    </div>
                  </div>
                  <div className="mt-4 bg-[var(--secondary)] h-2 rounded-md">
                    <div className="bg-[var(--neon-green)] h-2 rounded-md" style={{ width: `${overallProgress}%` }}></div>
                  </div>
                </div>
                
                <div className="bg-[var(--card)] p-6 rounded-lg border border-[var(--border)] hover:border-[var(--neon-purple)] transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-[var(--card-foreground)] opacity-80">Today's Tasks</p>
                      <h3 className="text-2xl font-semibold mt-1 text-[var(--neon-purple)]" id="today-tasks">
                        {tasksRatio.completed}/{tasksRatio.total}
                      </h3>
                    </div>
                    <div className="bg-[var(--secondary)] p-2 rounded-md">
                      <i className="fas fa-tasks text-[var(--neon-purple)]"></i>
                    </div>
                  </div>
                  <div className="mt-4 bg-[var(--secondary)] h-2 rounded-md">
                    <div 
                      className="bg-[var(--neon-purple)] h-2 rounded-md" 
                      style={{ width: tasksRatio.total > 0 ? `${(tasksRatio.completed / tasksRatio.total) * 100}%` : '0%' }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-[var(--card)] p-6 rounded-lg border border-[var(--border)] hover:border-[var(--neon-blue)] transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-[var(--card-foreground)] opacity-80">Weekly Study Hours</p>
                      <h3 className="text-2xl font-semibold mt-1 text-[var(--neon-blue)]" id="study-hours">
                        {profile?.studyHours || 0}
                      </h3>
                    </div>
                    <div className="bg-[var(--secondary)] p-2 rounded-md">
                      <i className="fas fa-clock text-[var(--neon-blue)]"></i>
                    </div>
                  </div>
                  <p className="text-sm mt-4">Goal: <span id="hours-goal">{profile?.studyHoursGoal || 35}</span> hours</p>
                </div>
              </div>
            </PageTransition>
            
            {/* Progress by Subject & Today's Tasks */}
            <PageTransition className="w-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Subject Progress */}
                <SubjectProgress subjects={subjects} />
                
                {/* Today's Tasks */}
                <div className="bg-[var(--card)] p-6 rounded-lg border border-[var(--border)]">
                  <TaskList 
                    tasks={todayTasks}
                    onTaskToggle={handleTaskToggle}
                    showAddButton={true}
                    onAddTask={openAddTaskDialog}
                    viewAllLink="/tasks"
                  />
                </div>
              </div>
            </PageTransition>
            
            {/* New Dashboard Tabs */}
            <PageTransition className="w-full">
              <div className="mt-8">
                <Tabs defaultValue="study-tools" className="w-full">
                  <TabsList className="grid grid-cols-4 lg:grid-cols-6 mb-4">
                    <TabsTrigger value="study-tools">Study Tools</TabsTrigger>
                    <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                    <TabsTrigger value="tests">Tests</TabsTrigger>
                    <TabsTrigger value="calendar" className="hidden lg:block">Calendar</TabsTrigger>
                    <TabsTrigger value="quote" className="hidden lg:block">Quote</TabsTrigger>
                  </TabsList>
                  
                  {/* Study Tools Tab */}
                  <TabsContent value="study-tools" className="space-y-6">
                    {/* Study Streak Badge */}
                    <StudyStreakBadge />
                    
                    {/* Study Recommendations with JEE Dashboard Link */}
                    <div className="flex flex-col">
                      <StudyRecommendations />
                      <div className="flex justify-end mt-2">
                        <Link to="/jee-dashboard">
                          <Button variant="outline" className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20 transition-colors">
                            View JEE Dashboard
                          </Button>
                        </Link>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <PomodoroTimer />
                      <JEECountdown />
                    </div>
                    <SimplifiedStudyTracker />
                  </TabsContent>
                  
                  {/* Syllabus Tab */}
                  <TabsContent value="syllabus">
                    <SyllabusProgressTracker />
                  </TabsContent>
                  
                  {/* Notes Tab */}
                  <TabsContent value="notes">
                    <NotesSection />
                  </TabsContent>
                  
                  {/* Tests Tab */}
                  <TabsContent value="tests">
                    <TestRecordSection />
                  </TabsContent>
                  
                  {/* Calendar Tab */}
                  <TabsContent value="calendar">
                    <Calendar calendarTasks={calendarTasks} />
                  </TabsContent>
                  
                  {/* Quote Tab */}
                  <TabsContent value="quote">
                    <QuoteCard />
                  </TabsContent>
                </Tabs>
              </div>
            </PageTransition>
          </div>
        </div>
      </main>
      
      <MobileNav />
      
      {/* Add Task Dialog */}
      <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
        <DialogContent className="bg-[var(--card)] border border-[var(--border)] text-[var(--card-foreground)]">
          <DialogHeader>
            <DialogTitle className="text-xl">Add New Task</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="task-title" className="text-sm font-medium">Task Title</label>
              <Input 
                id="task-title"
                placeholder="Enter task title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="bg-[var(--secondary)] border-[var(--border)]"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="task-subject" className="text-sm font-medium">Subject</label>
              <Select
                value={newTask.subject}
                onValueChange={(value) => setNewTask({ ...newTask, subject: value })}
              >
                <SelectTrigger className="bg-[var(--secondary)] border-[var(--border)]">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                  <SelectItem value="Physics" className="text-[var(--neon-blue)]">Physics</SelectItem>
                  <SelectItem value="Chemistry" className="text-[var(--neon-green)]">Chemistry</SelectItem>
                  <SelectItem value="Mathematics" className="text-[var(--neon-purple)]">Mathematics</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => setIsAddTaskDialogOpen(false)}
              className="border-[var(--border)] hover:bg-[var(--secondary)]"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddTask}
              className="bg-[var(--neon-purple)] text-white hover:bg-[var(--neon-purple)] hover:bg-opacity-90"
            >
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}