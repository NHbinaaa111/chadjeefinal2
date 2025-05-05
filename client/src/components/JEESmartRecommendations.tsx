import React, { useState, useEffect } from 'react';
import { useJEERecommendations, TestRecord } from '../hooks/use-jee-recommendations';
import { useStudySessions } from '../hooks/use-study-sessions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { 
  Book, 
  RefreshCw, 
  AlertCircle, 
  Calendar, 
  TrendingUp, 
  Atom, 
  Calculator, 
  FlaskConical, 
  Timer, 
  Gauge, 
  Award,
  FileText,
  Brain,
  Lightbulb,
  BarChart
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';

// Sample test records to demonstrate recommendations
const mockTestRecords: TestRecord[] = []; // We won't use mock data unless user specifically requests it

interface JEESmartRecommendationsProps {
  testRecords?: TestRecord[];
}

export default function JEESmartRecommendations({ testRecords = [] }: JEESmartRecommendationsProps) {
  const { sessions } = useStudySessions();
  const { recommendations, refreshRecommendations } = useJEERecommendations(testRecords);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [filteredRecommendations, setFilteredRecommendations] = useState(recommendations);
  
  // Update filtered recommendations when tab changes or recommendations update
  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredRecommendations(recommendations);
    } else {
      setFilteredRecommendations(recommendations.filter(rec => rec.subject === activeTab));
    }
  }, [activeTab, recommendations]);
  
  if (recommendations.length === 0) {
    return (
      <Card className="border-indigo-700 mb-4 shadow-lg">
        <CardHeader className="pb-2 bg-gradient-to-r from-indigo-900/50 to-purple-900/50">
          <div className="flex justify-between items-center">
            <CardTitle className="text-md font-bold flex items-center text-indigo-300">
              <Brain className="mr-2 h-4 w-4 text-indigo-400" />
              <span>JEE Smart Study Recommendations</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={refreshRecommendations}
              className="h-8 w-8 hover:bg-indigo-800/50"
            >
              <RefreshCw className="h-4 w-4 text-indigo-400" />
            </Button>
          </div>
          <CardDescription className="text-indigo-200/70">
            Start tracking your study sessions and tests to get personalized JEE recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-4 border border-dashed m-4 rounded-lg border-indigo-800/30">
          <FileText className="h-10 w-10 mx-auto text-indigo-400/50 mb-2" />
          <p className="text-indigo-300">No recommendations available</p>
          <p className="text-sm text-indigo-300/70 mt-1">
            Add study sessions and test results to receive personalized study recommendations
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Determine which subjects are present in recommendations
  const subjects = Array.from(new Set(recommendations.map(rec => rec.subject)));
  
  return (
    <Card className="border-indigo-700 mb-4 shadow-lg overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-indigo-900/50 to-purple-900/50">
        <div className="flex justify-between items-center">
          <CardTitle className="text-md font-bold flex items-center text-indigo-300">
            <Lightbulb className="mr-2 h-4 w-4 text-indigo-400" />
            <span>JEE Smart Study Recommendations</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={refreshRecommendations}
            className="h-8 w-8 hover:bg-indigo-800/50"
          >
            <RefreshCw className="h-4 w-4 text-indigo-400" />
          </Button>
        </div>
        <CardDescription className="text-indigo-200/70">
          Personalized recommendations based on your study patterns and test results
        </CardDescription>
      </CardHeader>
      
      {subjects.length > 1 && (
        <div className="px-4 pb-0 pt-2">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-indigo-950/50">
              <TabsTrigger value="all" className="data-[state=active]:bg-indigo-800/50">
                All
              </TabsTrigger>
              {subjects.map(subject => (
                <TabsTrigger 
                  key={subject} 
                  value={subject}
                  className="data-[state=active]:bg-indigo-800/50"
                >
                  {subject}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}
      
      <CardContent className="pt-4">
        <div className="space-y-3">
          {filteredRecommendations.map((rec) => {
            // Determine which icon to use based on subject and recommendation type
            let Icon = Book;
            
            // Icons based on subject
            if (rec.subject === 'Mathematics') {
              Icon = Calculator;
            } else if (rec.subject === 'Physics') {
              Icon = Atom;
            } else if (rec.subject === 'Chemistry') {
              Icon = FlaskConical;
            } else if (rec.subject === 'Study Streak') {
              Icon = Calendar;
            }
            
            // Override with icons based on recommendation type
            if (rec.type === 'time-gap') {
              Icon = Timer;
            } else if (rec.type === 'low-frequency') {
              Icon = AlertCircle;
            } else if (rec.type === 'study-balance') {
              Icon = Gauge;
            } else if (rec.type === 'test-score') {
              Icon = BarChart;
            } else if (rec.type === 'streak') {
              Icon = Award;
            }
            
            // Determine subject-specific styling for JEE context
            let bgColor = "bg-indigo-900/20";
            let borderColor = "border-indigo-800/40";
            let textColor = "text-indigo-300";
            let iconColor = "text-indigo-400";
            let badgeColor = "bg-indigo-900 text-indigo-300";
            
            if (rec.subject === 'Mathematics') {
              bgColor = "bg-blue-900/20";
              borderColor = "border-blue-700/40";
              textColor = "text-blue-300";
              iconColor = "text-blue-400";
              badgeColor = "bg-blue-900 text-blue-300";
            } else if (rec.subject === 'Physics') {
              bgColor = "bg-violet-900/20";
              borderColor = "border-violet-700/40";
              textColor = "text-violet-300";
              iconColor = "text-violet-400";
              badgeColor = "bg-violet-900 text-violet-300";
            } else if (rec.subject === 'Chemistry') {
              bgColor = "bg-green-900/20";
              borderColor = "border-green-700/40";
              textColor = "text-green-300";
              iconColor = "text-green-400";
              badgeColor = "bg-green-900 text-green-300";
            } else if (rec.subject === 'Study Streak') {
              bgColor = "bg-orange-900/20";
              borderColor = "border-orange-700/40";
              textColor = "text-orange-300";
              iconColor = "text-orange-400";
              badgeColor = "bg-orange-900 text-orange-300";
            }
            
            // Determine priority indicator
            const priorityIndicator = [];
            for (let i = 0; i < rec.priority; i++) {
              priorityIndicator.push(
                <span key={i} className={`h-1 w-1 ${iconColor} rounded-full inline-block mx-0.5`}></span>
              );
            }
            
            return (
              <div 
                key={rec.id} 
                className={`${bgColor} p-4 rounded-md border ${borderColor} hover:bg-opacity-30 transition-colors duration-200`}
              >
                <div className="flex justify-between items-start">
                  <div className={`font-semibold text-sm ${textColor} flex items-center`}>
                    <Icon className={`mr-2 h-4 w-4 ${iconColor}`} />
                    <span>{rec.subject}</span>
                    {rec.subTopic && (
                      <Badge className={`ml-2 ${badgeColor} text-xs`}>{rec.subTopic}</Badge>
                    )}
                  </div>
                  <div className="flex items-center">
                    {priorityIndicator}
                  </div>
                </div>
                <div className="text-sm text-gray-300 mt-2 ml-6">{rec.recommendation}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
