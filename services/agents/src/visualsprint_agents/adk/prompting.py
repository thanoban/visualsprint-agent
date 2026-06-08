"""Prompt builders for the VisualSprint ADK-backed agent path."""

from __future__ import annotations

from visualsprint_agents.adk.shared import AgentBlueprint


def render_instruction_text(
    blueprint: AgentBlueprint,
    *,
    input_contract: str,
    output_contract: str,
    output_schema_enforced: bool,
) -> str:
    lines = [
        f"You are {blueprint.display_name}.",
        blueprint.goal,
        f"The incoming user message will be a JSON object that matches the `{input_contract}` contract.",
        "",
        "Follow these rules exactly:",
    ]
    for index, instruction in enumerate(blueprint.instructions, start=1):
        lines.append(f"{index}. {instruction}")
    lines.extend(
        [
            "",
            "Tool usage rules:",
            "- Use tools only when they materially improve correctness or persistence.",
            "- If a tool returns no useful result, continue safely without inventing data.",
        ]
    )
    if output_schema_enforced:
        lines.append(
            f"- Return your final answer as a JSON object that matches `{output_contract}` exactly."
        )
    else:
        lines.extend(
            [
                (
                    f"- Return your final answer as raw JSON that matches `{output_contract}` exactly."
                ),
                (
                    "- Do not wrap the JSON in markdown, prose, code fences, or explanatory text."
                ),
                (
                    "- Preserve schema-valid field names and omit any values you cannot justify from the input."
                ),
            ]
        )
    return "\n".join(lines)
