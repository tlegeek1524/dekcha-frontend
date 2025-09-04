import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Send, AlertCircle } from 'lucide-react';

// Constants
const TOTAL_STEPS = 4;
const STEP_FIELDS = [
  {
    title: 'เบอร์โทรศัพท์',
    subtitle: 'กรุณากรอกเบอร์โทรศัพท์ของคุณ',
    fields: [{ key: 'phone', label: 'เบอร์โทรศัพท์', type: 'tel', placeholder: '0912345678', inputMode: 'numeric' }],
  },
  {
    title: 'อีเมล',
    subtitle: 'กรุณากรอกอีเมลของคุณ',
    fields: [{ key: 'email', label: 'อีเมล', type: 'email', placeholder: 'example@email.com' }],
  },
  {
    title: 'ชื่อ - นามสกุล',
    subtitle: 'กรุณากรอกชื่อและนามสกุลของคุณ',
    fields: [
      { key: 'firstName', label: 'ชื่อ', type: 'text', placeholder: 'กรอกชื่อของคุณ' },
      { key: 'lastName', label: 'นามสกุล', type: 'text', placeholder: 'กรอกนามสกุลของคุณ' },
    ],
  },
  {
    title: 'ข้อมูลสถานศึกษา',
    subtitle: 'คุณเรียน/ศึกษาที่ใด',
    fields: [
      { key: 'institution', label: 'สถานศึกษา', type: 'text', placeholder: 'กรอกชื่อสถานศึกษา' },
      { key: 'faculty', label: 'คณะ', type: 'text', placeholder: 'กรอกชื่อคณะ' },
    ],
  },
];

const INITIAL_FORM_DATA = {
  phone: '',
  email: '',
  firstName: '',
  lastName: '',
  institution: '',
  faculty: '',
};

