from app.ai.financial_analyzer import analyze_user_finances
from app.ai.rule_engine import enforce_rules
from app.ai.prompt_builder import build_prompt
from app.ai.llm_client import call_llm
from app.ai.response_validator import validate_response
from app.ai.month_parser import parse_months_from_query


def handle_chat(user_id: int, user_message: str):
    # 1️⃣ Parse for month references in query
    requested_months = parse_months_from_query(user_message)
    
    # 2️⃣ Analyze financial context (with month-specific data if requested)
    context = analyze_user_finances(user_id, months=requested_months)

    # 3️⃣ Apply rule engine
    allowed, reason = enforce_rules(user_message)
    if not allowed:
        return {
            "response": reason,
            "safe": True
        }

    # 4️⃣ Build prompt
    prompt = build_prompt(user_message, context)

    # 5️⃣ Call LLM
    raw_response = call_llm(prompt)

    # 6️⃣ Validate output
    final_response = validate_response(raw_response)

    return {
        "response": final_response,
        "safe": True
    }
