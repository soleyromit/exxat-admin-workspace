import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Home, 
  Briefcase, 
  Building2, 
  FileText, 
  Settings,
  Menu,
  X,
  Search,
  Bell,
  ChevronRight,
  MapPin,
  Clock,
  TrendingUp,
  Target,
  BookmarkPlus,
  GraduationCap,
  Star
} from 'lucide-react';
import { jobInterviewImage as imgJobInterview, houseImage as imgHouse, containerImage as imgContainer } from '../assets/images';

interface NavItem {
  icon: React.ElementType;
  label: string;
  active?: boolean;
}

interface JobCard {
  title: string;
  company: string;
  location: string;
  type: string;
  posted: string;
  salary: string;
  match: number;
  image?: string;
}

interface ActionCard {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
}

export default function FtuHomepage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems: NavItem[] = [
    { icon: Home, label: 'Home', active: true },
    { icon: Briefcase, label: 'Jobs', active: false },
    { icon: Building2, label: 'Companies', active: false },
    { icon: FileText, label: 'Applications', active: false },
    { icon: Settings, label: 'Settings', active: false },
  ];

  const featuredJobs: JobCard[] = [
    {
      title: 'Physical Therapist',
      company: 'City Medical Center',
      location: 'Los Angeles, CA',
      type: 'Full-time',
      posted: '2 days ago',
      salary: '$85k - $105k',
      match: 95,
      image: imgJobInterview,
    },
    {
      title: 'Senior PT Specialist',
      company: 'Healthcare Plus',
      location: 'San Francisco, CA',
      type: 'Full-time',
      posted: '1 week ago',
      salary: '$90k - $115k',
      match: 88,
      image: imgHouse,
    },
    {
      title: 'Pediatric Physical Therapist',
      company: 'Children\'s Hospital',
      location: 'San Diego, CA',
      type: 'Part-time',
      posted: '3 days ago',
      salary: '$75k - $95k',
      match: 92,
      image: imgContainer,
    },
  ];

  const actionCards: ActionCard[] = [
    {
      icon: Target,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600',
      title: 'Set Your Specialty Goals',
      description: '3 steps remaining',
    },
    {
      icon: BookmarkPlus,
      iconBg: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      title: 'Start Exploring Job Matches',
      description: 'See what roles align with your interests',
    },
    {
      icon: GraduationCap,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      title: 'Browse Active Placement Opportunities',
      description: 'Find your next clinical rotation',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/40 via-purple-50/20 to-pink-50/30 overflow-x-hidden">
      {/* Sidebar - Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? '240px' : '80px' }}
        className="hidden lg:flex fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex-col z-30 transition-all duration-300"
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200 px-4">
          {isSidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="font-bold text-lg">Exxat One</span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item, idx) => (
            <motion.button
              key={item.label}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                item.active
                  ? 'bg-pink-50 text-pink-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {isSidebarOpen && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
            </motion.button>
          ))}
        </nav>

        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-4 border-t border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ChevronRight
            className={`w-5 h-5 text-gray-600 transition-transform ${
              isSidebarOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </motion.aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <span className="font-bold text-lg">Exxat One</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="lg:hidden fixed top-16 left-0 right-0 bg-white border-b border-gray-200 z-30 p-4"
        >
          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.label}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  item.active
                    ? 'bg-pink-50 text-pink-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
        </motion.div>
      )}

      {/* Main Content */}
      <main
        className={`
          transition-all duration-300
          lg:ml-0
          ${isSidebarOpen ? 'lg:ml-[240px]' : 'lg:ml-[80px]'}
          pt-16 lg:pt-0
        `}
      >
        {/* Top Bar - Desktop Only */}
        <div className="hidden lg:flex h-16 bg-white border-b border-gray-200 items-center justify-between px-8">
          <div className="flex items-center gap-4 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs, companies, or skills..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-pink-600 rounded-full"></span>
            </button>
            <div className="w-9 h-9 bg-pink-100 rounded-full flex items-center justify-center">
              <span className="text-pink-600 font-semibold text-sm">SC</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Welcome Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-6 md:p-8 mb-8 text-white relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Welcome back, Sarah! 👋
              </h1>
              <p className="text-pink-100 mb-4">
                You have 3 new job matches and 2 application updates
              </p>
              <div className="flex flex-wrap gap-3">
                <button className="px-6 py-2 bg-white text-pink-600 rounded-lg font-medium hover:bg-pink-50 transition-colors">
                  View Matches
                </button>
                <button className="px-6 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-white/30 transition-colors">
                  Complete Profile
                </button>
              </div>
            </div>
          </motion.div>

          {/* Profile Completion Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-gray-200 p-6 mb-8"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-1">
                  Complete Your Profile
                </h3>
                <p className="text-sm text-gray-600">
                  75% complete • 2 steps remaining
                </p>
              </div>
              <div className="relative w-16 h-16">
                <svg className="transform -rotate-90" width="64" height="64">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#e5e7eb"
                    strokeWidth="6"
                    fill="none"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#ec4899"
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray="176"
                    strokeDashoffset="44"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-bold text-sm text-gray-900">75%</span>
                </div>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full mb-4">
              <div className="h-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full w-3/4"></div>
            </div>
            <button className="text-pink-600 font-medium text-sm hover:text-pink-700 transition-colors">
              Continue Setup →
            </button>
          </motion.div>

          {/* Featured Jobs Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                  Featured Job Matches
                </h2>
                <p className="text-gray-600 text-sm">
                  Handpicked opportunities based on your profile
                </p>
              </div>
              <button className="text-pink-600 font-medium text-sm hover:text-pink-700 transition-colors hidden md:block">
                View All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredJobs.map((job, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                >
                  {/* Job Image */}
                  <div className="h-40 bg-gradient-to-br from-pink-100 to-purple-100 relative overflow-hidden">
                    {job.image && (
                      <img
                        src={job.image}
                        alt={job.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-xs font-semibold text-pink-600 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-pink-600" />
                      {job.match}% Match
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="p-5">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1 group-hover:text-pink-600 transition-colors">
                      {job.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">{job.company}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        {job.type} • {job.posted}
                      </div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        {job.salary}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors text-sm">
                        Apply Now
                      </button>
                      <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <BookmarkPlus className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* My Space Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                <span className="text-2xl">✨</span>
                My Space
              </h2>
              <p className="text-gray-600 text-sm">
                Everything you need to get started and grow – all in one place
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {actionCards.map((card, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div
                    className={`w-12 h-12 ${card.iconBg} rounded-full flex items-center justify-center mb-4`}
                  >
                    <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-pink-600 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">{card.description}</p>
                  <button className="text-pink-600 font-medium text-sm hover:text-pink-700 transition-colors flex items-center gap-1">
                    Get Started
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { label: 'Applications', value: '12', change: '+3 this week' },
              { label: 'Saved Jobs', value: '28', change: '+5 new' },
              { label: 'Profile Views', value: '156', change: '+23 this week' },
              { label: 'Interviews', value: '4', change: '2 upcoming' },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all"
              >
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </p>
                <p className="text-xs text-green-600">{stat.change}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  );
}