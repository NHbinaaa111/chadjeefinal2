import { useState, useEffect } from 'react';
import { useStreak } from './use-streak-context';
import { useStudySessions, StudySession } from './use-study-sessions';

// Define the types for our test records
export interface TestRecord {
  id: string;
  subject: string;
  subTopic?: string; // Optional subtopic like "Mechanics" or "Organic Chemistry"
  score: number;
  maxScore: number;
  date: string; // ISO date string
  areasOfImprovement?: string; // New field for areas of improvement
}

// Define the types for recommendations
export interface JEERecommendation {
  id: string;
  subject: string;
  subTopic?: string;
  recommendation: string;
  type: 'time-gap' | 'low-frequency' | 'test-score' | 'study-balance' | 'streak';
  priority: number; // 1-5, with 5 being highest priority
}

// JEE subject topics mapping
const jeeSubjectTopics = {
  Mathematics: [
    'Algebra',
    'Calculus',
    'Coordinate Geometry',
    'Trigonometry',
    'Statistics',
    'Vector Algebra'
  ],
  Physics: [
    'Mechanics',
    'Electromagnetism',
    'Optics',
    'Modern Physics',
    'Thermodynamics',
    'Waves'
  ],
  Chemistry: [
    'Organic Chemistry',
    'Inorganic Chemistry',
    'Physical Chemistry',
    'Equilibrium',
    'Thermodynamics',
    'Electrochemistry'
  ],
  'General Study': ['Study Techniques', 'Time Management', 'Question Practice']
};

// Helper functions for recommendation generation
function getRandomSubTopic(subject: string): string {
  const topics = jeeSubjectTopics[subject as keyof typeof jeeSubjectTopics] || [];
  if (topics.length === 0) return '';
  return topics[Math.floor(Math.random() * topics.length)];
}

// Format date for display
function formatDateDifference(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  return `${diffDays} days ago`;
}

