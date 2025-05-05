import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/use-auth';
import { testRecordService } from '../services/testRecordService';
import { TestRecord } from '../hooks/use-jee-recommendations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { BarChart2, PieChart as PieChartIcon, TrendingUp, AlertCircle, BookOpen } from 'lucide-react';

// Import Pomodoro session related types & services
import { useStudySessions, StudySession } from '../hooks/use-study-sessions';

// Custom color palette
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F'];
const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: '#8884d8',
  Physics: '#82ca9d',
  Chemistry: '#ffc658',
  'General Study': '#ff8042'
};

export default function JEEAnalytics() {
  const { user } = useAuth();
  const [testRecords, setTestRecords] = useState<TestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { sessions } = useStudySessions();
  
  // Filter for time periods
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year'>('week');
  
  useEffect(() => {
    if (!user?.id) return;
    
    try {
      const records = testRecordService.fetchTestRecords(user.id);
      setTestRecords(records);
    } catch (error) {
      console.error('Error loading test records for analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  // Filter data based on selected time period
  const getFilteredData = (data: any[], dateField: string) => {
    const now = new Date();
    const cutoffDate = new Date();
    
    if (timeFilter === 'week') {
      cutoffDate.setDate(now.getDate() - 7);
    } else if (timeFilter === 'month') {
      cutoffDate.setDate(now.getDate() - 30);
    } else { // year
      cutoffDate.setFullYear(now.getFullYear() - 1);
    }
    
    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= cutoffDate;
    });
  };
  
  // Calculate study hours by subject from Pomodoro sessions
  const getStudyHoursBySubject = () => {
    if (!sessions || sessions.length === 0) {
      return [];
    }
    
    const filteredSessions = getFilteredData(sessions, 'startTime');
    
    // Group and sum durations by subject
    const subjectMap: Record<string, number> = {};
    
    filteredSessions.forEach(session => {
      const subject = session.subject || 'General Study';
      const durationMinutes = session.duration || 0;
      subjectMap[subject] = (subjectMap[subject] || 0) + durationMinutes;
    });
    
    // Convert to hours and format for charts
    return Object.entries(subjectMap).map(([subject, minutes]) => ({
      subject,
      hours: parseFloat((minutes / 60).toFixed(1)),
      color: SUBJECT_COLORS[subject] || COLORS[0]
    }));
  };
  
  // Calculate test score trends over time
  const getTestScoreTrends = () => {
    if (testRecords.length === 0) {
      return [];
    }
    
    const filteredRecords = getFilteredData(testRecords, 'date');
    
    // Group by subject and sort by date (oldest first)
    const groupedBySubject: Record<string, TestRecord[]> = {};
    
    filteredRecords.forEach(record => {
      if (!groupedBySubject[record.subject]) {
        groupedBySubject[record.subject] = [];
      }
      groupedBySubject[record.subject].push(record);
    });
    
    // Create data points for each subject
    const result: any[] = [];
    
    Object.entries(groupedBySubject).forEach(([subject, records]) => {
      // Sort by date (oldest first)
      records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      records.forEach(record => {
        const date = new Date(record.date);
        const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
        const percentage = Math.round((record.score / record.maxScore) * 100);
        
        result.push({
          date: formattedDate,
          subject,
          score: percentage,
          fullDate: record.date // Keep full date for sorting
        });
      });
    });
    
    // Sort by date
    return result.sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
  };
  
  // Identify weak topics from test records' areas of improvement
  const getWeakTopics = () => {
    if (testRecords.length === 0) {
      return [];
    }
    
    const filteredRecords = getFilteredData(testRecords, 'date');
    
    // Create a frequency map of topics mentioned in areas of improvement
    const topicFrequency: Record<string, {count: number, subject: string}> = {};
    
    filteredRecords.forEach(record => {
      if (!record.areasOfImprovement) return;
      
      // Simple extraction of topics - split by common separators and count each topic
      const topics = record.areasOfImprovement
        .split(/[,;.:\n]/) // Split by common separators
        .map((topic: string) => topic.trim())
        .filter((topic: string) => topic.length > 3); // Filter out very short words
      
      topics.forEach((topic: string) => {
        if (!topicFrequency[topic]) {
          topicFrequency[topic] = { count: 0, subject: record.subject };
        }
        topicFrequency[topic].count += 1;
      });
    });
    
    // Convert to array and sort by frequency
    return Object.entries(topicFrequency)
      .map(([topic, { count, subject }]) => ({ topic, count, subject }))
      .sort((a, b) => b.count - a.count) // Sort by count (descending)
      .slice(0, 5); // Top 5 weak topics
  };
  
  // Chart data for study hours
  const studyHoursData = getStudyHoursBySubject();
  
  // Chart data for test score trends
  const testScoreTrendsData = getTestScoreTrends();
  
  // Weak topics data
  const weakTopicsData = getWeakTopics();
  
  // Empty state check
  const hasNoData = (
    (sessions.length === 0 || getStudyHoursBySubject().length === 0) &&
    testRecords.length === 0
  );
  
  if (loading) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-indigo-400" />
            <span>JEE Analytics</span>
          </CardTitle>
          <CardDescription>
            Loading your study analytics...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
        </CardContent>
      </Card>
    );
  }
  
  if (hasNoData) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-indigo-400" />
            <span>JEE Analytics</span>
          </CardTitle>
          <CardDescription>
            Track your JEE preparation with visual analytics
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 border border-dashed m-6 rounded-lg">
          <BookOpen className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">No data available yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Start tracking your study sessions and test results to see analytics here.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-indigo-400" />
          <span>JEE Analytics</span>
        </CardTitle>
        <CardDescription>
          Track your JEE preparation with visual analytics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Tabs defaultValue="week" value={timeFilter} onValueChange={(value) => setTimeFilter(value as 'week' | 'month' | 'year')}>
            <TabsList className="mb-2">
              <TabsTrigger value="week">Last 7 Days</TabsTrigger>
              <TabsTrigger value="month">Last 30 Days</TabsTrigger>
              <TabsTrigger value="year">Last Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subject-wise Study Hours */}
          <div className="border rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-lg mb-4 flex items-center">
              <PieChartIcon className="h-5 w-5 mr-2 text-indigo-400" />
              Subject-wise Study Hours
            </h3>
            {studyHoursData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={studyHoursData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ subject, hours }) => `${subject}: ${hours}h`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="hours"
                    >
                      {studyHoursData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} hours`, 'Study Time']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center border border-dashed rounded-lg">
                <BookOpen className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No study data available for this period.</p>
                <p className="text-sm text-muted-foreground">Complete Pomodoro sessions to track your study time.</p>
              </div>
            )}
          </div>
          
          {/* Test Score Trends */}
          <div className="border rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-lg mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-indigo-400" />
              Test Score Trends
            </h3>
            {testScoreTrendsData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={testScoreTrendsData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} label={{ value: 'Score %', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                    <Legend />
                    {
                      // Get unique subjects
                      Array.from(new Set(testScoreTrendsData.map(item => item.subject))).map((subject, index) => (
                        <Line 
                          key={subject}
                          type="monotone" 
                          dataKey="score" 
                          name={subject} 
                          stroke={SUBJECT_COLORS[subject] || COLORS[index % COLORS.length]}
                          activeDot={{ r: 8 }}
                          connectNulls
                          // Only include data points for this subject
                          data={testScoreTrendsData.filter(item => item.subject === subject)}
                        />
                      ))
                    }
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center border border-dashed rounded-lg">
                <TrendingUp className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No test data available for this period.</p>
                <p className="text-sm text-muted-foreground">Add test results to track your performance over time.</p>
              </div>
            )}
          </div>
          
          {/* Top Weak Topics */}
          <div className="border rounded-lg p-4 shadow-sm lg:col-span-2">
            <h3 className="font-semibold text-lg mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-indigo-400" />
              Top Areas Needing Improvement
            </h3>
            {weakTopicsData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={weakTopicsData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 'dataMax + 1']} />
                    <YAxis type="category" dataKey="topic" width={80} />
                    <Tooltip formatter={(value) => [`${value} mentions`, 'Frequency']} />
                    <Legend />
                    <Bar dataKey="count" name="Frequency" fill="#8884d8">
                      {weakTopicsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SUBJECT_COLORS[entry.subject] || COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center border border-dashed rounded-lg">
                <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No improvement areas identified yet.</p>
                <p className="text-sm text-muted-foreground">Add test results with 'Areas of Improvement' to track your weak topics.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
