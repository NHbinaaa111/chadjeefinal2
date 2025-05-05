import { useState, FormEvent, useEffect } from 'react';
import { TaskService } from '@/services/TaskService';
import { useToast } from '@/hooks/use-toast';
import { Task } from '@/types';

const TaskManager = () => {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState('all');
  const [newTask, setNewTask] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    subject: '',
    startTime: '',
    endTime: '',
    description: ''
  });

  useEffect(() => {
    loadTasks();
  }, [filter]);

  const loadTasks = () => {
    let filteredTasks: Task[] = [];
    
    switch(filter) {
      case 'completed':
        filteredTasks = TaskService.getAllTasks().filter(task => task.completed);
        break;
      case 'pending':
        filteredTasks = TaskService.getAllTasks().filter(task => !task.completed);
        break;
      default:
        filteredTasks = TaskService.getAllTasks();
    }
    
    setTasks(filteredTasks);
  };

  const handleAddTask = (e: FormEvent) => {
    e.preventDefault();
    
    if (!newTask.title) {
      toast({
        title: "Error",
        description: "Please enter a task title",
        variant: "destructive"
      });
      return;
    }
    
    if (!newTask.subject) {
      toast({
        title: "Error",
        description: "Please select a subject",
        variant: "destructive"
      });
      return;
    }
    
    const task: Omit<Task, 'id'> = {
      title: newTask.title,
      date: newTask.date,
      subject: newTask.subject,
      startTime: newTask.startTime,
      endTime: newTask.endTime,
      description: newTask.description,
      completed: false
    };
    
    TaskService.addTask(task);
    
    // Reset form
    setNewTask({
      title: '',
      date: new Date().toISOString().split('T')[0],
      subject: '',
      startTime: '',
      endTime: '',
      description: ''
    });
    
    loadTasks();
    
    toast({
      title: "Success",
      description: "Task added successfully!",
    });
  };

  const handleDeleteTask = (taskId: string) => {
    TaskService.deleteTask(taskId);
    loadTasks();
    
    toast({
      title: "Success",
      description: "Task deleted successfully!",
    });
  };

  const handleToggleTask = (taskId: string, completed: boolean) => {
    TaskService.updateTaskStatus(taskId, completed);
    loadTasks();
  };

  return (
    <div id="dashboard-tasks" className="dashboard-view p-6 md:p-8">
      <div className="mb-8">
        <h2 className="text-xl md:text-2xl font-orbitron font-bold mb-2">Task Manager</h2>
        <p className="text-gray-400">Organize and track your daily tasks</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-[#1E1E1E] p-6 rounded-xl border border-[#3A3A3A] mb-6">
            <h3 className="font-orbitron font-semibold mb-4">Add New Task</h3>
            <form id="task-form" className="space-y-4" onSubmit={handleAddTask}>
              <div>
                <label htmlFor="task-title" className="block text-sm font-medium text-gray-300 mb-2">Task Title</label>
                <input 
                  type="text" 
                  id="task-title" 
                  className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-md focus:outline-none focus:ring-2 focus:ring-[#00EEFF]" 
                  placeholder="What do you need to do?"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="task-date" className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                  <input 
                    type="date" 
                    id="task-date" 
                    className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-md focus:outline-none focus:ring-2 focus:ring-[#00EEFF]"
                    value={newTask.date}
                    onChange={(e) => setNewTask({...newTask, date: e.target.value})}
                  />
                </div>
                <div>
                  <label htmlFor="task-subject" className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                  <select 
                    id="task-subject" 
                    className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-md focus:outline-none focus:ring-2 focus:ring-[#00EEFF]"
                    value={newTask.subject}
                    onChange={(e) => setNewTask({...newTask, subject: e.target.value})}
                  >
                    <option value="">Select Subject</option>
                    <option value="physics">Physics</option>
                    <option value="chemistry">Chemistry</option>
                    <option value="mathematics">Mathematics</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="task-start-time" className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
                  <input 
                    type="time" 
                    id="task-start-time" 
                    className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-md focus:outline-none focus:ring-2 focus:ring-[#00EEFF]"
                    value={newTask.startTime}
                    onChange={(e) => setNewTask({...newTask, startTime: e.target.value})}
                  />
                </div>
                <div>
                  <label htmlFor="task-end-time" className="block text-sm font-medium text-gray-300 mb-2">End Time</label>
                  <input 
                    type="time" 
                    id="task-end-time" 
                    className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-md focus:outline-none focus:ring-2 focus:ring-[#00EEFF]"
                    value={newTask.endTime}
                    onChange={(e) => setNewTask({...newTask, endTime: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="task-description" className="block text-sm font-medium text-gray-300 mb-2">Additional Notes (Optional)</label>
                <textarea 
                  id="task-description" 
                  rows={2} 
                  className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-md focus:outline-none focus:ring-2 focus:ring-[#00EEFF]" 
                  placeholder="Any additional details..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                ></textarea>
              </div>
              <div>
                <button type="submit" className="px-6 py-2 rounded-md bg-[#00EEFF] text-[#121212] font-medium neon-blue-glow hover:bg-opacity-90 transition duration-300">
                  Add Task
                </button>
              </div>
            </form>
          </div>
          
          <div className="bg-[#1E1E1E] p-6 rounded-xl border border-[#3A3A3A]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-orbitron font-semibold">Task List</h3>
              <div className="flex space-x-2">
                <select 
                  id="task-filter" 
                  className="text-xs px-3 py-1 bg-[#2A2A2A] border border-[#3A3A3A] rounded-md focus:outline-none focus:ring-1 focus:ring-[#00EEFF]"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All Tasks</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                </select>
                <button 
                  id="task-sort" 
                  className="text-xs px-3 py-1 bg-[#2A2A2A] border border-[#3A3A3A] rounded-md hover:bg-[#3A3A3A]"
                  onClick={() => {
                    const sortedTasks = [...tasks].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    setTasks(sortedTasks);
                  }}
                >
                  <i className="fas fa-sort mr-1"></i> Sort
                </button>
              </div>
            </div>
            
            <div id="task-list" className="space-y-3 max-h-96 overflow-y-auto">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <div key={task.id} className="task-item flex items-center p-3 bg-[#121212] rounded-lg">
                    <input 
                      type="checkbox" 
                      checked={task.completed} 
                      onChange={(e) => handleToggleTask(task.id, e.target.checked)}
                      className="form-checkbox h-5 w-5 text-[#0FFF50] rounded border-[#3A3A3A] bg-[#2A2A2A] mr-3"
                    />
                    <div className="flex-grow">
                      <div className={`text-sm ${task.completed ? 'line-through text-gray-400' : ''}`}>
                        {task.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(task.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}, {task.startTime} - {task.endTime}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`text-xs bg-opacity-20 px-2 py-1 rounded ${
                        task.subject === 'physics' ? 'bg-[#0FFF50] text-[#0FFF50]' : 
                        task.subject === 'chemistry' ? 'bg-[#00EEFF] text-[#00EEFF]' : 
                        task.subject === 'mathematics' ? 'bg-[#5E17EB] text-[#5E17EB]' : 
                        'bg-gray-500 text-gray-300'
                      }`}>
                        {task.subject.charAt(0).toUpperCase() + task.subject.slice(1)}
                      </div>
                      <button 
                        className="task-delete text-gray-400 hover:text-red-500 p-1"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-400">
                  No tasks found. Add some tasks to get started!
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-[#1E1E1E] p-6 rounded-xl border border-[#3A3A3A] mb-6">
            <h3 className="font-orbitron font-semibold mb-4">Task Statistics</h3>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-400 mb-2">Completed vs. Pending</div>
                <div className="flex items-center space-x-2">
                  <div className="flex-grow h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#0FFF50] progress-bar-fill" 
                      style={{
                        width: `${tasks.length ? 
                          (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                  <div className="text-sm text-[#0FFF50]">
                    {tasks.length ? 
                      Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0}%
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#121212] p-4 rounded-lg text-center">
                  <div className="text-3xl font-rajdhani font-bold text-[#00EEFF]">
                    {TaskService.getTodaysTasks().length}
                  </div>
                  <div className="text-xs text-gray-400">Today's Tasks</div>
                </div>
                <div className="bg-[#121212] p-4 rounded-lg text-center">
                  <div className="text-3xl font-rajdhani font-bold text-[#0FFF50]">
                    {TaskService.getThisWeekTasks().length}
                  </div>
                  <div className="text-xs text-gray-400">This Week</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-2">Subject Distribution</div>
                <div className="space-y-2">
                  {['physics', 'chemistry', 'mathematics', 'other'].map(subject => {
                    const count = tasks.filter(t => t.subject === subject).length;
                    const percentage = tasks.length ? Math.round((count / tasks.length) * 100) : 0;
                    
                    return (
                      <div key={subject} className="flex justify-between items-center">
                        <div className="text-xs flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            subject === 'physics' ? 'bg-[#0FFF50]' : 
                            subject === 'chemistry' ? 'bg-[#00EEFF]' : 
                            subject === 'mathematics' ? 'bg-[#5E17EB]' : 
                            'bg-gray-400'
                          }`}></div>
                          <span>{subject.charAt(0).toUpperCase() + subject.slice(1)}</span>
                        </div>
                        <div className="text-xs">{percentage}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-[#1E1E1E] p-6 rounded-xl border border-[#3A3A3A]">
            <h3 className="font-orbitron font-semibold mb-4">Upcoming Tasks</h3>
            <div className="space-y-3">
              {TaskService.getUpcomingTasks().slice(0, 3).map(task => (
                <div key={task.id} className="flex items-center p-3 bg-[#121212] rounded-lg">
                  <div className="flex-grow">
                    <div className="text-sm">{task.title}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(task.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
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
              ))}
              {TaskService.getUpcomingTasks().length === 0 && (
                <div className="text-center py-6 text-gray-400">
                  No upcoming tasks scheduled.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskManager;