// Component
const MultiStepForm = () => {
  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [slideDirection, setSlideDirection] = useState('');
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewportHeight, setViewportHeight] = useState('100vh');
  
  const containerRef = useRef(null);
  const inputRefs = useRef([]);

  // Validators
  const validators = useMemo(
    () => ({
      phone: (value) => {
        if (!value) return 'กรุณากรอกเบอร์โทรศัพท์';
        if (!/^\d{10}$/.test(value)) return 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก';
        return null;
      },
      email: (value) => {
        if (!value) return 'กรุณากรอกอีเมล';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'รูปแบบอีเมลไม่ถูกต้อง';
        return null;
      },
      firstName: (value) => {
        if (!value) return 'กรุณากรอกชื่อ';
        if (value.length < 2) return 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร';
        return null;
      },
      lastName: (value) => {
        if (!value) return 'กรุณากรอกนามสกุล';
        if (value.length < 2) return 'นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร';
        return null;
      },
      institution: (value) => {
        if (!value) return 'กรุณากรอกชื่อสถานศึกษา';
        if (value.length < 2) return 'ชื่อสถานศึกษาต้องมีอย่างน้อย 2 ตัวอักษร';
        return null;
      },
      faculty: (value) => {
        if (!value) return 'กรุณากรอกชื่อคณะ';
        if (value.length < 2) return 'ชื่อคณะต้องมีอย่างน้อย 2 ตัวอักษร';
        return null;
      },
    }),
    []
  );

  // Setup viewport height handling
  useEffect(() => {
    // Load Google Fonts
    const linkId = 'kanit-font';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.href = 'https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    // Function to update viewport height
    const updateViewportHeight = () => {
      const vh = window.innerHeight;
      setViewportHeight(`${vh}px`);
      
      // Also set CSS variable for fallback
      document.documentElement.style.setProperty('--vh', `${vh * 0.01}px`);
    };

    // Initial setup
    updateViewportHeight();

    // Update on resize and orientation change
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);

    // Update on visualViewport resize (handles keyboard)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
    }

    // Prevent overscroll and ensure full screen
    const preventScroll = (e) => {
      e.preventDefault();
    };

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.top = '0';
    document.body.style.left = '0';
    document.documentElement.style.overflow = 'hidden';
    
    // Prevent pull-to-refresh
    document.body.addEventListener('touchmove', preventScroll, { passive: false });

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewportHeight);
      }
      document.body.removeEventListener('touchmove', preventScroll);
      
      // Reset body styles
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Auto-focus first input
  useEffect(() => {
    if (!slideDirection) {
      const timer = setTimeout(() => {
        const firstInput = inputRefs.current[0];
        if (firstInput && window.innerWidth > 768) {
          firstInput.focus();
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [currentStep, slideDirection]);

  // Handlers
  const handleInputChange = useCallback(
    (field, value) => {
      if (field === 'phone' && !/^\d{0,10}$/.test(value)) return;
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (touched[field]) {
        setErrors((prev) => ({ ...prev, [field]: validators[field](value) }));
      }
    },
    [touched, validators]
  );

  const validateStep = useCallback(() => {
    const fields = STEP_FIELDS[currentStep - 1].fields;
    const stepErrors = {};
    fields.forEach(({ key }) => {
      const error = validators[key](formData[key]);
      if (error) stepErrors[key] = error;
    });
    setErrors(stepErrors);
    setTouched((prev) => ({
      ...prev,
      ...Object.fromEntries(fields.map(({ key }) => [key, true])),
    }));
    return Object.keys(stepErrors).length === 0;
  }, [currentStep, formData, validators]);

  const nextStep = useCallback(() => {
    if (validateStep() && currentStep < TOTAL_STEPS) {
      setSlideDirection('slide-left');
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
        setSlideDirection('');
        inputRefs.current = [];
      }, 200);
    }
  }, [currentStep, validateStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setSlideDirection('slide-right');
      setTimeout(() => {
        setCurrentStep((prev) => prev - 1);
        setSlideDirection('');
        inputRefs.current = [];
      }, 200);
    }
  }, [currentStep]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const allErrors = {};
    Object.keys(formData).forEach((field) => {
      const error = validators[field](formData[field]);
      if (error) allErrors[field] = error;
    });

    setErrors(allErrors);
    setTouched(Object.fromEntries(Object.keys(formData).map((field) => [field, true])));

    if (Object.keys(allErrors).length === 0) {
      const payload = {
        timestamp: new Date().toISOString(),
        data: {
          personalInfo: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
          },
          education: {
            institution: formData.institution,
            faculty: formData.faculty,
          },
        },
        metadata: { formVersion: '1.0', completedSteps: TOTAL_STEPS, submissionSource: 'web' },
      };

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log('=== Form Submission ===\n', JSON.stringify(payload, null, 2));
        alert('ส่งข้อมูลสำเร็จ!');
        setFormData(INITIAL_FORM_DATA);
        setCurrentStep(1);
        setErrors({});
        setTouched({});
      } catch (error) {
        console.error('Submission failed:', error);
        alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
      }
    } else {
      const errorStep = Object.keys(allErrors).reduce((step, field) => {
        if (field === 'phone') return 1;
        if (field === 'email') return 2;
        if (['firstName', 'lastName'].includes(field)) return 3;
        return 4;
      }, 1);
      setCurrentStep(errorStep);
    }

    setIsSubmitting(false);
  }, [formData, isSubmitting, validators]);

  const handleKeyDown = useCallback(
    (e, fieldIndex) => {
      const fields = STEP_FIELDS[currentStep - 1].fields;
      
      if (e.key === 'Enter') {
        e.preventDefault();
        
        if (fieldIndex < fields.length - 1) {
          const nextInput = inputRefs.current[fieldIndex + 1];
          if (nextInput) {
            nextInput.focus();
          }
        } else if (currentStep < TOTAL_STEPS) {
          nextStep();
        } else {
          handleSubmit();
        }
      }
    },
    [currentStep, nextStep, handleSubmit]
  );

  // Render Helpers
  const getInputClassName = useCallback(
    (field) => {
      const hasError = errors[field] && touched[field];
      return `w-full px-4 py-3 text-base text-center rounded-xl bg-white/90 backdrop-blur-sm focus:outline-none focus:shadow-lg border-2 transition-all duration-300 ${
        hasError ? 'border-red-400 focus:border-red-500 bg-red-50/90' : 'border-blue-200 focus:border-blue-500'
      }`;
    },
    [errors, touched]
  );

  const renderError = (field) =>
    errors[field] && touched[field] ? (
      <div className="flex items-center justify-center text-red-500 text-sm mt-2">
        <AlertCircle size={16} className="mr-2" />
        <span>{errors[field]}</span>
      </div>
    ) : null;

  const renderNavigationButtons = () => {
    const buttonClass = 'flex items-center justify-center rounded-full transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95';
    const iconButtonClass = `${buttonClass} w-12 h-12 sm:w-14 sm:h-14`;

    return (
      <div className="flex items-center justify-center space-x-4">
        {currentStep > 1 && (
          <button
            onClick={prevStep}
            disabled={isSubmitting}
            className={`${iconButtonClass} bg-white/90 text-gray-600 border-2 border-gray-200 hover:bg-white hover:text-gray-800`}
            aria-label="ย้อนกลับ"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        {currentStep < TOTAL_STEPS ? (
          <button
            onClick={nextStep}
            disabled={isSubmitting}
            className={`${iconButtonClass} bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700`}
            aria-label="ถัดไป"
          >
            <ChevronRight size={20} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`${buttonClass} px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 text-sm sm:text-base`}
          >
            <Send size={16} className="mr-2" />
            {isSubmitting ? 'กำลังส่ง...' : 'ส่งข้อมูล'}
          </button>
        )}
      </div>
    );
  };

  const currentStepData = STEP_FIELDS[currentStep - 1];
  const progressPercentage = (currentStep / TOTAL_STEPS) * 100;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden"
      style={{ 
        fontFamily: "'Kanit', sans-serif",
        height: viewportHeight,
        minHeight: viewportHeight,
        maxHeight: viewportHeight,
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      <div className="flex flex-col h-full w-full">
        {/* Header */}
        <div className="flex-shrink-0 px-6 pt-6 pb-3">
          <div className="max-w-md mx-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">
                ขั้นตอน {currentStep}/{TOTAL_STEPS}
              </span>
              <span className="text-sm font-semibold text-blue-600">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="w-full bg-white/50 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 flex items-center justify-center px-6 overflow-hidden">
          <div className="w-full max-w-md">
            <div
              className={`transition-all duration-300 ease-out ${
                slideDirection === 'slide-left'
                  ? 'transform -translate-x-full opacity-0'
                  : slideDirection === 'slide-right'
                  ? 'transform translate-x-full opacity-0'
                  : 'transform translate-x-0 opacity-100'
              }`}
            >
              {/* Form Header */}
              <div className="text-center mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                  {currentStepData.title}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 font-light">
                  {currentStepData.subtitle}
                </p>
              </div>

              {/* Form Fields */}
              <div className="space-y-5">
                {currentStepData.fields.map((field, index) => (
                  <div key={field.key}>
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 text-center mb-2">
                      {field.label} <span className="text-red-500">*</span>
                    </label>
                    <input
                      ref={(el) => (inputRefs.current[index] = el)}
                      type={field.type}
                      inputMode={field.inputMode}
                      value={formData[field.key]}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className={getInputClassName(field.key)}
                      placeholder={field.placeholder}
                      disabled={isSubmitting}
                      style={{ 
                        fontFamily: "'Kanit', sans-serif",
                        fontSize: '16px',
                        WebkitAppearance: 'none',
                        appearance: 'none',
                      }}
                      autoComplete="off"
                      autoCapitalize="off"
                      autoCorrect="off"
                    />
                    {renderError(field.key)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="flex-shrink-0 px-6 pb-8 pt-4">
          <div className="max-w-md mx-auto">
            {renderNavigationButtons()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiStepForm;