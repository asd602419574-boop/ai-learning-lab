from pathlib import Path
import re

html = (Path(__file__).resolve().parents[1] / "index.html").read_text(encoding="utf-8")
assert "<!DOCTYPE html>" in html
assert "AI 探索实验室" in html
for feature in ("reviewCards", "missions", "labThreshold", "labTrainSplit", "questionStats", "ai_foundations_learning_v1"):
    assert feature in html, f"Missing feature: {feature}"
assert "render();" in html
print("V1.2 static smoke checks passed")
