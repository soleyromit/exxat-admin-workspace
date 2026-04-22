// This is a temporary file to stage the accordion changes
// The accordion structure for the email step

{step === 'email' && (
  <>
    {/* Accordion Container */}
    <div className="flex flex-col gap-3 w-full">
      {/* Sign In Accordion */}
      <div className="flex flex-col bg-white border border-border rounded-xl overflow-hidden">
        <button 
          onClick={() => setExpandedSection('signin')}
          aria-label="Access all your Exxat products"
          className={`flex items-center justify-between gap-4 p-4 border-0 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:outline-none transition-colors group text-left w-full ${
            expandedSection === 'signin' ? 'bg-[#FCFFF5]' : 'bg-transparent hover:bg-[#F7F5FF]'
          }`}
        >
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-foreground group-hover:text-primary">
              Access all your Exxat products
            </h3>
            <span className="text-[14px] font-medium text-muted-foreground group-hover:text-primary">
              Enter your email or username to sign in
            </span>
          </div>
          <span className="w-8 h-8 rounded-full bg-transparent group-hover:bg-primary flex items-center justify-center transition-colors flex-shrink-0">
            <FontAwesomeIcon name="arrowRight" className="text-[14px] text-primary group-hover:text-white transition-colors" aria-hidden="true" />
          </span>
        </button>

        {/* Expanded Content */}
        {expandedSection === 'signin' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 flex flex-col gap-4">
              {/* Email Input */}
              <div className="w-full flex flex-col gap-2">
                <div className="relative w-full">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center justify-center">
                     <FontAwesomeIcon name="envelope" className="text-lg text-muted-foreground" />
                  </div>
                  <Input
                    type="email"
                    placeholder="Email or username"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className={`${inputClasses} ${
                      emailError 
                        ? 'border-red-500 focus-visible:ring-red-500/20' 
                        : emailValidationState === 'valid' 
                        ? 'border-green-500/50 focus-visible:ring-green-500/20' 
                        : ''
                    }`}
                    autoFocus
                    autoComplete="off"
                  />
                  {emailError ? (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
                    >
                      <FontAwesomeIcon name="circleExclamation" className="text-lg text-red-500" />
                    </motion.div>
                  ) : emailValidationState === 'valid' ? (
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: [0, 1.2, 1], opacity: 1 }}
                      transition={{ 
                        duration: 0.4,
                        times: [0, 0.6, 1],
                        ease: "easeOut"
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
                    >
                      <FontAwesomeIcon name="circleCheck" className="text-lg text-green-500" />
                    </motion.div>
                  ) : null}
                </div>
                {emailError && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-[12px] text-red-500 font-medium"
                  >
                    {emailError}
                  </motion.p>
                )}
              </div>
              
              {/* Continue Button */}
              <Button 
                className="w-full h-[48px] rounded-xl text-[16px] font-medium" 
                variant="primary"
                onClick={handleNextWithValidation}
                disabled={isValidatingEmail}
              >
                {isValidatingEmail ? (
                  <span className="flex items-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="inline-block"
                    >
                      <FontAwesomeIcon name="spinner" className="text-lg" />
                    </motion.span>
                    Validating...
                  </span>
                ) : (
                  'Continue'
                )}
              </Button>
              
              {/* Terms & Conditions */}
              <p className="text-[12px] text-muted-foreground text-center leading-[16px]">
                By continuing, you agree to our{" "}
                <a href="#" className="underline text-muted-foreground hover:text-foreground">
                  Terms of Service
                </a>{" "}
                and that you have read and understood our{" "}
                <a href="#" className="underline text-muted-foreground hover:text-foreground">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Student Accordion */}
      <div className="flex flex-col bg-white border border-border rounded-xl overflow-hidden">
        <button 
          onClick={() => setExpandedSection('student')}
          aria-label="New Student? Join the Exxat One Network"
          className={`flex items-center justify-between gap-4 p-4 border-0 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:outline-none transition-colors group text-left w-full ${
            expandedSection === 'student' ? 'bg-[#FCFFF5]' : 'bg-transparent hover:bg-[#FFF4F9]'
          }`}
        >
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-foreground group-hover:text-primary">
              New Student?
            </h3>
            <span className="text-[14px] font-medium text-muted-foreground group-hover:text-primary">
              Join the Exxat One Network
            </span>
          </div>
          <span className="w-8 h-8 rounded-full bg-transparent group-hover:bg-primary flex items-center justify-center transition-colors flex-shrink-0">
            <FontAwesomeIcon name="arrowRight" className="text-[14px] text-primary group-hover:text-white transition-colors" aria-hidden="true" />
          </span>
        </button>

        {/* Expanded Content */}
        {expandedSection === 'student' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 flex flex-col gap-4">
              {/* Email Input */}
              <div className="w-full flex flex-col gap-2">
                <div className="relative w-full">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center justify-center">
                     <FontAwesomeIcon name="envelope" className="text-lg text-muted-foreground" />
                  </div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className={`${inputClasses} ${
                      emailError 
                        ? 'border-red-500 focus-visible:ring-red-500/20' 
                        : emailValidationState === 'valid' 
                        ? 'border-green-500/50 focus-visible:ring-green-500/20' 
                        : ''
                    }`}
                    autoFocus
                    autoComplete="off"
                  />
                  {emailError ? (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
                    >
                      <FontAwesomeIcon name="circleExclamation" className="text-lg text-red-500" />
                    </motion.div>
                  ) : emailValidationState === 'valid' ? (
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: [0, 1.2, 1], opacity: 1 }}
                      transition={{ 
                        duration: 0.4,
                        times: [0, 0.6, 1],
                        ease: "easeOut"
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
                    >
                      <FontAwesomeIcon name="circleCheck" className="text-lg text-green-500" />
                    </motion.div>
                  ) : null}
                </div>
                {emailError && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-[12px] text-red-500 font-medium"
                  >
                    {emailError}
                  </motion.p>
                )}
              </div>
              
              {/* Continue Button */}
              <Button 
                className="w-full h-[48px] rounded-xl text-[16px] font-medium" 
                variant="primary"
                onClick={() => {
                  setSignupCardType('student');
                  handleNextWithValidation();
                }}
                disabled={isValidatingEmail}
              >
                {isValidatingEmail ? (
                  <span className="flex items-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="inline-block"
                    >
                      <FontAwesomeIcon name="spinner" className="text-lg" />
                    </motion.span>
                    Validating...
                  </span>
                ) : (
                  'Continue'
                )}
              </Button>
              
              {/* Terms & Conditions */}
              <p className="text-[12px] text-muted-foreground text-center leading-[16px]">
                By continuing, you agree to our{" "}
                <a href="#" className="underline text-muted-foreground hover:text-foreground">
                  Terms of Service
                </a>{" "}
                and that you have read and understood our{" "}
                <a href="#" className="underline text-muted-foreground hover:text-foreground">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* School Accordion */}
      <div className="flex flex-col bg-white border border-border rounded-xl overflow-hidden">
        <button 
          onClick={() => setExpandedSection('school')}
          aria-label="New Site or School? Contact Sales"
          className={`flex items-center justify-between gap-4 p-4 border-0 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:outline-none transition-colors group text-left w-full ${
            expandedSection === 'school' ? 'bg-[#FCFFF5]' : 'bg-transparent hover:bg-[#F7F5FF]'
          }`}
        >
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-foreground group-hover:text-primary">
              New Site or School?
            </h3>
            <span className="text-[14px] font-medium text-muted-foreground group-hover:text-primary">
              Contact Sales to access Exxat One and Exxat Prism
            </span>
          </div>
          <span className="w-8 h-8 rounded-full bg-transparent group-hover:bg-primary flex items-center justify-center transition-colors flex-shrink-0">
            <FontAwesomeIcon name="arrowRight" className="text-[14px] text-primary group-hover:text-white transition-colors" aria-hidden="true" />
          </span>
        </button>

        {/* Expanded Content */}
        {expandedSection === 'school' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 flex flex-col gap-4">
              {/* Email Input */}
              <div className="w-full flex flex-col gap-2">
                <div className="relative w-full">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center justify-center">
                     <FontAwesomeIcon name="envelope" className="text-lg text-muted-foreground" />
                  </div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className={`${inputClasses} ${
                      emailError 
                        ? 'border-red-500 focus-visible:ring-red-500/20' 
                        : emailValidationState === 'valid' 
                        ? 'border-green-500/50 focus-visible:ring-green-500/20' 
                        : ''
                    }`}
                    autoFocus
                    autoComplete="off"
                  />
                  {emailError ? (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
                    >
                      <FontAwesomeIcon name="circleExclamation" className="text-lg text-red-500" />
                    </motion.div>
                  ) : emailValidationState === 'valid' ? (
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: [0, 1.2, 1], opacity: 1 }}
                      transition={{ 
                        duration: 0.4,
                        times: [0, 0.6, 1],
                        ease: "easeOut"
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
                    >
                      <FontAwesomeIcon name="circleCheck" className="text-lg text-green-500" />
                    </motion.div>
                  ) : null}
                </div>
                {emailError && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-[12px] text-red-500 font-medium"
                  >
                    {emailError}
                  </motion.p>
                )}
              </div>
              
              {/* Continue Button */}
              <Button 
                className="w-full h-[48px] rounded-xl text-[16px] font-medium" 
                variant="primary"
                onClick={() => {
                  setSignupCardType('school');
                  handleNextWithValidation();
                }}
                disabled={isValidatingEmail}
              >
                {isValidatingEmail ? (
                  <span className="flex items-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="inline-block"
                    >
                      <FontAwesomeIcon name="spinner" className="text-lg" />
                    </motion.span>
                    Validating...
                  </span>
                ) : (
                  'Contact Sales'
                )}
              </Button>
              
              {/* Terms & Conditions */}
              <p className="text-[12px] text-muted-foreground text-center leading-[16px]">
                By continuing, you agree to our{" "}
                <a href="#" className="underline text-muted-foreground hover:text-foreground">
                  Terms of Service
                </a>{" "}
                and that you have read and understood our{" "}
                <a href="#" className="underline text-muted-foreground hover:text-foreground">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  </>
)}
