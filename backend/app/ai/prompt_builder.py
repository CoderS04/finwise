"""
Prompt Builder: Context-Limited Prompt Construction

Builds structured prompts with:
- Fixed system prompt (boundaries)
- User question
- Injected context (no raw data)

Strategy: Constrain LLM to ONLY explain verified financial facts.
"""


def build_prompt(user_message: str, context: dict) -> dict:
    """
    Builds a structured prompt for the LLM.
    
    Args:
        user_message: User's question
        context: Summarized financial data (from analyzer)
    
    Returns:
        dict with 'system', 'user', 'context' keys
    """

    system_prompt = (
        "You are Finwise, a helpful financial assistant for Finwise app.\n\n"
        "YOUR STRICT BOUNDARIES:\n"
        "- You ONLY explain budgeting, spending, savings, and goals.\n"
        "- You NEVER give investment advice (no stocks, mutual funds, crypto, trading, etc.).\n"
        "- You NEVER give tax or legal advice.\n"
        "- You NEVER invent facts or numbers - use ONLY the provided data.\n"
        "- You NEVER use words: invest, stock, crypto, trading, mutual fund, roi, dividend, profit, return.\n"
        "- IMPORTANT: If the user asks about a specific month (e.g., 'january', 'last month'), use the Multi-Month Breakdown data.\n"
        "- Be honest. If you don't know, say so.\n"
        "- If the user asks about investments/trading/crypto, decline politely.\n"
        "- ALWAYS respond with 2-3 sentences maximum.\n\n"
        "TONE: Friendly, clear, non-judgmental, factual.\n"
    )

    # Format context for injection
    context_str = _format_context(context)

    return {
        "system": system_prompt,
        "user": user_message,
        "context": context_str
    }


def _format_context(context: dict) -> str:
    """
    Formats summarized financial context for LLM consumption.
    No raw transactions, only aggregates.
    """

    lines = [
        "=== YOUR FINANCIAL SNAPSHOT ===",
        f"Accounts: {context.get('accounts', 0)}",
        f"Total Balance: ₹{context.get('total_balance', 0):,.2f}",
        "",
        f"This Month ({context.get('current_month')}/{context.get('current_year')}):",
        f"  Income: ₹{context.get('monthly_income', 0):,.2f}",
        f"  Expenses: ₹{context.get('monthly_expense', 0):,.2f}",
        f"  Savings: ₹{context.get('monthly_savings', 0):,.2f}",
    ]

    # Add multi-month breakdown if available or if it was explicitly requested
    if context.get('monthly_breakdown'):
        # Show breakdown if multiple months OR if it was explicitly requested (requested_months list exists)
        should_show_breakdown = (
            len(context.get('monthly_breakdown', {})) > 1 or 
            context.get('requested_months')  # Always show if requested_months is present (user asked for specific months)
        )
        
        if should_show_breakdown:
            lines.append("")
            lines.append("REQUESTED MONTHS DATA:")
            for month_key in sorted(context['monthly_breakdown'].keys()):
                month_data = context['monthly_breakdown'][month_key]
                lines.append(
                    f"  {month_key}: Income ₹{month_data['income']:,.2f}, "
                    f"Expenses ₹{month_data['expense']:,.2f}, "
                    f"Savings ₹{month_data['savings']:,.2f}"
                )

    # Add category breakdown
    if context.get('categories'):
        lines.append("")
        lines.append("Spending by Category:")
        for cat in context['categories']:
            lines.append(
                f"  - {cat['name']}: ₹{cat['amount']:,.2f} ({cat['percentage']:.1f}%)"
            )

    if context.get('budgets'):
        lines.append("")
        lines.append("Budgets:")
        for budget in context['budgets']:
            lines.append(
                f"  - {budget['name']}: ₹{budget['spent']:,.2f} / ₹{budget['limit']:,.2f} "
                f"({budget['percentage']:.1f}%)"
            )

    if context.get('goals'):
        lines.append("")
        lines.append("Goals:")
        for goal in context['goals']:
            status = "✓ Completed" if goal['completed'] else f"{goal['progress']:.1f}% done"
            lines.append(
                f"  - {goal['name']} ({goal['type']}): ₹{goal['current']:,.2f} / ₹{goal['target']:,.2f} ({status})"
            )

    lines.append("")
    lines.append("=== END SNAPSHOT ===")

    return "\n".join(lines)
