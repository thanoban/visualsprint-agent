# VisualSprint API

This service is the deterministic control-plane foundation for VisualSprint.

Current responsibilities in phase 1:

- expose service health
- publish product and architecture metadata for local integration
- define the place where deterministic meeting workflows will grow

Local development:

```powershell
python -m uvicorn visualsprint_api.main:app --app-dir services/api/src --reload --host 127.0.0.1 --port 8000
```
