# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from dataclasses import dataclass
from genlayer import *


@allow_storage
@dataclass
class GrantApplication:
    id: str
    applicant: str
    github_url: str
    project_url: str
    is_evaluated: bool
    score: u256
    feedback: str
    is_approved: bool


class AutoGrant(gl.Contract):
    applications: TreeMap[str, GrantApplication]
    min_score_for_approval: u256

    def __init__(self, min_score: int = 70):
        self.min_score_for_approval = min_score

    def _evaluate_impact(self, github_url: str, project_url: str) -> dict:
        # Use prompt_non_comparative: leader runs the task, validators only judge the output
        # This handles LLM non-determinism correctly via criteria-based consensus
        result_str = gl.eq_principle.prompt_non_comparative(
            lambda: (
                gl.nondet.web.get(github_url).body.decode("utf-8")[:2000]
                + "\n\n---WEBSITE---\n\n"
                + gl.nondet.web.get(project_url).body.decode("utf-8")[:2000]
            ),
            task="""You are a Web3 Public Goods grant evaluator.
Based on the GitHub repository content and website content provided, evaluate the project.
Score from 0 to 100:
- Technical quality (0-30): code activity, documentation, commits
- Usefulness and Impact (0-40): how useful this is for the ecosystem
- Clarity (0-30): README quality, clear description

Respond ONLY with a valid JSON object like this (no markdown):
{"score": 72, "feedback": "One sentence summary of the evaluation."}""",
            criteria="""The output must be a valid JSON object with exactly two keys:
- "score": an integer between 0 and 100
- "feedback": a non-empty string summarizing the evaluation
No markdown, no extra text, only the JSON object."""
        )

        result_json = json.loads(result_str)
        return result_json

    @gl.public.write
    def submit_application(self, github_url: str, project_url: str) -> None:
        sender_address = gl.message.sender_address.as_hex
        app_id = f"{sender_address}_{github_url}".lower()

        if app_id in self.applications:
            raise Exception("Application already submitted")

        app = GrantApplication(
            id=app_id,
            applicant=sender_address,
            github_url=github_url,
            project_url=project_url,
            is_evaluated=False,
            score=0,
            feedback="",
            is_approved=False
        )
        self.applications[app_id] = app

    @gl.public.write
    def evaluate_application(self, app_id: str) -> None:
        if app_id not in self.applications:
            raise Exception("Application not found")

        app = self.applications[app_id]

        if app.is_evaluated:
            raise Exception("Application already evaluated")

        evaluation_status = self._evaluate_impact(app.github_url, app.project_url)

        app.is_evaluated = True
        app.score = int(evaluation_status["score"])
        app.feedback = str(evaluation_status["feedback"])
        app.is_approved = app.score >= self.min_score_for_approval

    @gl.public.view
    def get_application(self, app_id: str) -> dict:
        if app_id not in self.applications:
            raise Exception("Application not found")

        app = self.applications[app_id]
        return {
            "id": app.id,
            "applicant": app.applicant,
            "github_url": app.github_url,
            "project_url": app.project_url,
            "is_evaluated": app.is_evaluated,
            "score": app.score,
            "feedback": app.feedback,
            "is_approved": app.is_approved
        }
