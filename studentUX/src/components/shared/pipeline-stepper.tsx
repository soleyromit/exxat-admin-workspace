"use client"

import * as React from "react"
import { Badge } from "../ui/badge"
import { cn } from "../ui/utils"

interface PipelineStep {
  stage: string
  count: number
  status: "active" | "completed" | "rejected"
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  description: string
}

interface PipelineStepperProps {
  steps: PipelineStep[]
  activeStage: string
  onStageClick: (stage: string) => void
  className?: string
}

const formatCount = (count: number) => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return count.toString()
}

export function PipelineStepper({ steps, activeStage, onStageClick, className }: PipelineStepperProps) {
  // Separate main workflow steps from rejected
  const mainSteps = steps.filter(step => step.stage !== "Rejected")
  const rejectedStep = steps.find(step => step.stage === "Rejected")
  
  const getStepStatus = (step: PipelineStep, index: number) => {
    const activeIndex = mainSteps.findIndex(s => s.stage === activeStage)
    
    if (step.stage === activeStage) return "active"
    if (step.stage === "Rejected") return "rejected"
    if (index < activeIndex) return "completed"
    return "pending"
  }

  const getStepStyles = (status: string) => {
    switch (status) {
      case "completed":
        return {
          circle: "bg-chart-2 text-primary-foreground border-chart-2",
          line: "bg-chart-2"
        }
      case "active":
        return {
          circle: "bg-chart-1 text-primary-foreground border-chart-1",
          line: "bg-border"
        }
      case "rejected":
        return {
          circle: "bg-destructive text-destructive-foreground border-destructive",
          line: "bg-destructive"
        }
      default: // pending
        return {
          circle: "bg-background text-muted-foreground border-border",
          line: "bg-border"
        }
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Main Workflow Stepper */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {mainSteps.map((step, index) => {
            const status = getStepStatus(step, index)
            const styles = getStepStyles(status)
            const StepIcon = step.icon
            
            return (
              <React.Fragment key={step.stage}>
                {/* Step */}
                <div className="flex flex-col items-center relative z-10">
                  {/* Step Circle */}
                  <button
                    onClick={() => onStageClick(step.stage)}
                    className={cn(
                      "relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 hover:scale-110",
                      styles.circle,
                      "cursor-pointer"
                    )}
                  >
                    <StepIcon className="h-5 w-5" />
                  </button>
                  
                  {/* Step Label */}
                  <div className="mt-3 text-center min-w-[120px]">
                    <div className="text-sm font-medium text-foreground">
                      {step.stage}
                    </div>
                    <div className="mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {formatCount(step.count)}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 max-w-[100px] mx-auto">
                      {step.description}
                    </div>
                  </div>
                </div>
                
                {/* Connecting Line */}
                {index < mainSteps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-4 relative">
                    <div className="absolute inset-0 bg-border"></div>
                    <div 
                      className={cn(
                        "absolute inset-0 transition-all duration-300",
                        status === "completed" ? styles.line : "bg-border"
                      )}
                    ></div>
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Rejected Branch */}
      {rejectedStep && (
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4">
              {/* Branch Indicator */}
              <div className="text-sm text-muted-foreground">Alternative:</div>
              
              {/* Rejected Step */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onStageClick(rejectedStep.stage)}
                  className={cn(
                    "relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110",
                    getStepStyles("rejected").circle,
                    "cursor-pointer"
                  )}
                >
                  <rejectedStep.icon className="h-4 w-4" />
                </button>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-foreground">
                    {rejectedStep.stage}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {formatCount(rejectedStep.count)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
