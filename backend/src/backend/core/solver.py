from typing import List, Dict, Any, Optional
from z3 import Solver, Bool, Implies, And, Not, sat, unsat

class LegalConstraintEngine:
    """
    Neuro-symbolic legal reasoning engine using Microsoft Z3 SMT Solver.
    Validates logical consistency between Observations (facts), 
    Constraints (statutory rules), and Conclusions (claims).
    """

    def __init__(self):
        self.solver = Solver()
        # Enable tracking of the minimal unsatisfiable subset (the conflict core)
        self.solver.set(unsat_core=True)
        self.predicates: Dict[str, Any] = {}

    def _get_var(self, name: str) -> Any:
        cleaned = name.strip().replace(" ", "_").lower()
        if cleaned not in self.predicates:
            self.predicates[cleaned] = Bool(cleaned)
        return self.predicates[cleaned]

    def verify_pathway(
        self,
        observations: List[str],
        constraints: List[Dict[str, Any]],
        hypothetical_conclusion: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        - observations: Ground factual premises, e.g. ["limitation_period_elapsed", "contract_signed"]
        - constraints: Statutory logic rules, e.g. [
            {
              "id": "rule_sec_4_ontario_limitations",
              "premise": ["limitation_period_elapsed"],
              "conclusion": "claim_barred"
            }
          ]
        - hypothetical_conclusion: The user's intended legal claim, e.g. "claim_actionable"
        """
        self.solver.reset()
        self.predicates.clear()

        # 1. Assert Observations (Facts)
        for idx, obs in enumerate(observations):
            var = self._get_var(obs)
            tag = Bool(f"fact_{idx}_{obs[:20]}")
            # Assert with tracking assumption tag
            self.solver.assert_and_track(var == True, tag)

        # 2. Assert Constraints (Rules)
        for idx, rule in enumerate(constraints):
            rule_id = rule.get("id", f"rule_{idx}")
            premises = [self._get_var(p) for p in rule["premise"]]
            conclusion_var = self._get_var(rule["conclusion"])
            negate = rule.get("negate_conclusion", False)
            
            target = Not(conclusion_var) if negate else conclusion_var
            # Premise_1 AND Premise_2 => Target
            implication = Implies(And(*premises), target)
            
            tag = Bool(f"rule_{rule_id}")
            self.solver.assert_and_track(implication, tag)

        # 3. If testing a hypothetical conclusion, test if its negation causes UNSAT
        if hypothetical_conclusion:
            hypo_var = self._get_var(hypothetical_conclusion)
            hypo_tag = Bool(f"claim_{hypothetical_conclusion}")
            self.solver.assert_and_track(hypo_var == True, hypo_tag)

        # 4. Run SMT satisfiability check
        result = self.solver.check()

        if result == sat:
            model = self.solver.model()
            truth_assignments = {str(d): bool(model[d]) for d in model.decls()}
            return {
                "status": "VALID_PATHWAY",
                "satisfied": True,
                "conflict_detected": False,
                "conflict_core": [],
                "truth_assignments": truth_assignments,
                "message": "All case observations align with legal statutory constraints."
            }
        else:
            # Extract the exact minimal set of conflicting rules/facts
            core = [str(clause) for clause in self.solver.unsat_core()]
            return {
                "status": "CONTRADICTION_FOUND",
                "satisfied": False,
                "conflict_detected": True,
                "conflict_core": core,
                "truth_assignments": {},
                "message": "Fatal legal contradiction detected between case observations and statutory rules."
            }