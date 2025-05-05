import React, { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { motion } from 'framer-motion';
// Using a simplified StudySession interface for the component
interface StudySession {
  id: string;
  taskName: string;
  startTime: string;
  endTime: string | null;
  duration: number;
  date: string;
}

interface StreakTrackerProps {
  studySessions: StudySession[];
}

export default function StreakTracker({ studySessions }: StreakTrackerProps) {
  const [streak, setStreak] = useState(0);
  
  useEffect(() => {
    if (!studySessions?.length) {
      setStreak(0);
      return;
    }
    
    // Sort sessions by date (newest first)
    const sortedSessions = [...studySessions].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    
    // Group sessions by date to check if user studied each day
    const sessionsByDate = new Map<string, StudySession[]>();
    sortedSessions.forEach(session => {
      const dateKey = new Date(session.date).toISOString().split('T')[0];
      if (!sessionsByDate.has(dateKey)) {
        sessionsByDate.set(dateKey, []);
      }
      sessionsByDate.get(dateKey)?.push(session);
    });
    
    // Calculate streak (consecutive days)
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if user studied today
    const todayKey = today.toISOString().split('T')[0];
    const hasStudiedToday = sessionsByDate.has(todayKey);
    
    if (hasStudiedToday) {
      currentStreak = 1;
      
      // Check previous days
      let checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - 1);
      
      while (true) {
        const dateKey = checkDate.toISOString().split('T')[0];
        if (sessionsByDate.has(dateKey)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    } else {
      // Check if user studied yesterday
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = yesterday.toISOString().split('T')[0];
      
      if (sessionsByDate.has(yesterdayKey)) {
        currentStreak = 1;
        
        // Check previous days
        let checkDate = new Date(yesterday);
        checkDate.setDate(checkDate.getDate() - 1);
        
        while (true) {
          const dateKey = checkDate.toISOString().split('T')[0];
          if (sessionsByDate.has(dateKey)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }
    
    setStreak(currentStreak);
  }, [studySessions]);
  
  if (streak === 0) return null;
  
  return (
    <motion.div 
      className="flex items-center gap-2 bg-opacity-90 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3 py-1.5 rounded-full text-sm font-medium"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Flame className="h-4 w-4 text-yellow-100" />
      <span>{streak} day{streak !== 1 ? 's' : ''} streak</span>
    </motion.div>
  );
}