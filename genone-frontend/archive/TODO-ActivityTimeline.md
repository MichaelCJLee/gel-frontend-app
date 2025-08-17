# ActivityTimeline TODO - Future Enhancements

## 🎯 Current Status (Completed)
- ✅ Fixed ActivityTimeline disappearing after logout/login
- ✅ Implemented clean message content filtering (raw JSON → placeholder)
- ✅ ActivityTimeline now shows only during live streaming sessions
- ✅ Historical messages show clean conversation view without timeline clutter
- ✅ Basic formatting for `progressive_search` events

## 🚀 Future Enhancements

### 1. Event Type Support & Formatting
**Priority: High**
- [ ] Add proper formatting for all agent event types:
  - [ ] `web_search_gemini` events
  - [ ] `get_knowledge_details` events
  - [ ] Custom tool events
  - [ ] Error/timeout events
- [ ] Implement event-specific icons and styling
- [ ] Add event duration/performance metrics display
- [ ] Create event type registry for extensibility

### 2. Historical Timeline Management
**Priority: Medium**
- [ ] Add user preference toggle: "Show historical timelines"
- [ ] Implement timeline visibility state persistence across sessions
- [ ] Add conversation-level timeline settings
- [ ] Consider timeline archival for old conversations

### 3. Timeline UX Improvements
**Priority: Medium**
- [ ] Add timeline filtering by event type
- [ ] Implement event search functionality
- [ ] Add event grouping by time periods or tool types
- [ ] Create event details modal/popup for complex events
- [ ] Add timeline replay functionality
- [ ] Implement better visual feedback for real-time streaming

### 4. Message Content Enhancement
**Priority: High**
- [ ] Improve raw JSON detection patterns for different LangGraph message types
- [ ] Add smarter content extraction from LangGraph messages
- [ ] Extract actual AI response content instead of using placeholder
- [ ] Implement fallback content generation based on agent steps
- [ ] Add "Show raw data" toggle for debugging purposes
- [ ] Better error message handling for failed agent steps

### 5. Export & Sharing
**Priority: Low**
- [ ] Add timeline export capabilities (JSON, CSV, etc.)
- [ ] Implement conversation sharing with/without timelines
- [ ] Add timeline screenshot/image export
- [ ] Create timeline summary generation

### 6. Accessibility & Performance
**Priority: Medium**
- [ ] Add ARIA labels and keyboard navigation
- [ ] Implement virtual scrolling for large timelines
- [ ] Add timeline themes/customization options
- [ ] Optimize re-rendering performance
- [ ] Add loading states for timeline data

### 7. Developer Experience
**Priority: Low**
- [ ] Add timeline debugging tools
- [ ] Create timeline event testing utilities
- [ ] Implement timeline performance monitoring
- [ ] Add comprehensive timeline documentation

## 🔧 Technical Debt

### Code Organization
- [ ] Extract timeline formatting logic into separate utility functions
- [ ] Create timeline event type definitions
- [ ] Implement proper error boundaries for timeline components
- [ ] Add comprehensive unit tests for timeline functionality

### Backend Integration
- [ ] Improve agent step data structure from backend
- [ ] Add timeline-specific metadata to agent steps
- [ ] Implement timeline data compression for large conversations
- [ ] Add timeline data validation

## 📝 Implementation Notes

### Current Architecture
```
LangGraphChatInterface.tsx - Main timeline state management
├── Live Events: liveActivityEvents (ProcessedEvent[])
├── Historical: historicalActivities (Record<string, ProcessedEvent[]>)
└── Conversion: AgentStep[] → ProcessedEvent[] (currently disabled for historical)

LangGraphMessageList.tsx - Timeline display logic
├── shouldShowActivityTimeline - Controls timeline visibility
├── AiMessageBubble - Message content filtering
└── ActivityTimeline - Timeline rendering component
```

### Key Design Decisions
1. **Live-only timeline**: Currently only shows timeline during active streaming
2. **Clean history**: Historical messages show without timeline for cleaner UX
3. **Content filtering**: Raw JSON replaced with placeholder text
4. **State management**: Timeline state cleared on conversation switch

### Future Architecture Considerations
- Consider moving timeline logic to separate context/hook
- Implement timeline data caching strategy
- Add timeline event bus for better decoupling
- Consider server-side timeline rendering for complex events

## 🎯 Next Steps
1. **Immediate**: Test current implementation thoroughly
2. **Short-term**: Implement formatting for other event types
3. **Medium-term**: Add user preference for historical timeline display
4. **Long-term**: Comprehensive timeline enhancement based on user feedback

---
*Last updated: 2025-06-24*
*Status: Live-only timeline implementation complete*
