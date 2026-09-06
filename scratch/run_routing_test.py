import json
from backend.app.agents.triage_agent import handle_query

farmer_id = "test_farmer"
queries = [
    "I have 5 acres in Multan and limited water. What should I plant?",
    "How much fertilizer will I need?",
    "What is the wheat price in Multan?",
    "My cotton leaves are curling and I see white insects.",
    "How much profit could I make?",
    "Will it rain in Multan tomorrow?",
]

print("--- Multi-Agent Routing Test---")
for i, q in enumerate(queries, 1):
    result = handle_query(q, farmer_id)
    print(f"{i}. Query: {q}\n   Agent: {result.get('agent')}\n   Category: {result.get('category')}\n   Response: {result.get('response')}\n   Context: {result.get('context')}\n")
