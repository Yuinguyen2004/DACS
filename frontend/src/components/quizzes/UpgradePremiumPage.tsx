"use client";

import { useState, useEffect, useRef } from "react";
import {
  CheckCircle,
  Crown,
  Zap,
  BarChart,
  BookOpen,
  MessageSquare,
  ShieldCheck,
  Award,
  LockOpen,
  XCircle,
  Home,
  TrendingUp,
  Trophy,
  User,
} from "lucide-react";
import { gsap } from 'gsap';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { User as UserType, Package } from "../../types/types";
import { authAPI, packageAPI } from "../../services/api";

export default function UpgradePremiumPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [currentPackage, setCurrentPackage] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  
  // GSAP refs
  const containerRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const benefitsRef = useRef<HTMLDivElement>(null);
  const plansRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Get current user
        const currentUser = authAPI.getCurrentUser();
        setUser(currentUser);

        // Get all packages
        const allPackages = await packageAPI.getAllPackages();
        setPackages(allPackages);

        // If user has a package, find their current package
        if (
          currentUser?.package_id &&
          typeof currentUser.package_id === "string"
        ) {
          const userPackage = allPackages.find(
            (pkg) => pkg._id === currentUser.package_id
          );
          setCurrentPackage(userPackage || null);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // GSAP animations after loading
  useEffect(() => {
    if (!loading && containerRef.current) {
      const tl = gsap.timeline();
      
      // Set initial states
      gsap.set(['.hero-section', '.benefits-section', '.plans-section', '.table-section', '.cta-section'], {
        opacity: 0,
        y: 50
      });

      gsap.set('.crown-icon', {
        opacity: 0,
        scale: 0,
        rotation: -180
      });

      gsap.set('.benefit-item', {
        opacity: 0,
        x: -30,
        scale: 0.9
      });

      gsap.set('.plan-card', {
        opacity: 0,
        y: 30,
        scale: 0.95
      });

      gsap.set('.table-row', {
        opacity: 0,
        x: -20
      });

      // Animate in sequence
      tl.to('.hero-section', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out"
      })
      .to('.crown-icon', {
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: 0.6,
        ease: "back.out(1.5)"
      }, "-=0.3")
      .to('.benefits-section', {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out"
      }, "-=0.2")
      .to('.benefit-item', {
        opacity: 1,
        x: 0,
        scale: 1,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out"
      }, "-=0.3")
      .to('.plans-section', {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out"
      }, "-=0.2")
      .to('.plan-card', {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        stagger: 0.15,
        ease: "back.out(1.2)"
      }, "-=0.3")
      .to('.table-section', {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out"
      }, "-=0.2")
      .to('.table-row', {
        opacity: 1,
        x: 0,
        duration: 0.3,
        stagger: 0.05,
        ease: "power2.out"
      }, "-=0.3")
      .to('.cta-section', {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out"
      }, "-=0.2");
    }
  }, [loading]);

  // Button click animations
  const handleButtonClick = (element: HTMLElement) => {
    gsap.to(element, {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut"
    });
  };

  // Card hover animations
  const handleCardHover = (element: HTMLElement, isHovering: boolean) => {
    gsap.to(element, {
      y: isHovering ? -8 : 0,
      scale: isHovering ? 1.02 : 1,
      boxShadow: isHovering ? "0 20px 60px rgba(0,0,0,0.15)" : "0 8px 24px rgba(0,0,0,0.08)",
      duration: 0.3,
      ease: "power2.out"
    });
  };

  // Crown float animation
  useEffect(() => {
    const crownElements = document.querySelectorAll('.crown-float');
    crownElements.forEach((crown) => {
      gsap.to(crown, {
        y: -10,
        duration: 2,
        yoyo: true,
        repeat: -1,
        ease: "power2.inOut"
      });
    });

    // Add continuous glow effect to main hero crown
    const heroCrown = document.querySelector('.hero-crown');
    if (heroCrown) {
      gsap.to(heroCrown, {
        boxShadow: "0 0 20px rgba(251, 146, 60, 0.5)",
        duration: 2,
        yoyo: true,
        repeat: -1,
        ease: "power2.inOut"
      });
    }
  }, [loading]);

  // Benefit icon hover
  const handleBenefitHover = (element: HTMLElement, isHovering: boolean) => {
    gsap.to(element.querySelector('.benefit-icon'), {
      scale: isHovering ? 1.2 : 1,
      rotation: isHovering ? 10 : 0,
      duration: 0.3,
      ease: "back.out(1.5)"
    });
  };

  const isPremiumUser = currentPackage && currentPackage.price > 0;
  const availableUpgrades = packages.filter(
    (pkg) =>
      pkg.price > 0 && (!currentPackage || pkg.price > currentPackage.price)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            Loading your membership details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 p-4 sm:p-6 lg:p-8">
      <main className="max-w-4xl mx-auto space-y-10">
        {isPremiumUser ? (
          /* State: User already has Premium - show upgrade options */
          <>
            <Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-blue-400 rounded-full flex items-center justify-center mb-4">
                  <Crown className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-4xl font-extrabold text-gray-900 mb-3">
                  Welcome Back, Premium Member!
                </CardTitle>
                <CardDescription className="text-xl text-gray-700 max-w-2xl mx-auto">
                  You're currently on the{" "}
                  <strong>{currentPackage?.name}</strong> plan.
                  {availableUpgrades.length > 0
                    ? " Upgrade to unlock even more features and benefits!"
                    : " You're already on our highest tier!"}
                </CardDescription>
                <div className="mt-4 p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Current Plan:</strong> {currentPackage?.name} - $
                    {currentPackage?.price}/month
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Benefits:</strong> {currentPackage?.Benefit}
                  </p>
                </div>
              </CardHeader>
            </Card>

            {availableUpgrades.length > 0 ? (
              /* Show available upgrades */
              <>
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold text-gray-900">
                      Upgrade Your Plan
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Take your learning experience to the next level with these
                      premium plans.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                    {availableUpgrades.map((pkg) => (
                      <Card
                        key={pkg._id}
                        className="relative border-2 border-orange-200 hover:border-orange-400 transition-colors"
                      >
                        <CardHeader className="text-center pb-4">
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <Badge className="bg-gradient-to-r from-orange-400 to-pink-400 text-white px-3 py-1">
                              UPGRADE
                            </Badge>
                          </div>
                          <CardTitle className="text-2xl font-bold text-gray-900 mt-2">
                            {pkg.name}
                          </CardTitle>
                          <div className="text-4xl font-extrabold text-orange-600">
                            ${pkg.price}
                            <span className="text-lg text-gray-500 font-normal">
                              /month
                            </span>
                          </div>
                          <CardDescription className="text-gray-600">
                            Duration: {pkg.Duration} days
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="text-center mb-6">
                            <p className="text-gray-700">{pkg.Benefit}</p>
                          </div>
                          <Link to={`/payment/${pkg._id}`}>
                            <Button className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg transition-all duration-300">
                              <TrendingUp className="w-5 h-5 mr-2" />
                              Upgrade Now
                            </Button>
                          </Link>
                          <p className="text-xs text-gray-500 text-center mt-2">
                            Your current benefits will be retained
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>

                {/* Current Benefits Section */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      Your Current Premium Benefits
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      You already enjoy these amazing features with your{" "}
                      {currentPackage?.name} plan.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          Detailed Explanations
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Understand every answer with in-depth explanations for
                          all questions.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <BarChart className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          Advanced Analytics
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Track your progress, identify weak areas, and see
                          performance trends.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <LockOpen className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          Unlimited Access
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Enjoy unlimited attempts on all quizzes, including
                          premium content.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          Priority Support
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Get faster responses and dedicated assistance from our
                          support team.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          Ad-Free Experience
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Focus purely on learning without any interruptions
                          from advertisements.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <Award className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          Exclusive Content
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Access special quizzes and learning modules available
                          only to Premium members.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              /* User is on highest tier */
              <Card className="text-center border-0 shadow-lg bg-gradient-to-r from-green-50 to-blue-50">
                <CardContent className="py-12">
                  <div className="mx-auto w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mb-6">
                    <Trophy className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    You're at the Top!
                  </h2>
                  <p className="text-lg text-gray-700 mb-6">
                    Congratulations! You're already enjoying our highest-tier
                    premium plan with all available features.
                  </p>
                  <Link to="/homepage">
                    <Button className="h-14 px-10 text-lg font-semibold bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1">
                      <BookOpen className="w-5 h-5 mr-3" />
                      Continue Learning
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Thank you section */}
            <Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="py-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Thank You for Being a Premium Member!
                </h2>
                <p className="text-gray-700 mb-6">
                  Your support helps us create better learning experiences for
                  everyone.
                </p>
                <div className="flex justify-center space-x-4">
                  <Link to="/homepage">
                    <Button variant="outline" className="h-12 px-6">
                      <Home className="w-4 h-4 mr-2" />
                      Back to Quizzes
                    </Button>
                  </Link>
                  <Link to="/profile">
                    <Button variant="outline" className="h-12 px-6">
                      <User className="w-4 h-4 mr-2" />
                      Manage Account
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          /* State: User has not purchased Premium */
          <>
            {/* Hero Section */}
            <Card className="hero-section text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm" onMouseEnter={(e) => handleCardHover(e.currentTarget, true)} onMouseLeave={(e) => handleCardHover(e.currentTarget, false)}>
              <CardHeader className="pb-6">
                <div className="hero-crown mx-auto w-20 h-20 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full flex items-center justify-center mb-4">
                  <Crown className="crown-icon crown-float w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-4xl font-extrabold text-gray-900 mb-3">
                  Unlock Your Full Learning Potential
                </CardTitle>
                <CardDescription className="text-xl text-gray-700 max-w-2xl mx-auto">
                  Go Premium with Quizz to access exclusive features, detailed
                  insights, and an ad-free experience.
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-8">
                <Link to="/payment">
                  <Button 
                    className="h-14 px-10 text-lg font-semibold bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1"
                    onClick={(e) => {
                      e.preventDefault()
                      handleButtonClick(e.currentTarget)
                      setTimeout(() => window.location.href = '/payment', 150)
                    }}
                  >
                    <Zap className="w-5 h-5 mr-3" />
                    Upgrade to Premium Now
                  </Button>
                </Link>
                <p className="text-sm text-gray-500 mt-4">
                  Starting at just $9.99/month • Cancel anytime
                </p>
              </CardContent>
            </Card>

            {/* Premium Benefits Section */}
            <Card className="benefits-section border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold text-gray-900">
                  Why Go Premium?
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Elevate your quiz experience with these powerful features.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                <div 
                  className="benefit-item flex items-start space-x-4"
                  onMouseEnter={(e) => handleBenefitHover(e.currentTarget, true)}
                  onMouseLeave={(e) => handleBenefitHover(e.currentTarget, false)}
                >
                  <div className="benefit-icon flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      Detailed Explanations
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Understand every answer with in-depth explanations for all
                      questions.
                    </p>
                  </div>
                </div>
                <div 
                  className="benefit-item flex items-start space-x-4"
                  onMouseEnter={(e) => handleBenefitHover(e.currentTarget, true)}
                  onMouseLeave={(e) => handleBenefitHover(e.currentTarget, false)}
                >
                  <div className="benefit-icon flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <BarChart className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      Advanced Analytics
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Track your progress, identify weak areas, and see
                      performance trends.
                    </p>
                  </div>
                </div>
                <div 
                  className="benefit-item flex items-start space-x-4"
                  onMouseEnter={(e) => handleBenefitHover(e.currentTarget, true)}
                  onMouseLeave={(e) => handleBenefitHover(e.currentTarget, false)}
                >
                  <div className="benefit-icon flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <LockOpen className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      Unlimited Access
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Enjoy unlimited attempts on all quizzes, including premium
                      content.
                    </p>
                  </div>
                </div>
                <div 
                  className="benefit-item flex items-start space-x-4"
                  onMouseEnter={(e) => handleBenefitHover(e.currentTarget, true)}
                  onMouseLeave={(e) => handleBenefitHover(e.currentTarget, false)}
                >
                  <div className="benefit-icon flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      Priority Support
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Get faster responses and dedicated assistance from our
                      support team.
                    </p>
                  </div>
                </div>
                <div 
                  className="benefit-item flex items-start space-x-4"
                  onMouseEnter={(e) => handleBenefitHover(e.currentTarget, true)}
                  onMouseLeave={(e) => handleBenefitHover(e.currentTarget, false)}
                >
                  <div className="benefit-icon flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      Ad-Free Experience
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Focus purely on learning without any interruptions from
                      advertisements.
                    </p>
                  </div>
                </div>
                <div 
                  className="benefit-item flex items-start space-x-4"
                  onMouseEnter={(e) => handleBenefitHover(e.currentTarget, true)}
                  onMouseLeave={(e) => handleBenefitHover(e.currentTarget, false)}
                >
                  <div className="benefit-icon flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Award className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      Exclusive Content
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Access special quizzes and learning modules available only
                      to Premium members.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature Comparison Table */}
            <Card className="table-section border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold text-gray-900">
                  Compare Plans
                </CardTitle>
                <CardDescription className="text-gray-600">
                  See how Premium enhances your learning journey.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="table-row bg-gray-50">
                        <TableHead className="w-[200px] text-gray-700 font-semibold">
                          Feature
                        </TableHead>
                        <TableHead className="text-center text-gray-700 font-semibold">
                          Free
                        </TableHead>
                        <TableHead className="text-center text-gray-700 font-semibold">
                          <Badge className="bg-gradient-to-r from-orange-400 to-pink-400 text-white text-sm px-3 py-1">
                            Premium
                          </Badge>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="table-row">
                        <TableCell className="font-medium text-gray-800">
                          Quiz Attempts
                        </TableCell>
                        <TableCell className="text-center text-gray-600">
                          Limited
                        </TableCell>
                        <TableCell className="text-center text-green-600 font-medium">
                          Unlimited
                        </TableCell>
                      </TableRow>
                      <TableRow className="table-row">
                        <TableCell className="font-medium text-gray-800">
                          Detailed Explanations
                        </TableCell>
                        <TableCell className="text-center text-red-600">
                          <XCircle className="w-5 h-5 mx-auto" />
                        </TableCell>
                        <TableCell className="text-center text-green-600">
                          <CheckCircle className="w-5 h-5 mx-auto" />
                        </TableCell>
                      </TableRow>
                      <TableRow className="table-row">
                        <TableCell className="font-medium text-gray-800">
                          Advanced Analytics
                        </TableCell>
                        <TableCell className="text-center text-red-600">
                          <XCircle className="w-5 h-5 mx-auto" />
                        </TableCell>
                        <TableCell className="text-center text-green-600">
                          <CheckCircle className="w-5 h-5 mx-auto" />
                        </TableCell>
                      </TableRow>
                      <TableRow className="table-row">
                        <TableCell className="font-medium text-gray-800">
                          Ad-Free Experience
                        </TableCell>
                        <TableCell className="text-center text-red-600">
                          <XCircle className="w-5 h-5 mx-auto" />
                        </TableCell>
                        <TableCell className="text-center text-green-600">
                          <CheckCircle className="w-5 h-5 mx-auto" />
                        </TableCell>
                      </TableRow>
                      <TableRow className="table-row">
                        <TableCell className="font-medium text-gray-800">
                          Exclusive Quizzes
                        </TableCell>
                        <TableCell className="text-center text-red-600">
                          <XCircle className="w-5 h-5 mx-auto" />
                        </TableCell>
                        <TableCell className="text-center text-green-600">
                          <CheckCircle className="w-5 h-5 mx-auto" />
                        </TableCell>
                      </TableRow>
                      <TableRow className="table-row">
                        <TableCell className="font-medium text-gray-800">
                          Priority Support
                        </TableCell>
                        <TableCell className="text-center text-red-600">
                          <XCircle className="w-5 h-5 mx-auto" />
                        </TableCell>
                        <TableCell className="text-center text-green-600">
                          <CheckCircle className="w-5 h-5 mx-auto" />
                        </TableCell>
                      </TableRow>
                      <TableRow className="table-row">
                        <TableCell className="font-medium text-gray-800">
                          Quiz History
                        </TableCell>
                        <TableCell className="text-center text-green-600">
                          <CheckCircle className="w-5 h-5 mx-auto" />
                        </TableCell>
                        <TableCell className="text-center text-green-600">
                          <CheckCircle className="w-5 h-5 mx-auto" />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Final Call to Action */}
            <Card className="cta-section text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm" onMouseEnter={(e) => handleCardHover(e.currentTarget, true)} onMouseLeave={(e) => handleCardHover(e.currentTarget, false)}>
              <CardContent className="py-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Ready to Master Your Knowledge?
                </h2>
                <p className="text-lg text-gray-700 mb-6">
                  Join thousands of learners who are already accelerating their
                  progress with Quizz Premium.
                </p>
                <Link to="/payment">
                  <Button 
                    className="h-14 px-10 text-lg font-semibold bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1"
                    onClick={(e) => {
                      e.preventDefault()
                      handleButtonClick(e.currentTarget)
                      setTimeout(() => window.location.href = '/payment', 150)
                    }}
                  >
                    <Crown className="w-5 h-5 mr-3" />
                    Upgrade to Premium Today!
                  </Button>
                </Link>
                <p className="text-sm text-gray-500 mt-4">
                  Secure payment via Stripe • 7-day money-back guarantee
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
