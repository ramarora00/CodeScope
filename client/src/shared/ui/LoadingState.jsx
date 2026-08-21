import { cn } from '../utils/classNames';
import React, { useState, useEffect } from 'react';
import { StatusBlock } from './EnterpriseBlocks';

export function LoadingState({
  className,
  message,
  detail,
  size = 'md',
}) {
  const [activeStep, setActiveStep] = useState(0);

  const defaultSteps = [
    "Reading routes...",
    "Resolving imports...",
    "Tracing execution...",
    "Building graph...",
    "Discovering symbols...",
    "Embedding repository...",
    "Checking references...",
    "Preparing response..."
  ];

  const steps = message ? [message] : defaultSteps;

  useEffect(() => {
    if (steps.length <= 1) return;
    
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1 < steps.length ? prev + 1 : prev));
    }, 1200);

    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className={cn("flex flex-col gap-2 max-w-sm w-full mx-auto", className)}>
      {steps.slice(0, activeStep + 1).map((step, idx) => {
        const isCurrent = idx === activeStep;
        return (
          <StatusBlock 
            key={idx}
            status={isCurrent && idx < steps.length - 1 ? 'loading' : 'success'} 
            message={step} 
          />
        );
      })}
    </div>
  );
}
