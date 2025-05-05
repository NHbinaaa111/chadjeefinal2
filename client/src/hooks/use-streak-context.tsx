import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './use-auth';
import { differenceInDays, isSameDay, parseISO, isToday, isYesterday } from 'date-fns';

type StudySubjectData = {
  [subject: string]: {
    lastStudied: string; // ISO date string
    frequency: number;   // Number of times studied
  }
};

// Activity with subject for tracking study sessions and tests
type StudyActivity = {
  subject: string;
  date: string; // ISO date string
  type: 'pomodoro' | 'test';
};

type StudyStreak = {
  current: number;
  longest: number;
  lastDate: string | null;
  datesStudied: string[];
  activities: StudyActivity[];
};

type StudyRecommendation = {
  subject: string;
  recommendation: string;
};

type StreakContextType = {
  streak: StudyStreak;
  recordSession: (subject?: string) => void;
  logStudySession: (subject: string, date?: string, type?: 'pomodoro' | 'test') => void;
  recommendations: StudyRecommendation[];
  refreshRecommendations: () => void;
  subjectData: StudySubjectData;
};

const defaultStreak: StudyStreak = {
  current: 0,
  longest: 0,
  lastDate: null,
  datesStudied: [],
  activities: [],
};

const StreakContext = createContext<StreakContextType | undefined>(undefined);

interface StreakProviderProps {
  children: ReactNode;
  subjectData?: StudySubjectData;
}

