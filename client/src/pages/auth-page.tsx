import * as React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useLocation, Link } from "wouter";
import { Loader2, Home } from "lucide-react";

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const { user, isLoading, login, register } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { toast } = useToast();
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  
  // Register form state
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // State for error/success messages
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Handle login submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoginSubmitting(true);
    
    try {
      console.log('Submitting login form with email:', loginEmail);
      const success = await login(loginEmail, loginPassword);
      
      if (success) {
        console.log('Login successful, redirecting...');
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
      } else {
        console.log('Login failed');
        setLoginError("Invalid email or password");
        toast({
          title: "Login failed",
          description: "Invalid email or password. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("An error occurred. Please try again.");
      toast({
        title: "Login error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoginSubmitting(false);
    }
  };

  // Handle register submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    setIsRegisterSubmitting(true);
    
    try {
      console.log('Submitting registration form with email:', registerEmail);
      const success = await register(registerName, registerEmail, registerPassword);
      
      if (success) {
        console.log('Registration successful, redirecting...');
        toast({
          title: "Registration successful",
          description: "Your account has been created!",
        });
      } else {
        console.log('Registration failed');
        setRegisterError("Registration failed. Email may already be in use.");
        toast({
          title: "Registration failed",
          description: "This email may already be registered. Please try another one.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      setRegisterError("An error occurred. Please try again.");
      toast({
        title: "Registration error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRegisterSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Back to Home Button */}
      <div className="absolute top-4 left-4 z-10">
        <Link href="/">
          <Button variant="outline" size="sm" className="bg-[#121212] border-[#3A3A3A] hover:border-[#00EEFF] hover:bg-[#121212]/80 transition-all">
            <Home className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
      
      {/* Left side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md bg-background/80 backdrop-blur-sm border border-[#3A3A3A]">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {activeTab === "login" ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription className="text-center">
              {activeTab === "login" 
                ? "Enter your credentials to access your account" 
                : "Register to track your JEE preparation journey"}
            </CardDescription>
          </CardHeader>
          <Tabs defaultValue="login" onValueChange={(v) => setActiveTab(v as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLoginSubmit}>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input 
                      id="login-email"
                      type="email" 
                      placeholder="Enter your email"
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginEmail(e.target.value);
                        setLoginError(null);
                      }}
                      className={loginError ? "border-red-500" : ""}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input 
                      id="login-password"
                      type="password" 
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setLoginError(null);
                      }}
                      className={loginError ? "border-red-500" : ""}
                      required
                    />
                  </div>
                  {loginError && (
                    <div className="text-sm text-red-500 font-medium">
                      {loginError}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoginSubmitting}
                  >
                    {isLoginSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : "Log in"}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegisterSubmit}>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name</Label>
                    <Input 
                      id="register-name"
                      type="text" 
                      placeholder="Enter your full name"
                      value={registerName}
                      onChange={(e) => {
                        setRegisterName(e.target.value);
                        setRegisterError(null);
                      }}
                      className={registerError ? "border-red-500" : ""}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input 
                      id="register-email"
                      type="email" 
                      placeholder="Enter your email"
                      value={registerEmail}
                      onChange={(e) => {
                        setRegisterEmail(e.target.value);
                        setRegisterError(null);
                      }}
                      className={registerError ? "border-red-500" : ""}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input 
                      id="register-password"
                      type="password" 
                      placeholder="Create a password"
                      value={registerPassword}
                      onChange={(e) => {
                        setRegisterPassword(e.target.value);
                        setRegisterError(null);
                      }}
                      className={registerError ? "border-red-500" : ""}
                      required
                      minLength={6}
                    />
                  </div>
                  {registerError && (
                    <div className="text-sm text-red-500 font-medium">
                      {registerError}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isRegisterSubmitting}
                  >
                    {isRegisterSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : "Create account"}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
      
      {/* Right side - Hero section */}
      <div className="flex-1 bg-gradient-to-br from-primary/20 to-primary/5 hidden md:flex flex-col items-center justify-center text-center p-8">
        <div className="max-w-md space-y-6">
          <h1 className="text-4xl font-bold tracking-tight">
            Your JEE Preparation Journey Starts Here
          </h1>
          <p className="text-lg text-foreground/70">
            ChadJEE helps you track your progress, manage study time, and stay focused on your goal of cracking the JEE exam.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-[#121212]/70 backdrop-blur-sm p-4 rounded-lg border border-[#3A3A3A]">
              <h3 className="font-semibold text-[#00EEFF]">Track Progress</h3>
              <p className="text-sm text-foreground/70">Monitor your syllabus completion and test performance</p>
            </div>
            <div className="bg-[#121212]/70 backdrop-blur-sm p-4 rounded-lg border border-[#3A3A3A]">
              <h3 className="font-semibold text-[#0FFF50]">Manage Time</h3>
              <p className="text-sm text-foreground/70">Optimize your study hours with pomodoro technique</p>
            </div>
            <div className="bg-[#121212]/70 backdrop-blur-sm p-4 rounded-lg border border-[#3A3A3A]">
              <h3 className="font-semibold text-[#5E17EB]">Set Goals</h3>
              <p className="text-sm text-foreground/70">Plan weekly and monthly targets to stay motivated</p>
            </div>
            <div className="bg-[#121212]/70 backdrop-blur-sm p-4 rounded-lg border border-[#3A3A3A]">
              <h3 className="font-semibold text-[#00EEFF]">Analyze Performance</h3>
              <p className="text-sm text-foreground/70">Gain insights from your study sessions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}