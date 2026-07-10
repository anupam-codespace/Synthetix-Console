'use client';

import { useState, useEffect } from 'react';
import { HelpCircle, ChevronRight, X } from 'lucide-react';

interface TourStep {
  title: string;
  description: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to Synthetix Console',
    description: 'A minimal platform for monitoring long-running background jobs, worker node loads, and system logging.',
  },
  {
    title: 'Job Execution & Inspecting',
    description: 'Go to the Jobs page to spawn new runs. Click any run to inspect timeline phases, logs, and failure remediation.',
  },
  {
    title: 'Keyboard Shortcuts & Palette',
    description: 'Press ⌘K (or Ctrl+K) anywhere to trigger commands, and use J / K keys to navigate lists. Press ? for the full reference.',
  },
];

export function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has already completed the tour
    const completed = localStorage.getItem('synthetix_onboarding_completed');
    if (!completed) {
      setIsOpen(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('synthetix_onboarding_completed', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-lg border border-border bg-card p-4 shadow-xl text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase">
          <HelpCircle className="h-4 w-4 text-primary" />
          <span>Quick Tour ({currentStep + 1}/{TOUR_STEPS.length})</span>
        </div>
        <button
          onClick={handleDismiss}
          className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold">{step.title}</h4>
        <p className="text-[11px] leading-relaxed text-muted-foreground">{step.description}</p>

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[10px]">
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground font-medium"
          >
            Skip Tour
          </button>
          
          <button
            onClick={handleNext}
            className="flex items-center gap-0.5 rounded bg-primary px-3 py-1 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <span>{currentStep === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
export default OnboardingTour;