export function StreakProvider({ children, subjectData: initialSubjectData = {} }: StreakProviderProps) {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StudyStreak>(defaultStreak);
  const [recommendations, setRecommendations] = useState<StudyRecommendation[]>([]);
  const [subjectData, setSubjectData] = useState<StudySubjectData>(initialSubjectData);
  
  // Load streak data from localStorage on mount
  useEffect(() => {
    if (user) {
      const userId = String(user.id);
      const savedStreak = localStorage.getItem(`study-streak-${userId}`);
      
      if (savedStreak) {
        try {
          const parsedStreak = JSON.parse(savedStreak);
          setStreak(parsedStreak);
        } catch (e) {
          console.error('Error parsing saved streak data:', e);
          setStreak(defaultStreak);
        }
      }
      
      // Generate recommendations on load
      generateRecommendations();
    }
  }, [user]);
  
  // Save streak data to localStorage whenever it changes
  useEffect(() => {
    if (user && streak !== defaultStreak) {
      const userId = String(user.id);
      localStorage.setItem(`study-streak-${userId}`, JSON.stringify(streak));
    }
  }, [streak, user]);
  
  // Calculate streak values from date-studied array
  const calculateStreak = (dates: string[]): { current: number, longest: number } => {
    if (dates.length === 0) return { current: 0, longest: 0 };
    
    // Sort dates in ascending order
    const sortedDates = [...dates].sort();
    
    // Calculate current streak
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    // Check if today is in the list
    const hasToday = sortedDates.includes(today);
    if (hasToday) {
      currentStreak = 1;
      
      // Start from yesterday and count consecutive days backwards
      let checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - 1);
      
      while (true) {
        const dateString = checkDate.toISOString().split('T')[0];
        if (sortedDates.includes(dateString)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    } else {
      // No study today, check if yesterday is in the list
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];
      
      if (sortedDates.includes(yesterdayString)) {
        currentStreak = 1;
        
        // Start from day before yesterday and count backwards
        let checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - 2);
        
        while (true) {
          const dateString = checkDate.toISOString().split('T')[0];
          if (sortedDates.includes(dateString)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }
    
    // Calculate longest streak
    let longestStreak = currentStreak;
    let currentConsecutive = 1;
    
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i-1]);
      const currDate = new Date(sortedDates[i]);
      
      const diffDays = differenceInDays(currDate, prevDate);
      
      if (diffDays === 1) {
        // Consecutive day
        currentConsecutive++;
        longestStreak = Math.max(longestStreak, currentConsecutive);
      } else if (diffDays > 1) {
        // Break in streak
        currentConsecutive = 1;
      }
    }
    
    return { current: currentStreak, longest: longestStreak };
  };
  
  // Log a study session (more general function that works with different activity types)
  const logStudySession = (subject = 'General Study', date?: string, type: 'pomodoro' | 'test' = 'pomodoro') => {
    if (!user) return;
    
    const sessionDate = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Create activity record
    const newActivity: StudyActivity = {
      subject,
      date: sessionDate,
      type
    };
    
    // Update streak data safely
    const updatedDates = Array.from(new Set([...(Array.isArray(streak.datesStudied) ? streak.datesStudied : []), sessionDate])).sort();
    const updatedActivities = [...(Array.isArray(streak.activities) ? streak.activities : []), newActivity];
    const { current, longest } = calculateStreak(updatedDates);
    
    const newStreak: StudyStreak = {
      current,
      longest,
      lastDate: sessionDate,
      datesStudied: updatedDates,
      activities: updatedActivities,
    };
    
    setStreak(newStreak);
    
    // Update subject data
    const updatedSubjectData = { ...subjectData };
    
    // Initialize subject if it doesn't exist
    if (!updatedSubjectData[subject]) {
      updatedSubjectData[subject] = {
        lastStudied: sessionDate,
        frequency: 0
      };
    }
    
    // Update subject data
    updatedSubjectData[subject] = {
      lastStudied: sessionDate,
      frequency: (updatedSubjectData[subject].frequency || 0) + 1
    };
    
    setSubjectData(updatedSubjectData);
    
    // Update recommendations after recording a session
    generateRecommendations();
  };
  
  // Record a completed pomodoro session (legacy method that calls logStudySession)
  const recordSession = (subject = 'General Study') => {
    logStudySession(subject, undefined, 'pomodoro');
  };
  
  // Generate smart study recommendations based on subject data
  const generateRecommendations = () => {
    if (!subjectData || Object.keys(subjectData).length === 0) {
      setRecommendations([]);
      return;
    }
    
    const newRecommendations: StudyRecommendation[] = [];
    
    // Find subjects not studied in a while
    const subjects = Object.entries(subjectData);
    
    // Sort by last studied date (oldest first)
    const sortedByLastStudied = [...subjects].sort((a, b) => {
      return new Date(a[1].lastStudied).getTime() - new Date(b[1].lastStudied).getTime();
    });
    
    // Get the subject that hasn't been studied for longest
    if (sortedByLastStudied.length > 0) {
      const [subject, data] = sortedByLastStudied[0];
      const daysSince = Math.floor(
        (new Date().getTime() - new Date(data.lastStudied).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // JEE-specific recommendation based on subject
      let recommendation = '';
      if (subject === 'Mathematics') {
        recommendation = `You haven't practiced ${subject} in ${daysSince} days. Focus on solving JEE Advanced level problems.`;
      } else if (subject === 'Physics') {
        recommendation = `It's been ${daysSince} days since you studied ${subject}. Review key mechanics and electromagnetism concepts.`;
      } else if (subject === 'Chemistry') {
        recommendation = `${daysSince} days without ${subject} practice! Revise organic reactions and equilibrium concepts.`;
      } else {
        recommendation = `You haven't studied ${subject} in ${daysSince} days. Time to revisit!`;
      }
      
      newRecommendations.push({
        subject,
        recommendation
      });
    }
    
    // Find subjects with low frequency
    const sortedByFrequency = [...subjects].sort((a, b) => a[1].frequency - b[1].frequency);
    
    if (sortedByFrequency.length > 0 && sortedByFrequency[0][1].frequency < 3) {
      const [subject] = sortedByFrequency[0];
      
      // Don't add duplicate recommendations
      if (!newRecommendations.some(rec => rec.subject === subject)) {
        // JEE-specific focus recommendations
        let recommendation = '';
        if (subject === 'Mathematics') {
          recommendation = `Your ${subject} practice needs attention. Try focusing on calculus, algebra, and coordinate geometry for JEE.`;
        } else if (subject === 'Physics') {
          recommendation = `Increase your focus on ${subject}. Prioritize mechanics, electromagnetism, and modern physics concepts.`;
        } else if (subject === 'Chemistry') {
          recommendation = `You need more practice in ${subject}. Work on organic reactions, periodic properties, and physical chemistry.`;
        } else {
          recommendation = `You should focus more on ${subject} since you've studied it less frequently.`;
        }
        
        newRecommendations.push({
          subject,
          recommendation
        });
      }
    }
    
    // Find subjects that need balancing (if we have at least 3 subjects)
    if (subjects.length >= 3) {
      const highestFreq = Math.max(...subjects.map(([, data]) => data.frequency));
      const lowestFreq = Math.min(...subjects.map(([, data]) => data.frequency));
      
      // If there's a significant imbalance
      if (highestFreq >= lowestFreq * 2) {
        const needBalancing = subjects
          .filter(([, data]) => data.frequency === lowestFreq)
          .map(([subject]) => subject);
        
        if (needBalancing.length > 0 && !newRecommendations.some(rec => needBalancing.includes(rec.subject))) {
          const subject = needBalancing[0];
          
          // JEE-specific balance recommendations
          let recommendation = '';
          if (subject === 'Mathematics') {
            recommendation = `For JEE success, your ${subject} preparation must be balanced with other subjects. Allocate more time to practice questions and mock tests.`;
          } else if (subject === 'Physics') {
            recommendation = `Your ${subject} study time is significantly lower than other subjects. Work on JEE previous year questions to identify weak areas.`;
          } else if (subject === 'Chemistry') {
            recommendation = `Balance your preparation by increasing focus on ${subject}. Review NCERT concepts and solve JEE Advanced problems.`;
          } else {
            recommendation = `You're studying ${subject} much less than other subjects. Try to balance your study schedule.`;
          }
          
          newRecommendations.push({
            subject,
            recommendation
          });
        }
      }
    }
    
    // Generate a recommendation based on streak data
    if (streak.current > 0) {
      newRecommendations.push({
        subject: 'Study Streak',
        recommendation: `Keep up your ${streak.current}-day study streak! You're building great study habits.`
      });
    } else if (streak.longest > 0) {
      newRecommendations.push({
        subject: 'Study Streak',
        recommendation: `You previously reached a ${streak.longest}-day study streak. Can you beat that record?`
      });
    }
    
    setRecommendations(newRecommendations);
  };
  
  // Force refresh recommendations
  const refreshRecommendations = () => {
    generateRecommendations();
  };
  
  const value = {
    streak,
    recordSession,
    logStudySession,
    recommendations,
    refreshRecommendations,
    subjectData,
  };
  
  return (
    <StreakContext.Provider value={value}>
      {children}
    </StreakContext.Provider>
  );
}

export const useStreak = () => {
  const context = useContext(StreakContext);
  
  if (context === undefined) {
    throw new Error('useStreak must be used within a StreakProvider');
  }
  
  return context;
}
