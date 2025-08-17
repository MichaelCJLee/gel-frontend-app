[LangGraphService] Processing line: data: {"type": "stream_start", "stream_mode": "updates", "timestamp": "2025-06-24T11:47:45.871232", "thread_id": "user_42f59e2a-abd2-485a-bddf-cdaf9e69f275_session_ffa0c2ec"}
langGraphService.ts:174 [LangGraphService] Parsed event data: Object
langGraphService.ts:179 [LangGraphService] Calling onEvent with: Object
useStreamingSession.ts:133 [useStreamingSession] Received event: Object
LangGraphChatInterface.tsx:86 [LangGraphChatInterface] Received event: Object for messageId: 1750765665346_0kl21hnca
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 0 (user): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 1 (assistant): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 2 (user): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 3 (assistant): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 0 (user): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 1 (assistant): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 2 (user): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 3 (assistant): Object
LangGraphMessageList.tsx:118 [AiMessageBubble] Message 1750765657302_e4cyz49qw: Object
LangGraphMessageList.tsx:118 [AiMessageBubble] Message 1750765657302_e4cyz49qw: Object
LangGraphMessageList.tsx:118 [AiMessageBubble] Message 1750765665346_0kl21hnca: Object
LangGraphMessageList.tsx:118 [AiMessageBubble] Message 1750765665346_0kl21hnca: Object
langGraphService.ts:159 [LangGraphService] Processing line: event: update
langGraphService.ts:159 [LangGraphService] Processing line: data: {"node": "agent", "content": {"messages": [{"type": "AIMessage", "content": "", "metadata": {"id": "run--5ff6738c-55e8-4264-9854-2459aef030c3-0", "name": null, "tool_calls": [{"name": "progressive_search", "args": {"query": "what is som?", "sources": ["ado", "confluence"], "include_vector": true}, "id": "64573365-369f-46a8-b6af-65b2cb87c562", "type": "tool_call"}], "additional_kwargs": {"function_call": {"name": "progressive_search", "arguments": "{\"query\": \"what is som?\", \"sources\": [\"ado\", \"confluence\"], \"include_vector\": true}"}}}}]}, "timestamp": "2025-06-24T11:47:47.535331"}
langGraphService.ts:174 [LangGraphService] Parsed event data: Object
langGraphService.ts:179 [LangGraphService] Calling onEvent with: Object
useStreamingSession.ts:133 [useStreamingSession] Received event: Object
LangGraphChatInterface.tsx:86 [LangGraphChatInterface] Received event: Object for messageId: 1750765665346_0kl21hnca
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 0 (user): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 1 (assistant): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 2 (user): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 3 (assistant): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 0 (user): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 1 (assistant): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 2 (user): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 3 (assistant): Object
LangGraphMessageList.tsx:118 [AiMessageBubble] Message 1750765657302_e4cyz49qw: Object
LangGraphMessageList.tsx:118 [AiMessageBubble] Message 1750765657302_e4cyz49qw: Object
LangGraphMessageList.tsx:118 [AiMessageBubble] Message 1750765665346_0kl21hnca: Object
LangGraphMessageList.tsx:118 [AiMessageBubble] Message 1750765665346_0kl21hnca: Object
langGraphService.ts:159 [LangGraphService] Processing line: event: progress
langGraphService.ts:159 [LangGraphService] Processing line: data: {"type": "chunk_processed", "timestamp": "2025-06-24T11:47:47.535403"}
langGraphService.ts:174 [LangGraphService] Parsed event data: Object
langGraphService.ts:159 [LangGraphService] Processing line: event: update
langGraphService.ts:159 [LangGraphService] Processing line: data: {"node": "tools", "content": {"messages": [{"type": "ToolMessage", "content": "{\"success\": true, \"query\": \"what is som?\", \"total_execution_time\": 10.71059513092041, \"parallel_execution\": true, \"source_summaries\": {\"confluence\": {\"success\": true, \"count\": 10, \"search_tier\": 2, \"execution_time\": 1.9073486328125e-06}, \"ado\": {\"success\": true, \"count\": 10, \"search_tier\": 1, \"execution_time\": 2.1457672119140625e-06}, \"vector\": {\"success\": true, \"count\": 5, \"search_tier\": \"vector_semantic_search\", \"execution_time\": 5.9604644775390625e-06}}, \"fusion_results\": {\"success\": true, \"fusion_strategy\": \"multi_method_combination\", \"total_unique_items\": 24, \"overlap_analysis\": {\"items_found_by_multiple_methods\": 1, \"ado_only\": 10, \"confluence_only\": 13, \"vector_discovered\": 5, \"high_confidence_items\": 1}, \"ranked_results\": [{\"id\": \"1407157375\", \"title\": \"SOM Environment details\", \"fusion_score\": 0.9, \"discovery_methods\": [\"progressive_confluence_flexible_substring_search\", \"vector_confluence_vector_semantic_search\"], \"method_scores\": {\"progressive_confluence_flexible_substring_search\": 0.8, \"vector_confluence_vector_semantic_search\": 0.6905007639999999}, \"confidence_level\": \"very_high\", \"source\": \"confluence\", \"content_type\": \"confluence_page\", \"space_key\": \"ARC\", \"space_name\": \"ARC Space\", \"url\": \"https://onenz.atlassian.net/wiki/spaces/ARC/pages/1407157375\", \"enhanced_summary\": \"This document details the environment setup for the OneNZ telecom's Service Order Management (SOM) application, outlining its production, development, and pre-production environments, their integration points with systems like Salesforce and BRM, and their roles in supporting the prepaid service offering.\", \"content_analysis\": {\"document_type\": \"solution_design\", \"content_depth\": \"detailed\", \"technical_level\": \"intermediate\", \"completeness_score\": 7, \"clarity_score\": 8, \"documentation_value\": \"high\"}, \"business_context\": {\"domain\": \"telecommunications\", \"business_area\": \"prepaid_services\", \"stakeholders\": [\"SOM Development Team\", \"IT Operations\", \"Salesforce Administrators\", \"BRM Administrators\", \"Network Engineers\"], \"business_value\": \"Ensures smooth operation of the prepaid service by defining clear environment setups for development, testing, and production, minimizing risks and improving efficiency.\", \"confidence_level\": \"high\"}, \"technical_analysis\": {\"integration_complexity\": \"medium\", \"systems_involved\": [\"SOM\", \"Salesforce\", \"BRM\", \"IPMS\", \"Network Elements\", \"Matrixx\"], \"data_formats\": [\"unknown\"], \"technical_patterns\": [\"Multi-environment architecture\", \"Integration with multiple systems\"], \"effort_estimate\": \"medium\"}, \"semantic_enrichment\": {\"intelligent_keywords\": [\"Service Order Management (SOM)\", \"OneNZ\", \"Telecom\", \"Prepaid Services\", \"Salesforce\", \"BRM\", \"IPMS\", \"Network Elements\", \"Production Environment\", \"Development Environment\", \"Pre-Production Environment\", \"Integration Points\", \"SPID\", \"xVNE\", \"Matrixx\"], \"business_concepts\": [\"Prepaid Service Order Management\", \"System Integration\", \"Production Deployment\", \"Testing\", \"Development\"], \"technical_concepts\": [\"Multi-environment architecture\", \"System Integration\", \"API Integration\", \"Sandbox Environment\"], \"confluence_themes\": [\"IT Infrastructure\", \"Application Architecture\", \"System Integration\"]}, \"confluence_specific\": {\"space_relevance\": \"high\", \"documentation_maturity\": \"developing\", \"cross_reference_potential\": \"medium\", \"update_frequency\": \"active\", \"page_hierarchy_level\": 3, \"related_pages_count\": 5}, \"content_intelligence\": {\"key_sections\": [\"Introduction\", \"Environment Overview\", \"Production Environment\", \"Development Environment\", \"Pre-Production Environment\"], \"code_examples_present\": false, \"diagrams_present\": false, \"integration_patterns\": [\"Northbound/Southbound Integration\"]}, \"quality_assessment\": {\"information_density\": \"high\", \"technical_accuracy\": \"medium\", \"documentation_completeness\": \"partial\", \"maintenance_status\": \"active\", \"requires_human_review\": true, \"analysis_reliability\": \"high\"}, \"metadata\": {\"source_system\": \"confluence\", \"space_key\": \"ARC\", \"space_name\": \"ARC Space\", \"extracted_content_type\": \"general_documentation\", \"created_date\": \"2024-07-05T04:02:24.756Z\", \"has_children\": true, \"attachments_count\": 0, \"content_size_bytes\": 14632, \"content_size_category\": \"medium\"}, \"search_optimization\": {\"search_text\": \"som environment details this document details the environment setup for the onenz telecom's service order management (som) application, outlining its production, development, and pre-production environments, their integratio service order management (som) onenz tele
langGraphService.ts:174 [LangGraphService] Parsed event data: Object
langGraphService.ts:159 [LangGraphService] Processing line: event: progress
langGraphService.ts:159 [LangGraphService] Processing line: data: {"type": "chunk_processed", "timestamp": "2025-06-24T11:47:58.251722"}
langGraphService.ts:174 [LangGraphService] Parsed event data: Object
langGraphService.ts:159 [LangGraphService] Processing line: event: update
langGraphService.ts:159 [LangGraphService] Processing line: data: {"node": "agent", "content": {"messages": [{"type": "AIMessage", "content": "", "metadata": {"id": "run--99785f02-e391-45a4-bbbe-4d79125623ba-0", "name": null, "tool_calls": [{"name": "get_knowledge_details", "args": {"source_types": ["confluence", "ado", "ado", "ado", "ado"], "item_ids": ["1407157375", "453280", "348361", "449379", "533437"]}, "id": "b1c4e00e-dd08-403e-8d86-4fca059fcf46", "type": "tool_call"}], "additional_kwargs": {"function_call": {"name": "get_knowledge_details", "arguments": "{\"source_types\": [\"confluence\", \"ado\", \"ado\", \"ado\", \"ado\"], \"item_ids\": [\"1407157375\", \"453280\", \"348361\", \"449379\", \"533437\"]}"}}}}]}, "timestamp": "2025-06-24T11:48:01.439346"}
langGraphService.ts:174 [LangGraphService] Parsed event data: Object
langGraphService.ts:179 [LangGraphService] Calling onEvent with: Object
useStreamingSession.ts:133 [useStreamingSession] Received event: Object
LangGraphChatInterface.tsx:86 [LangGraphChatInterface] Received event: Object for messageId: 1750765665346_0kl21hnca
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 0 (user): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 1 (assistant): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 2 (user): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 3 (assistant): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 0 (user): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 1 (assistant): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 2 (user): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 3 (assistant): Object
LangGraphMessageList.tsx:118 [AiMessageBubble] Message 1750765657302_e4cyz49qw: Object
LangGraphMessageList.tsx:118 [AiMessageBubble] Message 1750765657302_e4cyz49qw: Object
LangGraphMessageList.tsx:118 [AiMessageBubble] Message 1750765665346_0kl21hnca: Object
LangGraphMessageList.tsx:118 [AiMessageBubble] Message 1750765665346_0kl21hnca: Object
langGraphService.ts:159 [LangGraphService] Processing line: event: progress
langGraphService.ts:159 [LangGraphService] Processing line: data: {"type": "chunk_processed", "timestamp": "2025-06-24T11:48:01.439461"}
langGraphService.ts:174 [LangGraphService] Parsed event data: Object
langGraphService.ts:159 [LangGraphService] Processing line: event: update
langGraphService.ts:159 [LangGraphService] Processing line: data: {"node": "tools", "content": {"messages": [{"type": "ToolMessage", "content": "{\"success\": true, \"items_requested\": 5, \"execution_time\": 0.01306915283203125, \"detailed_results\": {\"ado\": {\"success\": true, \"found_count\": 4, \"missing_count\": 0, \"missing_ids\": [], \"results\": {\"533437\": {\"work_item_id\": \"533437\", \"title\": \"TC036_MNP_Port In Cancel_Change Number_Verify that a Reject request from SOM/IPMS is updated with Valid IPMS status to user\", \"work_item_type\": \"\", \"state\": \"Design\", \"area_path\": \"One NZ\\\\T-One Programme\", \"assigned_to\": \"Unassigned\", \"created_date\": \"\\\"2024-12-20T08:31:34.69Z\\\"\", \"tags\": [], \"story_points\": null, \"description_summary\": \"\", \"acceptance_criteria_summary\": \"\", \"full_description\": \"# TC036_MNP_Port In Cancel_Change Number_Verify that a Reject request from SOM/IPMS is updated with Valid IPMS status to user\\n\\n## Related Items\\n\\n### Other Relationships\\n\\n- Microsoft.VSTS.Common.TestedBy-Reverse: [366600](https://dev.azure.com/vodafonenz/One%20NZ/_workitems/edit/366600)\\n\\n## Attachments\\n\\n- [TC036.docx](attachments/093e5fec-e00b-4d53-96e9-36371a1c6013)\\n\\n\", \"raw_content\": \"# TC036_MNP_Port In Cancel_Change Number_Verify that a Reject request from SOM/IPMS is updated with Valid IPMS status to user\\n\\n## Related Items\\n\\n### Other Relationships\\n\\n- Microsoft.VSTS.Common.TestedBy-Reverse: [366600](https://dev.azure.com/vodafonenz/One%20NZ/_workitems/edit/366600)\\n\\n## Attachments\\n\\n- [TC036.docx](attachments/093e5fec-e00b-4d53-96e9-36371a1c6013)\\n\\n\"}, \"453280\": {\"work_item_id\": \"453280\", \"title\": \"\\\"SOM | Addon Provisioning Pay Monthly\\\"\", \"work_item_type\": \"\", \"state\": \"To Do\", \"area_path\": \"One NZ\\\\T-One Programme\\\\T-One SOM\", \"assigned_to\": \"Vipul Zaroo\", \"created_date\": \"\\\"2024-09-16T22:39:30.23Z\\\"\", \"tags\": [\"PayMM\", \"SOM-T1-TD\", \"Unknown Drop\"], \"story_points\": null, \"description_summary\": \"\", \"acceptance_criteria_summary\": \"\", \"full_description\": \"# SOM | Addon Provisioning Pay Monthly\\n\\n## Description\\n\\n<div> </div><div>For add-ons such as SpaceX, the add-on provisioning solution is customized for pre-pay use cases and might not be suitable (require rework) when it comes to post-pay and would require updates. </div><div> </div>\\n\\n## Acceptance Criteria\\n\\n<ul><li>To be retrospectively adjusted while we do Postpay. </li> </ul>\\n\\n## Related Items\\n\\n### Parent\\n\\n- [450847](https://dev.azure.com/vodafonenz/One%20NZ/_workitems/edit/450847) - This work item is part of this parent item\\n\\n## Detailed Relationship References\\n\\n<!-- Debug: parent_id=450847, children=0, related_items=0 -->\\n\\n### Parent: Feature #450847 - Technical Debts/NFRs\\n**State:** Active  \\n**Driver:** paymm_user_stories (parent)  \\n**Summary:** <div> </div><a href=\\\"https://onenz.atlassian.net/wiki/spaces/ARC/pages/1543900195/T-One+Technical+Debts+SOM-xVNE\\\">T-One Technical Debts (SOM-xVNE) - Architecture COE - Confluence (atlassian.net)</a>  \\n**Local Reference:** [View Feature](..\\\\..\\\\feature\\\\work_item_450847\\\\index.md)  \\n\\n\", \"raw_content\": \"# SOM | Addon Provisioning Pay Monthly\\n\\n## Description\\n\\n<div> </div><div>For add-ons such as SpaceX, the add-on provisioning solution is customized for pre-pay use cases and might not be suitable (require rework) when it comes to post-pay and would require updates. </div><div> </div>\\n\\n## Acceptance Criteria\\n\\n<ul><li>To be retrospectively adjusted while we do Postpay. </li> </ul>\\n\\n## Related Items\\n\\n### Parent\\n\\n- [450847](https://dev.azure.com/vodafonenz/One%20NZ/_workitems/edit/450847) - This work item is part of this parent item\\n\\n## Detailed Relationship References\\n\\n<!-- Debug: parent_id=450847, children=0, related_items=0 -->\\n\\n### Parent: Feature #450847 - Technical Debts/NFRs\\n**State:** Active  \\n**Driver:** paymm_user_stories (parent)  \\n**Summary:** <div> </div><a href=\\\"https://onenz.atlassian.net/wiki/spaces/ARC/pages/1543900195/T-One+Technical+Debts+SOM-xVNE\\\">T-One Technical Debts (SOM-xVNE) - Architecture COE - Confluence (atlassian.net)</a>  \\n**Local Reference:** [View Feature](..\\\\..\\\\feature\\\\work_item_450847\\\\index.md)  \\n\\n\"}, \"449379\": {\"work_item_id\": \"449379\", \"title\": \"Deallocate SIM if customer cancels or changes the SIM\", \"work_item_type\": \"\", \"state\": \"Closed\", \"area_path\": \"One NZ\\\\T-One Programme\\\\T-One CRM\", \"assigned_to\": \"Vivek Majithiya\", \"created_date\": \"\\\"2024-09-09T05:31:25.737000+00:00\\\"\", \"tags\": [\"SimSwap\", \"sit_r1_d2a\", \"ST_R1_D5\"], \"story_points\": null, \"description_summary\": \"\", \"acceptance_criteria_summary\": \"\", \"full_description\": \"# Deallocate SIM if customer cancels or changes the SIM\\n\\n## Description\\n\\n<div>AS A Agent<br> </div><div>I WANT TO deallocate SIM if customer cancels/change
langGraphService.ts:174 [LangGraphService] Parsed event data: Object
langGraphService.ts:179 [LangGraphService] Calling onEvent with: Object
useStreamingSession.ts:133 [useStreamingSession] Received event: Object
LangGraphChatInterface.tsx:86 [LangGraphChatInterface] Received event: Object for messageId: 1750765665346_0kl21hnca
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 0 (user): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 1 (assistant): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 2 (user): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 3 (assistant): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 0 (user): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 1 (assistant): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 2 (user): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 3 (assistant): Object
LangGraphMessageList.tsx:118 [AiMessageBubble] Message 1750765657302_e4cyz49qw: Object
LangGraphMessageList.tsx:118 [AiMessageBubble] Message 1750765657302_e4cyz49qw: Object
LangGraphMessageList.tsx:118 [AiMessageBubble] Message 1750765665346_0kl21hnca: Object
LangGraphMessageList.tsx:118 [AiMessageBubble] Message 1750765665346_0kl21hnca: Object
langGraphService.ts:159 [LangGraphService] Processing line: event: progress
langGraphService.ts:159 [LangGraphService] Processing line: data: {"type": "chunk_processed", "timestamp": "2025-06-24T11:48:01.454633"}
langGraphService.ts:174 [LangGraphService] Parsed event data: Object
langGraphService.ts:159 [LangGraphService] Processing line: event: error
langGraphService.ts:159 [LangGraphService] Processing line: data: {"type": "stream_error", "error": "the connection is closed", "timestamp": "2025-06-24T11:48:08.197128"}
langGraphService.ts:174 [LangGraphService] Parsed event data: Object
langGraphService.ts:139 [LangGraphService] Stream completed, total events processed: 10
langGraphService.ts:198 [LangGraphService] Reader released
useStreamingSession.ts:166 [useStreamingSession] Streaming completed successfully
LangGraphChatInterface.tsx:126 [LangGraphChatInterface] Streaming completed for messageId: 1750765665346_0kl21hnca conversationId: 32dcff35-53e8-449b-bdd5-1f3f1a5cec06
LangGraphChatInterface.tsx:127 [LangGraphChatInterface] Final streamingContent: 
LangGraphChatInterface.tsx:128 [LangGraphChatInterface] Final streamingContentRef: 
LangGraphChatInterface.tsx:129 [LangGraphChatInterface] currentStreamingMessageId: null
LangGraphChatInterface.tsx:130 [LangGraphChatInterface] currentConversation: 32dcff35-53e8-449b-bdd5-1f3f1a5cec06
LangGraphChatInterface.tsx:131 [LangGraphChatInterface] liveActivityEvents count: 0
LangGraphChatInterface.tsx:139 [LangGraphChatInterface] Finalizing message with content: I've processed your request. The activity timeline above shows the steps I took. messageId: 1750765665346_0kl21hnca conversationId: 32dcff35-53e8-449b-bdd5-1f3f1a5cec06
ConversationContext.tsx:396 [ConversationContext] updateMessage called: Object
ConversationContext.tsx:407 [ConversationContext] Updating message: 1750765665346_0kl21hnca with updates: Object
LangGraphChatInterface.tsx:150 [LangGraphChatInterface] Current events from ref: 4 Array(4)
LangGraphChatInterface.tsx:154 [LangGraphChatInterface] Moving events to historical for message: 1750765665346_0kl21hnca
LangGraphChatInterface.tsx:155 [LangGraphChatInterface] Live events being moved: Array(4)
LangGraphChatInterface.tsx:160 [LangGraphChatInterface] New historical activities: Object
LangGraphChatInterface.tsx:167 [LangGraphChatInterface] Clearing state...
LangGraphChatInterface.tsx:254 [LangGraphChatInterface] streamMessage completed successfully
LangGraphChatInterface.tsx:278 === SEND MESSAGE END ===
2sessionService.ts:88 [SessionService] Initialized with apiBase: http://localhost:8000/api/v1
LangGraphChatInterface.tsx:154 [LangGraphChatInterface] Moving events to historical for message: 1750765665346_0kl21hnca
LangGraphChatInterface.tsx:155 [LangGraphChatInterface] Live events being moved: Array(4)
LangGraphChatInterface.tsx:160 [LangGraphChatInterface] New historical activities: Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 0 (user): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 1 (assistant): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 2 (user): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 3 (assistant): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 0 (user): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 1 (assistant): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 2 (user): Object
LangGraphMessageList.tsx:196 [LangGraphMessageList] Message 3 (assistant): Object
LangGraphMessageList.tsx:118 [AiMessageBubble] Message 1750765657302_e4cyz49qw: Object
LangGraphMessageList.tsx:118 [AiMessageBubble] Message 1750765657302_e4cyz49qw: Object
LangGraphMessageList.tsx:118 [AiMessageBubble] Message 1750765665346_0kl21hnca: Object
LangGraphMessageList.tsx:118 [AiMessageBubble] Message 1750765665346_0kl21hnca: Object