import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  Activity,
  Search,
  TextSearch,
  Brain,
  Pen,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ProcessedEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ActivityTimelineProps {
  processedEvents: ProcessedEvent[];
  isLoading: boolean;
}

// TODO: ActivityTimeline Component Enhancements
// 1. Add support for different event types with custom icons and formatting
// 2. Implement event filtering and search functionality
// 3. Add timeline export capabilities (JSON, CSV, etc.)
// 4. Implement event grouping by time periods or tool types
// 5. Add performance metrics display (execution time, token usage)
// 6. Implement real-time event streaming with better visual feedback
// 7. Add event details modal/popup for complex events
// 8. Implement timeline replay functionality
// 9. Add accessibility improvements (ARIA labels, keyboard navigation)
// 10. Consider adding timeline themes/customization options

export function ActivityTimeline({
  processedEvents,
  isLoading,
}: ActivityTimelineProps) {
  const [isTimelineCollapsed, setIsTimelineCollapsed] =
    useState<boolean>(false);
    
  const getEventIcon = (title: string, index: number) => {
    if (index === 0 && isLoading && processedEvents.length === 0) {
      return <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />;
    }
    if (title.toLowerCase().includes("generating")) {
      return <TextSearch className="h-4 w-4 text-muted-foreground" />;
    } else if (title.toLowerCase().includes("thinking")) {
      return <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />;
    } else if (title.toLowerCase().includes("reflection")) {
      return <Brain className="h-4 w-4 text-muted-foreground" />;
    } else if (title.toLowerCase().includes("research")) {
      return <Search className="h-4 w-4 text-muted-foreground" />;
    } else if (title.toLowerCase().includes("finalizing")) {
      return <Pen className="h-4 w-4 text-muted-foreground" />;
    }
    return <Activity className="h-4 w-4 text-muted-foreground" />;
  };

  // Auto-collapse when loading completes but keep it visible
  useEffect(() => {
    if (!isLoading && processedEvents.length > 0) {
      setIsTimelineCollapsed(true);
    }
  }, [isLoading, processedEvents]);

  // Always render if there are events OR if currently loading
  if (!isLoading && processedEvents.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <Card className={cn(
        "transition-all duration-200",
        isTimelineCollapsed 
          ? "border-0 bg-transparent shadow-none" 
          : "border bg-card text-card-foreground shadow-sm"
      )}>
        <CardHeader className={cn(
          "transition-all duration-200",
          isTimelineCollapsed ? "pb-1 pt-2" : "pb-2"
        )}>
          <CardDescription 
            className={cn(
              "flex items-center justify-between cursor-pointer rounded-lg transition-all duration-200",
              isTimelineCollapsed 
                ? "hover:bg-muted/30 p-1 -m-1" 
                : "hover:bg-muted/50 p-2 -m-2"
            )}
            onClick={() => setIsTimelineCollapsed(!isTimelineCollapsed)}
          >
            <div className={cn(
              "flex items-center gap-2 transition-all duration-200",
              isTimelineCollapsed 
                ? "text-xs text-muted-foreground" 
                : "text-sm text-foreground"
            )}>
              <Activity className={cn(
                "transition-all duration-200",
                isTimelineCollapsed ? "h-3 w-3" : "h-4 w-4"
              )} />
              <span className={cn(
                "transition-all duration-200",
                isTimelineCollapsed ? "font-normal text-xs" : "font-medium"
              )}>
                Agent Activity
              </span>
              {processedEvents.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({processedEvents.length} step{processedEvents.length !== 1 ? 's' : ''})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isLoading && (
                <Loader2 className={cn(
                  "text-muted-foreground animate-spin transition-all duration-200",
                  isTimelineCollapsed ? "h-2.5 w-2.5" : "h-3 w-3"
                )} />
              )}
              {isTimelineCollapsed ? (
                <ChevronDown className={cn(
                  "text-muted-foreground transition-all duration-200",
                  isTimelineCollapsed ? "h-3 w-3" : "h-4 w-4"
                )} />
              ) : (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CardDescription>
        </CardHeader>
        
        {!isTimelineCollapsed && (
          <CardContent className="pt-0">
            <ScrollArea className="max-h-80 overflow-y-auto">
              {isLoading && processedEvents.length === 0 && (
                <div className="relative pl-12 pb-4">
                  <div className="absolute left-4 top-3.5 h-full w-0.5 bg-border" />
                  <div className="absolute left-1.5 top-2 h-5 w-5 rounded-full bg-muted flex items-center justify-center ring-4 ring-background">
                    <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground font-medium">
                      Processing...
                    </p>
                  </div>
                </div>
              )}
              
              {processedEvents.length > 0 && (
                <div className="space-y-0">
                  {processedEvents.map((eventItem, index) => (
                    <div key={index} className="relative pl-12 pb-4">
                      {index < processedEvents.length - 1 ||
                      (isLoading && index === processedEvents.length - 1) ? (
                        <div className="absolute left-4 top-3.5 h-full w-0.5 bg-border" />
                      ) : null}
                      <div className="absolute left-1 top-2 h-6 w-6 rounded-full bg-muted flex items-center justify-center ring-4 ring-background">
                        {getEventIcon(eventItem.title, index)}
                      </div>
                      <div>
                        <p className="text-sm text-foreground font-medium mb-0.5">
                          {eventItem.title}
                        </p>
                        <div className="text-xs text-muted-foreground leading-relaxed">
                          {typeof eventItem.data === "string" ? (
                            eventItem.data.split('\n').map((line, lineIdx) => (
                              <div key={lineIdx} className="mb-0.5 last:mb-0">
                                {line.trim() && <span>{line}</span>}
                              </div>
                            ))
                          ) : Array.isArray(eventItem.data) ? (
                            <span>{(eventItem.data as string[]).join(", ")}</span>
                          ) : (
                            <span>{JSON.stringify(eventItem.data)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && processedEvents.length > 0 && (
                    <div className="relative pl-12 pb-4">
                      <div className="absolute left-1.5 top-2 h-5 w-5 rounded-full bg-muted flex items-center justify-center ring-4 ring-background">
                        <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />
                      </div>
                      <div>
                        <p className="text-sm text-foreground font-medium">
                          Processing...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
                )}
      </Card>
    </div>
  );
} 