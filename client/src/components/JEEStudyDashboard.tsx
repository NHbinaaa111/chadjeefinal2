import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { testRecordService } from '@/services/testRecordService';
import { TestRecord } from '@/hooks/use-jee-recommendations';
import JEESmartRecommendations from './JEESmartRecommendations';
import TestRecordsList from './TestRecordsList';
import JEEAnalytics from './JEEAnalytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, FileText, PieChart, BookOpen, BarChart2 } from 'lucide-react';

export default function JEEStudyDashboard() {
  const { user } = useAuth();
  const [testRecords, setTestRecords] = useState<TestRecord[]>([]);
  const [activeTab, setActiveTab] = useState('recommendations');
  
  // Load test records for recommendations
  useEffect(() => {
    if (!user?.id) return;
    
    try {
      const records = testRecordService.fetchTestRecords(user.id);
      setTestRecords(records);
    } catch (error) {
      console.error('Error loading test records for recommendations:', error);
    }
  }, [user]);
  
  // Handle refresh when test records are added or removed
  const handleTestRecordsUpdated = () => {
    if (!user?.id) return;
    
    try {
      const records = testRecordService.fetchTestRecords(user.id);
      setTestRecords(records);
    } catch (error) {
      console.error('Error refreshing test records:', error);
    }
  };
  
  return (
    <div className="container px-4 py-6 mx-auto">
      <div className="flex flex-col w-full">
        <h2 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-indigo-400" />
          <span>JEE Study Dashboard</span>
        </h2>
        
        {/* Smart Recommendations Section */}
        <div className="mb-6">
          <JEESmartRecommendations testRecords={testRecords} />
        </div>
        
        {/* Tabs Section */}
        <Tabs defaultValue="records" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="records" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>Test Records</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1">
              <PieChart className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="records">
            <TestRecordsList />
          </TabsContent>
          
          <TabsContent value="analytics">
            <JEEAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
