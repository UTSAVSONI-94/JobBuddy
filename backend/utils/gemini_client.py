import os
import json
import urllib.request
import utils.env_loader

def call_gemini(prompt: str, system_instruction: str = "", json_mode: bool = False) -> str:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or api_key == "your_gemini_api_key_here":
        return ""

    is_bearer = api_key.startswith("AQ.") or api_key.startswith("ya29.")

    for model_name in ["gemini-2.0-flash", "gemini-1.5-flash"]:
        headers = {"Content-Type": "application/json"}
        if is_bearer:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
            headers["Authorization"] = f"Bearer {api_key}"
        else:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"

        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ]
        }

        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        if json_mode:
            payload["generationConfig"] = {
                "responseMimeType": "application/json"
            }

        try:
            req_data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=req_data,
                headers=headers
            )
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts and "text" in parts[0]:
                        return parts[0]["text"].strip()
        except Exception as e:
            print(f"Gemini call error with {model_name}: {e}")
            continue

    return ""