export function useJEERecommendations(testRecords: TestRecord[] = [], providedSessions?: StudySession[]) {
  const { streak, subjectData } = useStreak();
  const { sessions: hookSessions } = useStudySessions();
  const [recommendations, setRecommendations] = useState<JEERecommendation[]>([]);
  
  // Use provided sessions if available, otherwise use sessions from hook
  const sessions = providedSessions || hookSessions;

  // Generate recommendations based on streaks, subject data, and test records
  useEffect(() => {
    const generateRecommendations = () => {
      const newRecommendations: JEERecommendation[] = [];
      const mainSubjects = ['Mathematics', 'Physics', 'Chemistry'];
      
      // Process each main subject
      for (const subject of mainSubjects) {
        // Get Pomodoro data for this subject
        const hasPomodoro = subjectData && subjectData[subject];
        const lastStudiedDate = hasPomodoro ? new Date(subjectData[subject].lastStudied) : null;
        const daysSinceLastStudy = lastStudiedDate ? 
          Math.floor((new Date().getTime() - lastStudiedDate.getTime()) / (1000 * 60 * 60 * 24)) : 
          null;
        
        // Get test records for this subject
        const subjectTests = testRecords
          .filter(test => test.subject === subject)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const hasTest = subjectTests.length > 0;
        const latestTest = hasTest ? subjectTests[0] : null;
        const scorePct = latestTest ? 
          Math.round((latestTest.score / latestTest.maxScore) * 100) : 
          null;
        
        // 1. Priority: Test with score < 50% and areas of improvement
        if (hasTest && scorePct !== null && scorePct < 50 && latestTest?.areasOfImprovement) {
          newRecommendations.push({
            id: `test-${subject}-${Date.now()}`,
            subject,
            subTopic: latestTest.subTopic,
            recommendation: `You scored ${scorePct}% in ${latestTest.subTopic || subject}. Focus on ${latestTest.areasOfImprovement}.`,
            type: 'test-score',
            priority: 5 // Highest priority
          });
          continue; // Skip to next subject
        }
        
        // 2. Second priority: Pomodoro data (if not studied in > 5 days)
        if (daysSinceLastStudy !== null && daysSinceLastStudy > 5) {
          newRecommendations.push({
            id: `pomodoro-${subject}-${Date.now()}`,
            subject,
            recommendation: `You haven't studied ${subject} in ${daysSinceLastStudy} days. Consider revising key topics.`,
            type: 'time-gap',
            priority: Math.min(Math.floor(daysSinceLastStudy / 2), 4) // Priority increases with days since last study
          });
          continue; // Skip to next subject
        }
        
        // 3. If no data exists at all (neither test nor Pomodoro)
        if (!hasPomodoro && !hasTest) {
          newRecommendations.push({
            id: `no-data-${subject}-${Date.now()}`,
            subject,
            recommendation: `No data available for ${subject}. Add a study session or test result to receive recommendations.`,
            type: 'low-frequency',
            priority: 1 // Lowest priority
          });
        }
        
        // If reached here, either:
        // - Test score is good (≥ 50%) AND
        // - Recently studied within 5 days
        // So we don't add a recommendation
      }
      
      // Streak tracking is important so keep this one
      // Only add streak-based recommendations if we have an actual streak going
      
      // 3. Generate recommendations based on Pomodoro study session data
      if (sessions.length > 0) {
        // Analyze study sessions to identify patterns and productivity insights
        const subjectSessionMap: Record<string, { count: number, totalDuration: number, averageDuration: number, bestTime?: Date }> = {};
        
        // Group sessions by subject
        sessions.forEach(session => {
          const subject = session.subject || 'General Study';
          if (!subjectSessionMap[subject]) {
            subjectSessionMap[subject] = {
              count: 0,
              totalDuration: 0,
              averageDuration: 0
            };
          }
          
          // Only count completed sessions
          if (session.completed) {
            subjectSessionMap[subject].count += 1;
            subjectSessionMap[subject].totalDuration += session.duration;
            
            // Track time of day for this session
            const sessionTime = new Date(session.startTime);
            const currentBestTime = subjectSessionMap[subject].bestTime;
            
            // If this session was productive (longer duration), consider its time
            if (!currentBestTime && session.duration >= 25) {
              subjectSessionMap[subject].bestTime = sessionTime;
            } else if (currentBestTime && session.duration > subjectSessionMap[subject].averageDuration) {
              subjectSessionMap[subject].bestTime = sessionTime;
            }
          }
        });
        
        // Calculate averages and find the most productive subject
        let mostProductiveSubject = '';
        let highestAvgDuration = 0;
        
        for (const [subject, data] of Object.entries(subjectSessionMap)) {
          if (data.count > 0) {
            data.averageDuration = Math.round(data.totalDuration / data.count);
            
            // Find the subject with highest average session duration
            if (data.averageDuration > highestAvgDuration) {
              mostProductiveSubject = subject;
              highestAvgDuration = data.averageDuration;
            }
          }
        }
        
        // Add recommendation based on most productive time of day
        if (mostProductiveSubject && subjectSessionMap[mostProductiveSubject].bestTime) {
          const bestTime = subjectSessionMap[mostProductiveSubject].bestTime as Date;
          const hour = bestTime.getHours();
          let timeOfDay = '';
          
          if (hour >= 5 && hour < 12) {
            timeOfDay = 'morning';
          } else if (hour >= 12 && hour < 17) {
            timeOfDay = 'afternoon';
          } else if (hour >= 17 && hour < 21) {
            timeOfDay = 'evening';
          } else {
            timeOfDay = 'night';
          }
          
          // Only add if not already recommending this subject
          if (!newRecommendations.some(rec => rec.subject === mostProductiveSubject)) {
            newRecommendations.push({
              id: `productivity-${mostProductiveSubject}-${Date.now()}`,
              subject: mostProductiveSubject,
              recommendation: `You're most productive studying ${mostProductiveSubject} in the ${timeOfDay}. Try scheduling more focused study blocks during this time for better results.`,
              type: 'study-balance',
              priority: 3
            });
          }
        }
        
        // Find subjects with short average durations (potential focus issues)
        const subjectsWithFocusIssues = Object.entries(subjectSessionMap)
          .filter(([_, data]) => data.count >= 3 && data.averageDuration < 20)
          .map(([subject]) => subject);
          
        if (subjectsWithFocusIssues.length > 0 && !newRecommendations.some(rec => rec.subject === subjectsWithFocusIssues[0])) {
          const subject = subjectsWithFocusIssues[0];
          let recommendation = '';
          
          if (subject === 'Mathematics') {
            recommendation = `Your ${subject} study sessions tend to be shorter than ideal. Try breaking complex problems into steps and work through each one systematically to maintain focus.`;
          } else if (subject === 'Physics') {
            recommendation = `You may be struggling to maintain focus during ${subject} sessions. Try the 'concept-to-calculation' approach: understand the theory first, then immediately apply it to problems.`;
          } else if (subject === 'Chemistry') {
            recommendation = `Your ${subject} Pomodoro sessions are shorter than recommended. Use visual aids like reaction mechanisms and periodic table patterns to keep engaged.`;
          } else {
            recommendation = `You might be having difficulty focusing during ${subject} studies. Try the Pomodoro technique with shorter intervals and take brief breaks to maintain engagement.`;
          }
          
          newRecommendations.push({
            id: `focus-${subject}-${Date.now()}`,
            subject: subject,
            recommendation: recommendation,
            type: 'study-balance',
            priority: 4
          });
        }
      }
      
      // 4. Generate a recommendation based on streak data
      if (streak.current > 0) {
        newRecommendations.push({
          id: `streak-current-${Date.now()}`,
          subject: 'Study Streak',
          recommendation: `Keep up your ${streak.current}-day study streak! You're building great study habits for JEE success.`,
          type: 'streak',
          priority: 2
        });
      } else if (streak.longest > 0) {
        newRecommendations.push({
          id: `streak-longest-${Date.now()}`,
          subject: 'Study Streak',
          recommendation: `You previously reached a ${streak.longest}-day study streak. Can you beat that record? Consistent study is key to JEE success.`,
          type: 'streak',
          priority: 1
        });
      }
      
      // Sort recommendations by priority (highest first)
      newRecommendations.sort((a, b) => b.priority - a.priority);
      
      // Limit to 5 recommendations maximum
      setRecommendations(newRecommendations.slice(0, 5));
    };
    
    generateRecommendations();
  }, [subjectData, streak, testRecords, sessions]);
  
  // Function to manually refresh recommendations
  const refreshRecommendations = () => {
    // Implementation remains the same, just re-run the effect
    const event = new Event('refreshJEERecommendations');
    window.dispatchEvent(event);
  };
  
  return {
    recommendations,
    refreshRecommendations
  };
}
