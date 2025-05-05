import React from 'react';
import { useStreak } from '@/hooks/use-streak-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Book, RefreshCw, AlertCircle, Calendar, TrendingUp, Atom, Calculator, FlaskConical, Timer, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StudyRecommendations() {
  const { recommendations, refreshRecommendations } = useStreak();
  
  if (recommendations.length === 0) {
    return null;
  }
  
  return (
    <Card className="border-indigo-700 mb-4 shadow-lg">
      <CardHeader className="pb-2 bg-gradient-to-r from-indigo-900/50 to-purple-900/50">
        <div className="flex justify-between items-center">
          <CardTitle className="text-md font-bold flex items-center text-indigo-300">
            <Book className="mr-2 h-4 w-4 text-indigo-400" />
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
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {recommendations.map((rec, index) => {
            // Determine which icon to use based on subject and content for JEE-specific recommendations
            let Icon = Book;
            
            // Handle subject-specific icons
            if (rec.subject === 'Mathematics') {
              Icon = Calculator;
            } else if (rec.subject === 'Physics') {
              Icon = Atom;
            } else if (rec.subject === 'Chemistry') {
              Icon = FlaskConical;
            } else if (rec.subject === 'Study Streak') {
              Icon = Calendar;
            } 
            
            // If recommendation is about time management or tracking
            else if (rec.recommendation.includes('days') || rec.recommendation.includes('time')) {
              Icon = Timer;
            } 
            // If recommendation is about balancing or improvement
            else if (rec.recommendation.includes('less frequently') || rec.recommendation.includes('balance')) {
              Icon = Gauge;
            } 
            // If recommendation is about missing practice
            else if (rec.recommendation.includes("haven't studied") || rec.recommendation.includes('needs attention')) {
              Icon = AlertCircle;
            } 
            // If recommendation is about progress or growth
            else if (rec.recommendation.includes('increase') || rec.recommendation.includes('improve')) {
              Icon = TrendingUp;
            }
            
            // Determine subject-specific styling for JEE context
            let bgColor = "bg-indigo-900/20";
            let borderColor = "border-indigo-800/40";
            let textColor = "text-indigo-300";
            let iconColor = "text-indigo-400";
            
            if (rec.subject === 'Mathematics') {
              bgColor = "bg-blue-900/20";
              borderColor = "border-blue-700/40";
              textColor = "text-blue-300";
              iconColor = "text-blue-400";
            } else if (rec.subject === 'Physics') {
              bgColor = "bg-violet-900/20";
              borderColor = "border-violet-700/40";
              textColor = "text-violet-300";
              iconColor = "text-violet-400";
            } else if (rec.subject === 'Chemistry') {
              bgColor = "bg-green-900/20";
              borderColor = "border-green-700/40";
              textColor = "text-green-300";
              iconColor = "text-green-400";
            } else if (rec.subject === 'Study Streak') {
              bgColor = "bg-orange-900/20";
              borderColor = "border-orange-700/40";
              textColor = "text-orange-300";
              iconColor = "text-orange-400";
            }
            
            return (
              <div 
                key={index} 
                className={`${bgColor} p-3 rounded-md border ${borderColor} hover:bg-opacity-30 transition-colors duration-200`}
              >
                <div className={`font-semibold text-sm ${textColor} flex items-center`}>
                  <Icon className={`mr-2 h-4 w-4 ${iconColor}`} />
                  {rec.subject}
                </div>
                <div className="text-sm text-gray-300 mt-1 ml-6">{rec.recommendation}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
