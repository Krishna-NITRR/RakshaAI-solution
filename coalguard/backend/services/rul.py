import importlib.util
from pathlib import Path
from typing import Any


ENGINE_PATH = Path(__file__).resolve().parents[3] / "khaan-netra" / "pred_engine.py"


def _load_engine():
    spec = importlib.util.spec_from_file_location("rakshaai_pred_engine", ENGINE_PATH)
    if spec is None or spec.loader is None:
        raise ImportError(f"Unable to load RUL engine from {ENGINE_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def predict_rul(sensor_values: dict[str, Any]) -> dict[str, Any]:
    """Run the shared edge predictor and return a normalized prediction."""
    engine = _load_engine()
    return engine.predict_rul(sensor_values)
