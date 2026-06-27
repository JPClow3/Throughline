import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { Plant, Palette, Lightning, Compass, CaretRight, Check } from "@phosphor-icons/react";

const steps = [
  {
    title: "Welcome to Throughline",
    description: "A calm, local-first planner designed to help you focus on what matters. Your data stays on your device, and you work at your own pace.",
    icon: <Plant size={48} className="text-primary" weight="duotone" />
  },
  {
    title: "Add your courses",
    description: "Organize your tasks into courses or projects. Assign colors to visually separate your focus areas.",
    icon: <Palette size={48} className="text-primary" weight="duotone" />
  },
  {
    title: "Quick capture",
    description: "Use the command palette or the new task button to quickly capture thoughts and turn them into actionable tasks.",
    icon: <Lightning size={48} className="text-primary" weight="duotone" />
  },
  {
    title: "Explore your flow",
    description: "Switch between Kanban, Goals, Notes, and Timeline views to manage your work the way that makes sense to you.",
    icon: <Compass size={48} className="text-primary" weight="duotone" />
  }
];

export function OnboardingOverlay({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-surface/80 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.05, y: -10 }}
          transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
          className="bg-surface-2 border border-border shadow-xl rounded-3xl max-w-md w-full overflow-hidden flex flex-col"
        >
          <div className="p-8 flex flex-col items-center text-center gap-6 min-h-[320px] justify-center">
            <div className="p-4 bg-surface rounded-full shadow-sm mb-2">
              {steps[currentStep].icon}
            </div>
            <div>
              <h2 className="text-headline-sm font-headline-sm text-on-surface mb-3">{steps[currentStep].title}</h2>
              <p className="text-body-lg text-on-surface-variant max-w-[280px] mx-auto leading-relaxed">{steps[currentStep].description}</p>
            </div>
          </div>
          
          <div className="bg-surface p-6 flex items-center justify-between border-t border-border mt-auto">
            <div className="flex gap-2">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${i === currentStep ? 'w-6 bg-primary' : 'w-2 bg-on-surface-variant/20'}`}
                />
              ))}
            </div>
            <div className="flex gap-3">
              {currentStep < steps.length - 1 && (
                <button 
                  onClick={onComplete}
                  className="px-4 py-2 text-label-lg font-label-lg text-on-surface-variant hover:text-on-surface transition-colors rounded-lg"
                >
                  Skip
                </button>
              )}
              <button
                onClick={handleNext}
                className="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-label-lg text-label-lg flex items-center gap-2 hover:bg-primary/90 interactive-scale shadow-sm"
              >
                {currentStep === steps.length - 1 ? (
                  <>Get started <Check weight="bold" size={18} /></>
                ) : (
                  <>Next <CaretRight weight="bold" size={18} /></>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
