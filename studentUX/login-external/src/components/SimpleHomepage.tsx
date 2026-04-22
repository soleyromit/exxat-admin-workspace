import { motion } from 'motion/react';
import ExxatOneLogo from '../imports/ExxatOneLogo';
import { FontAwesomeIcon } from './font-awesome-icon';

interface SimpleHomepageProps {
  onBackToSignIn?: () => void;
  userName?: string;
  isFirstTimeUser?: boolean;
}

export default function SimpleHomepage({ onBackToSignIn, userName }: SimpleHomepageProps) {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-white">
      {/* Top Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute top-0 left-0 right-0 h-[72px] border-b border-[#e5e7eb] bg-white z-10"
      >
        <div className="max-w-[1280px] mx-auto h-full px-[40px] flex items-center justify-between">
          <div className="w-[100px] h-[18px]">
            <ExxatOneLogo />
          </div>
          
          <button
            onClick={onBackToSignIn}
            className="h-[40px] px-[20px] rounded-[8px] flex items-center gap-[8px] transition-all hover:bg-gray-50 border border-[#e5e7eb]"
          >
            <FontAwesomeIcon name="arrowRightFromBracket" className="text-[14px] text-black" />
            <span className="font-['Inter'] font-medium text-[14px] text-black">
              Sign Out
            </span>
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="pt-[72px] h-full overflow-auto">
        <div className="max-w-[1280px] mx-auto px-[40px] py-[80px]">
          <div className="flex flex-col gap-[40px] items-center text-center">
            {/* Welcome Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex flex-col gap-[16px]"
            >
              <h1 className="font-['Crimson_Pro'] font-extrabold text-[64px] leading-[72px] text-black">
                Welcome{userName ? `, ${userName}` : ''} to
                <br />
                <span className="bg-clip-text bg-gradient-to-r from-[#fc52a1] via-[#f3d45b] to-[#a4d2f4]" style={{ WebkitTextFillColor: 'transparent' }}>
                  Exxat One
                </span>
              </h1>
              <p className="font-['Inter'] text-[20px] leading-[28px] text-[#6b7280] max-w-[700px] mx-auto">
                You're all set! Explore clinical opportunities, manage your profile, and connect with healthcare institutions.
              </p>
            </motion.div>

            {/* Feature Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-[24px] w-full max-w-[1000px] mt-[40px]"
            >
              {[
                {
                  icon: 'magnifyingGlass',
                  title: 'Find Placements',
                  description: 'Browse and apply to clinical placement opportunities',
                  color: '#fc52a1'
                },
                {
                  icon: 'chartLine',
                  title: 'Track Progress',
                  description: 'Monitor your clinical hours and competencies',
                  color: '#f3d45b'
                },
                {
                  icon: 'users',
                  title: 'Connect',
                  description: 'Network with preceptors and institutions',
                  color: '#a4d2f4'
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.6 }}
                  className="flex flex-col gap-[16px] p-[32px] border border-[#e5e7eb] rounded-[16px] hover:shadow-lg transition-all"
                >
                  <div 
                    className="w-[56px] h-[56px] rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${feature.color}20` }}
                  >
                    <FontAwesomeIcon 
                      name={feature.icon} 
                      className="text-[24px]"
                      style={{ color: feature.color }}
                    />
                  </div>
                  <div className="flex flex-col gap-[8px] text-left">
                    <h3 className="font-['Inter'] font-bold text-[20px] text-black">
                      {feature.title}
                    </h3>
                    <p className="font-['Inter'] text-[14px] leading-[20px] text-[#6b7280]">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex flex-col gap-[16px] items-center mt-[40px]"
            >
              <p className="font-['Inter'] text-[14px] text-[#6b7280]">
                Ready to get started?
              </p>
              <button
                className="h-[56px] px-[32px] rounded-[8px] flex items-center gap-[8px] transition-all hover:opacity-90"
                style={{ backgroundColor: '#39393c' }}
              >
                <span className="font-['Inter'] font-semibold text-[16px] text-white">
                  Explore Opportunities
                </span>
                <FontAwesomeIcon name="arrowRight" className="text-[16px] text-white" />
              </button>
            </motion.div>

            {/* Help Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="mt-[60px] p-[24px] border border-[#e5e7eb] rounded-[12px] bg-[#f9fafb] max-w-[600px]"
            >
              <p className="font-['Inter'] text-[14px] text-[#6b7280]">
                Need help getting started?{' '}
                <button className="text-[#3F51B5] hover:underline font-medium">
                  View our guide
                </button>
                {' '}or{' '}
                <button className="text-[#3F51B5] hover:underline font-medium">
                  contact support
                </button>
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.03, scale: 1 }}
          transition={{ delay: 0.5, duration: 1.5 }}
          className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] bg-gradient-to-br from-[#fc52a1] to-[#f3d45b] rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.03, scale: 1 }}
          transition={{ delay: 0.7, duration: 1.5 }}
          className="absolute -bottom-[200px] -left-[200px] w-[600px] h-[600px] bg-gradient-to-br from-[#a4d2f4] to-[#f3d45b] rounded-full blur-3xl"
        />
      </div>
    </div>
  );
}