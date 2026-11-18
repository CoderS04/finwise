"""
Finwise AI Module

Provides a safe, explainable AI assistant for financial queries.
Architecture:
  1. Financial Analyzer: Fetches & summarizes data
  2. Rule Engine: Blocks dangerous questions
  3. Prompt Builder: Injects verified context
  4. LLM Client: Calls Ollama Phi model
  5. Response Validator: Post-LLM safety
"""
